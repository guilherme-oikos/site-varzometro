import 'server-only';
import { revalidateTag } from 'next/cache';
import { jogosDoTime, timesDoBolao, type Jogo, type Palpite } from '@/lib/bolao';
import { lerBolao, lerJogos } from '@/lib/bolao-dados';
import { intervaloMinimo, JANELA_DE_JOGO_MS, sincronizarSeAtrasado } from '@/lib/bolao-sync';
import { TAG_BOLAO } from '@/lib/supabase/config';
import { supabaseServidor } from '@/lib/supabase/server';

/**
 * O lado servidor do palpite em /bolao. A página é estática e igual para todo
 * mundo; quem está logado pede estes dados pelo navegador, por duas rotas:
 *
 * - `GET /api/bolao/meu?rodada=N` (ou `?time=<slug>`) — os jogos sem cache e os
 *   palpites como a RLS mostra para a pessoa (o próprio em aberto incluído).
 *   Só lê, e responde rápido.
 * - `POST /api/bolao/atualizar` — traz o placar novo do football-data, se a
 *   última busca já passou do intervalo. Pode levar segundos (a API de lá é
 *   lenta), por isso roda depois e em separado: ninguém espera por ela para
 *   ver o próprio palpite.
 *
 * São rotas e não Server Actions de propósito. O Next enfileira as Server
 * Actions e segura a tela enquanto uma está pendente — com a busca do
 * football-data no meio, o gráfico da página ficava segundos no esqueleto.
 */

export type MeuBolao = {
  meuId: string;
  admin: boolean;
  sincronizadoEm: string | null;
  /** A última busca no football-data passou do intervalo: vale chamar a atualização. */
  atrasado: boolean;
  /** Os jogos pedidos (da rodada ou do time), frescos — a página pública pode ter até 5 minutos. */
  jogos: Jogo[];
  palpites: Palpite[];
  quemPalpitou: { jogo_id: number; autor_id: string }[];
  agora: number;
};

/** Quem está logado, ou `null`. `getUser` valida o token no Supabase. */
async function sessao() {
  const supabase = supabaseServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user ? { supabase, user } : null;
}

/** Tem jogo rolando ou que começou há menos de `JANELA_DE_JOGO_MS` e não encerrou. */
async function temJogoEmAndamento(supabase: ReturnType<typeof supabaseServidor>): Promise<boolean> {
  const agora = Date.now();
  const { count } = await supabase
    .from('bolao_jogos')
    .select('id', { count: 'exact', head: true })
    .in('status', ['agendado', 'ao_vivo'])
    .lte('inicio', new Date(agora).toISOString())
    .gte('inicio', new Date(agora - JANELA_DE_JOGO_MS).toISOString());
  return Boolean(count);
}

export type FiltroDoBolao = { rodada: number } | { time: string };

export async function lerMeuBolao(filtro: FiltroDoBolao): Promise<MeuBolao | null> {
  const logado = await sessao();
  if (!logado) return null;
  const { supabase, user } = logado;

  const [{ data: perfil }, bolao, emJogo] = await Promise.all([
    supabase.from('perfis').select('is_admin').eq('id', user.id).maybeSingle<{ is_admin: boolean }>(),
    lerBolao(supabase),
    temJogoEmAndamento(supabase),
  ]);
  if (!perfil) return null;

  const jogos =
    'rodada' in filtro
      ? bolao.jogos.filter((jogo) => jogo.rodada === filtro.rodada)
      : jogosDoTime(bolao.jogos, timesDoBolao(bolao.jogos).find((t) => t.slug === filtro.time)?.nome ?? '');
  const dados = await lerJogos(supabase, bolao, jogos.map((jogo) => jogo.id));
  const atrasado =
    !bolao.sincronizadoEm || Date.now() - new Date(bolao.sincronizadoEm).getTime() >= intervaloMinimo(emJogo);

  return {
    meuId: user.id,
    admin: perfil.is_admin,
    sincronizadoEm: bolao.sincronizadoEm,
    atrasado,
    jogos,
    palpites: dados.palpites,
    quemPalpitou: dados.quemPalpitou,
    agora: Date.now(),
  };
}

/**
 * Busca o placar novo se a última busca passou do intervalo. Só para quem
 * está logado: visitante não dispara consulta no football-data (o plano grátis
 * de lá é de 10 por minuto). Devolve se gravou algo — aí a página se refaz.
 */
export async function atualizarParaLogado(): Promise<{ sincronizou: boolean } | null> {
  const logado = await sessao();
  if (!logado) return null;
  const { supabase } = logado;

  const [{ data: estado }, emJogo, { data: perfil }] = await Promise.all([
    supabase.from('bolao_estado').select('sincronizado_em').maybeSingle<{ sincronizado_em: string | null }>(),
    temJogoEmAndamento(supabase),
    supabase.from('perfis').select('is_admin').eq('id', logado.user.id).maybeSingle<{ is_admin: boolean }>(),
  ]);

  // Admin grava com a própria sessão (`bolao_sincronizar` aceita); o resto, com
  // o CRON_SECRET. Sem isso, no dev — onde o CRON_SECRET costuma não existir —
  // a busca falhava calada a cada visita e o placar não entrava nunca.
  const sincronizou = await sincronizarSeAtrasado(
    estado?.sincronizado_em ?? null,
    emJogo,
    perfil?.is_admin ? supabase : undefined,
  );
  if (sincronizou) revalidateTag(TAG_BOLAO);
  return { sincronizou };
}

export type Lembrete = {
  /** Jogos que ainda aceitam palpite, nos próximos `JANELA_DO_LEMBRETE_DIAS`, sem o palpite da pessoa. */
  faltam: number;
  proximo: Pick<Jogo, 'id' | 'rodada' | 'mandante' | 'visitante' | 'inicio'> | null;
};

const JANELA_DO_LEMBRETE_DIAS = 7;

/**
 * "Faltam 3 jogos sem palpite, o primeiro começa em 2h." Esquecer de palpitar
 * é o que mais desanima num bolão; o aviso aparece no topo do /bolao para quem
 * está logado (`LembretePalpite`). Mesma regra de prazo de `bolao_aberto`.
 */
export async function lerLembrete(): Promise<Lembrete | null> {
  const logado = await sessao();
  if (!logado) return null;
  const { supabase, user } = logado;

  const agora = new Date();
  const limite = new Date(agora.getTime() + JANELA_DO_LEMBRETE_DIAS * 24 * 60 * 60 * 1000);
  const { data: jogos, error } = await supabase
    .from('bolao_jogos')
    .select('id, rodada, mandante, visitante, inicio')
    .eq('status', 'agendado')
    .eq('revelado', false)
    .gt('inicio', agora.toISOString())
    .lte('inicio', limite.toISOString())
    .order('inicio')
    .returns<Lembrete['proximo'][]>();
  if (error || !jogos?.length) return { faltam: 0, proximo: null };

  const ids = jogos.map((jogo) => jogo!.id);
  const { data: meus } = await supabase
    .from('bolao_palpites')
    .select('jogo_id')
    .eq('autor_id', user.id)
    .in('jogo_id', ids)
    .returns<{ jogo_id: number }[]>();
  const palpitados = new Set((meus ?? []).map((p) => p.jogo_id));
  const sem = jogos.filter((jogo) => !palpitados.has(jogo!.id));

  return { faltam: sem.length, proximo: sem[0] ?? null };
}
