import 'server-only';
import { cache } from 'react';
import type { SupabaseClient } from '@supabase/supabase-js';
import { COLUNAS_JOGO, jogosDoTime, timesDoBolao, type Jogo, type LinhaRanking, type Palpite } from '@/lib/bolao';
import { simularBolao, simularPalpites, simularRodada } from '@/lib/bolao-simulacao';
import { supabaseConfigurado } from '@/lib/supabase/config';
import { supabasePublico } from '@/lib/supabase/publico';

/**
 * Leituras do bolão. Recebem o cliente de fora: a página pública passa o
 * anônimo com cache (`supabasePublico('bolao')`) e o painel passa o da sessão.
 * A mesma consulta devolve coisas diferentes para cada um — o dono enxerga o
 * próprio palpite em aberto, o visitante não — e quem decide isso é a RLS.
 *
 * Erro sobe, como em `posts.ts`: na revalidação o Next mantém a última página
 * boa em vez de publicar um bolão vazio.
 */

export type Bolao = {
  jogos: Jogo[];
  ranking: LinhaRanking[];
  sincronizadoEm: string | null;
};

export type Rodada = {
  palpites: Palpite[];
  /** Quem já palpitou em cada jogo, sem o placar. */
  quemPalpitou: { jogo_id: number; autor_id: string }[];
};

/**
 * Linha de `bolao_palpites_pontuados` como vem do banco. Lida com `*` e não
 * com a lista de colunas: até alguém rodar o 0004_resenha_e_zebra.sql, as
 * colunas `resenha`, `dobrado` e `pontos_base` não existem, e pedi-las pelo
 * nome derrubaria a página. Sem elas, vale o de antes: sem resenha, sem zebra.
 */
type LinhaDePalpite = Omit<Palpite, 'pontos_base' | 'resenha' | 'dobrado'> & Partial<Palpite>;

function palpiteDaLinha(linha: LinhaDePalpite): Palpite {
  return {
    jogo_id: linha.jogo_id,
    autor_id: linha.autor_id,
    gols_mandante: linha.gols_mandante,
    gols_visitante: linha.gols_visitante,
    pontos: linha.pontos,
    pontos_base: linha.pontos_base === undefined ? linha.pontos : linha.pontos_base,
    resenha: linha.resenha ?? null,
    dobrado: linha.dobrado ?? false,
  };
}

function falhou(onde: string, mensagem: string): never {
  console.error(`[bolao] Supabase recusou ${onde}: ${mensagem}`);
  throw new Error(`[bolao] falha ao ler ${onde}: ${mensagem}`);
}

export async function lerBolao(cliente: SupabaseClient): Promise<Bolao> {
  const [jogos, ranking, estado] = await Promise.all([
    cliente.from('bolao_jogos').select(COLUNAS_JOGO).order('inicio').order('id').returns<Jogo[]>(),
    cliente
      .from('bolao_ranking')
      .select('*')
      .order('pontos', { ascending: false })
      .order('exatos', { ascending: false })
      .order('resultados', { ascending: false })
      .order('ordem')
      .order('nome')
      .returns<LinhaRanking[]>(),
    cliente.from('bolao_estado').select('sincronizado_em').maybeSingle<{ sincronizado_em: string | null }>(),
  ]);

  if (jogos.error) falhou('os jogos', jogos.error.message);
  if (ranking.error) falhou('o ranking', ranking.error.message);
  if (estado.error) falhou('o estado', estado.error.message);

  return simularBolao({
    jogos: jogos.data,
    ranking: ranking.data,
    sincronizadoEm: estado.data?.sincronizado_em ?? null,
  });
}

export async function lerRodada(cliente: SupabaseClient, bolao: Bolao, rodada: number): Promise<Rodada> {
  const ids = bolao.jogos.filter((jogo) => jogo.rodada === rodada).map((jogo) => jogo.id);
  return lerJogos(cliente, bolao, ids);
}

/**
 * Palpites e "quem já palpitou" de uma lista de jogos — uma rodada, ou todos
 * os de um time (que se espalham por várias rodadas: `bolao_quem_palpitou` é
 * por rodada, então vai uma chamada para cada).
 */
export async function lerJogos(cliente: SupabaseClient, bolao: Bolao, ids: number[]): Promise<Rodada> {
  if (ids.length === 0) return { palpites: [], quemPalpitou: [] };
  const rodadas = Array.from(
    new Set(bolao.jogos.filter((jogo) => ids.includes(jogo.id)).map((jogo) => jogo.rodada)),
  );

  const [palpites, ...quem] = await Promise.all([
    cliente
      .from('bolao_palpites_pontuados')
      .select('*')
      .in('jogo_id', ids)
      .returns<LinhaDePalpite[]>(),
    // `get: true` para a chamada sair como GET e entrar no cache do Next como
    // as outras consultas.
    ...rodadas.map((rodada) => cliente.rpc('bolao_quem_palpitou', { rodada_alvo: rodada }, { get: true })),
  ]);

  if (palpites.error) falhou('os palpites', palpites.error.message);
  const quemPalpitou: Rodada['quemPalpitou'] = [];
  for (const resposta of quem) {
    if (resposta.error) falhou('quem palpitou', resposta.error.message);
    for (const linha of (resposta.data ?? []) as Rodada['quemPalpitou']) {
      if (ids.includes(linha.jogo_id)) quemPalpitou.push(linha);
    }
  }

  return simularRodada(bolao, ids, { palpites: palpites.data.map(palpiteDaLinha), quemPalpitou });
}

/**
 * Todos os palpites de jogo encerrado — base do campeão da rodada, da evolução
 * e do "próprio time". O PostgREST devolve no máximo 1.000 linhas por vez, e o
 * campeonato inteiro passa disso (5 pessoas × 380 jogos), então vai em páginas.
 */
export async function lerPalpitesEncerrados(cliente: SupabaseClient, bolao: Bolao): Promise<Palpite[]> {
  const PAGINA = 1000;
  const todos: Palpite[] = [];
  for (let inicio = 0; ; inicio += PAGINA) {
    const { data, error } = await cliente
      .from('bolao_palpites_pontuados')
      .select('*')
      .not('pontos', 'is', null)
      .order('jogo_id')
      .order('autor_id')
      .range(inicio, inicio + PAGINA - 1)
      .returns<LinhaDePalpite[]>();
    if (error) falhou('o histórico de palpites', error.message);
    todos.push(...data.map(palpiteDaLinha));
    if (data.length < PAGINA) break;
  }
  return simularPalpites(bolao, null, todos);
}

/* --------------------------------------------------------- Site público -- */

/** Sem Supabase (dev sem conta), o bolão simplesmente não existe. */
export const getBolaoPublico = cache(async (): Promise<Bolao | null> => {
  if (!supabaseConfigurado) return null;
  return lerBolao(supabasePublico('bolao'));
});

export const getRodadaPublica = cache(async (rodada: number): Promise<Rodada> => {
  const bolao = await getBolaoPublico();
  if (!bolao) return { palpites: [], quemPalpitou: [] };
  return lerRodada(supabasePublico('bolao'), bolao, rodada);
});

export const getHistoricoPublico = cache(async (): Promise<Palpite[]> => {
  const bolao = await getBolaoPublico();
  if (!bolao) return [];
  return lerPalpitesEncerrados(supabasePublico('bolao'), bolao);
});

/** Os jogos de um time (pelo slug do endereço) e os palpites deles. `null` se o time não está no bolão. */
export const getTimePublico = cache(async (slug: string) => {
  const bolao = await getBolaoPublico();
  if (!bolao) return null;
  const time = timesDoBolao(bolao.jogos).find((t) => t.slug === slug);
  if (!time) return null;
  const jogos = jogosDoTime(bolao.jogos, time.nome);
  const dados = await lerJogos(supabasePublico('bolao'), bolao, jogos.map((jogo) => jogo.id));
  return { bolao, time, jogos, dados };
});
