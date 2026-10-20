import 'server-only';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { limparVariavel } from '@/lib/env';
import type { StatusJogo } from '@/lib/bolao';
import { SUPABASE_ANON_KEY, SUPABASE_URL } from '@/lib/supabase/config';

/**
 * Traz os jogos do Brasileirão do football-data.org e grava no banco.
 *
 * O plano grátis cobre a Série A ("BSA") e aceita 10 consultas por minuto. A
 * sincronização faz uma só: a temporada atual inteira. Quando o football-data
 * vira o campeonato (2026 → 2027), os jogos novos chegam com o ano novo em
 * `temporada` e o site passa a mostrar a temporada mais recente sozinho. Quem decide o que entra
 * (só jogo que ainda não começou) e o que não se sobrescreve (correção do
 * admin) é a função `bolao_sincronizar` no banco.
 *
 * Três caminhos chamam isto: o cron diário (/api/bolao/sincronizar), o botão
 * do admin no painel e a própria página do bolão no painel quando a última
 * sincronização passou do intervalo (ver `intervaloMinimo`).
 */

const API = 'https://api.football-data.org/v4/competitions/BSA/matches';

/**
 * Abaixo disso, abrir o painel não dispara outra busca. Com jogo em andamento,
 * 1 minuto: é quando o placar muda e a bancada fica atualizando a tela. É o
 * mínimo que faz sentido no plano grátis — 10 consultas por minuto, e várias
 * pessoas podem abrir o painel ao mesmo tempo. Fora de jogo nada muda, e 10
 * minutos sobram.
 */
const INTERVALO_EM_JOGO_MS = 60 * 1000;
const INTERVALO_FORA_DE_JOGO_MS = 10 * 60 * 1000;

/**
 * Quanto tempo depois do início um jogo ainda conta como "em andamento" para
 * a busca: 90 minutos, intervalo, acréscimos e o atraso da API para fechar o
 * placar, com folga.
 */
export const JANELA_DE_JOGO_MS = 4 * 60 * 60 * 1000;

export function intervaloMinimo(emJogo: boolean): number {
  return emJogo ? INTERVALO_EM_JOGO_MS : INTERVALO_FORA_DE_JOGO_MS;
}

const STATUS: Record<string, StatusJogo> = {
  SCHEDULED: 'agendado',
  TIMED: 'agendado',
  IN_PLAY: 'ao_vivo',
  PAUSED: 'ao_vivo',
  LIVE: 'ao_vivo',
  FINISHED: 'encerrado',
  AWARDED: 'encerrado',
  POSTPONED: 'adiado',
  SUSPENDED: 'adiado',
  CANCELLED: 'cancelado',
};

type TimeDaApi = { name?: string; shortName?: string; tla?: string; crest?: string };

type JogoDaApi = {
  id: number;
  utcDate: string;
  status: string;
  matchday: number | null;
  homeTeam: TimeDaApi;
  awayTeam: TimeDaApi;
  score?: { fullTime?: { home: number | null; away: number | null } };
  /** `startDate` "2026-01-28": o ano é a temporada. */
  season?: { startDate?: string | null };
};

export type JogoParaGravar = {
  id: number;
  /** Sem `season` no jogo, o banco usa o ano da data do jogo (ver `bolao_sincronizar`). */
  temporada: number | null;
  rodada: number;
  mandante: string;
  mandante_sigla: string;
  mandante_escudo: string | null;
  visitante: string;
  visitante_sigla: string;
  visitante_escudo: string | null;
  inicio: string;
  status: StatusJogo;
  gols_mandante: number | null;
  gols_visitante: number | null;
};

export type ResultadoSync = { ok: true; gravados: number; recebidos: number } | { ok: false; erro: string };

/**
 * Do endereço do escudo fica só o nome do arquivo, e só se for do servidor de
 * escudos do football-data. A rota /escudos/[arquivo] monta o resto.
 */
function arquivoDoEscudo(url: string | undefined): string | null {
  if (!url) return null;
  try {
    const endereco = new URL(url);
    if (endereco.hostname !== 'crests.football-data.org') return null;
    const arquivo = endereco.pathname.replace(/^\//, '');
    return /^\d+\.(png|svg)$/.test(arquivo) ? arquivo : null;
  } catch {
    return null;
  }
}

/** Nome curto do time sem mexer na capitalização (ver CLAUDE.md). */
function nomeDoTime(time: TimeDaApi): string {
  return (time.shortName || time.name || '?').trim();
}

function traduzir(jogo: JogoDaApi): JogoParaGravar | null {
  const status = STATUS[jogo.status];
  // Sem rodada ou com status desconhecido não dá para encaixar na tela.
  if (!status || !jogo.matchday) return null;

  const ano = Number(jogo.season?.startDate?.slice(0, 4));

  return {
    id: jogo.id,
    temporada: Number.isInteger(ano) && ano > 2000 ? ano : null,
    rodada: jogo.matchday,
    mandante: nomeDoTime(jogo.homeTeam),
    mandante_sigla: (jogo.homeTeam.tla ?? '').trim(),
    mandante_escudo: arquivoDoEscudo(jogo.homeTeam.crest),
    visitante: nomeDoTime(jogo.awayTeam),
    visitante_sigla: (jogo.awayTeam.tla ?? '').trim(),
    visitante_escudo: arquivoDoEscudo(jogo.awayTeam.crest),
    inicio: jogo.utcDate,
    status,
    // O placar parcial também vem em `fullTime` durante o jogo. Só interessa
    // gravado quando acaba; antes disso a tela mostra "Rolando".
    gols_mandante: status === 'encerrado' ? (jogo.score?.fullTime?.home ?? null) : null,
    gols_visitante: status === 'encerrado' ? (jogo.score?.fullTime?.away ?? null) : null,
  };
}

export async function buscarJogosDaApi(): Promise<JogoParaGravar[]> {
  const token = limparVariavel(process.env.FOOTBALL_DATA_TOKEN);
  if (!token) throw new Error('FOOTBALL_DATA_TOKEN não configurada.');

  // Prazo curto: quem espera é a pessoa abrindo o painel.
  const resposta = await fetch(API, {
    headers: { 'X-Auth-Token': token },
    cache: 'no-store',
    signal: AbortSignal.timeout(8000),
  });

  if (!resposta.ok) {
    // 403 é token recusado ou competição fora do plano; 429 é limite por minuto.
    const corpo = await resposta.text().catch(() => '');
    throw new Error(`football-data respondeu HTTP ${resposta.status}: ${corpo.slice(0, 200)}`);
  }

  const dados = (await resposta.json()) as { matches?: JogoDaApi[] };
  return (dados.matches ?? []).map(traduzir).filter((jogo): jogo is JogoParaGravar => jogo !== null);
}

/**
 * Cliente anônimo sem cache nenhum. `supabasePublico` não serve: ele põe as
 * consultas no cache do Next, e a gravação precisa chegar no banco toda vez.
 */
function clienteSemCache(): SupabaseClient {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) throw new Error('Supabase não configurado.');
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { fetch: (entrada, init) => fetch(entrada, { ...init, cache: 'no-store' }) },
  });
}

/**
 * Busca e grava. Com `cliente` (sessão do admin), a permissão vem do login;
 * sem ele, do CRON_SECRET, que o banco confere contra o hash guardado.
 *
 * Não lança: devolve o erro, para quem chamou decidir. Página nenhuma pode
 * cair porque a API de futebol está fora do ar.
 */
export async function sincronizarBolao(cliente?: SupabaseClient): Promise<ResultadoSync> {
  try {
    const jogos = await buscarJogosDaApi();
    const segredo = cliente ? null : limparVariavel(process.env.CRON_SECRET);
    if (!cliente && !segredo) throw new Error('CRON_SECRET não configurada.');

    const { data, error } = await (cliente ?? clienteSemCache()).rpc('bolao_sincronizar', {
      segredo,
      jogos,
    });
    if (error) throw new Error(`Supabase recusou: ${error.message}`);

    console.info(`[bolao] football-data: ${jogos.length} jogos recebidos, ${data} gravados.`);
    return { ok: true, gravados: Number(data ?? 0), recebidos: jogos.length };
  } catch (erro) {
    const mensagem = erro instanceof Error ? erro.message : String(erro);
    console.error(`[bolao] sincronização falhou: ${mensagem}`);
    return { ok: false, erro: mensagem };
  }
}

/** Última tentativa nesta instância do servidor, deu certo ou não. */
let ultimaTentativa = 0;

/**
 * Sincroniza só se a última passou do intervalo. Chamado quando alguém logado
 * abre o /bolao (`/api/bolao/atualizar`): com o cron diário do plano grátis da
 * Vercel, é o que deixa o placar entrar logo depois do jogo. `emJogo` é ter
 * jogo rolando ou que começou há menos de `JANELA_DE_JOGO_MS` e ainda não foi
 * encerrado.
 *
 * Busca que falha não grava `sincronizado_em`, então sem a trava abaixo cada
 * visita tentaria de novo — foi o que aconteceu com um `CRON_SECRET` diferente
 * do hash do banco: 2 a 3 segundos de football-data por visita, gravação
 * recusada, e a cota de 10 consultas por minuto de lá indo embora.
 */
export async function sincronizarSeAtrasado(sincronizadoEm: string | null, emJogo: boolean): Promise<boolean> {
  if (!limparVariavel(process.env.FOOTBALL_DATA_TOKEN)) return false;
  if (sincronizadoEm && Date.now() - new Date(sincronizadoEm).getTime() < intervaloMinimo(emJogo)) return false;
  if (Date.now() - ultimaTentativa < INTERVALO_EM_JOGO_MS) return false;
  ultimaTentativa = Date.now();
  const resultado = await sincronizarBolao();
  return resultado.ok;
}
