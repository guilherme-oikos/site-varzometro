/**
 * Tipos e textos do bolão. Puro, sem `fs` nem Supabase: pode ser importado por
 * componente 'use client'.
 *
 * A conta dos pontos que valem não mora aqui: é `bolao_pontos` no banco
 * (supabase/migrations/0002_bolao.sql), para painel, página pública e ranking
 * nunca discordarem. `REGRAS` só descreve a regra na tela, e
 * `pontosDoPalpite` repete a conta só para a prévia ao vivo — se mudar lá,
 * mude os dois aqui.
 */

import type { ClubeSigla } from '@/lib/site';

export type StatusJogo = 'agendado' | 'ao_vivo' | 'encerrado' | 'adiado' | 'cancelado';

export type Jogo = {
  id: number;
  /** Ano do campeonato. A rodada se repete entre temporadas; o par (temporada, rodada) não. */
  temporada: number;
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
  revelado: boolean;
  editado_a_mao: boolean;
};

export type Palpite = {
  jogo_id: number;
  autor_id: string;
  gols_mandante: number;
  gols_visitante: number;
  /** Nulo enquanto o jogo não terminou. Já conta a zebra (o dobro). */
  pontos: number | null;
  /** A faixa da regra (5, 3, 2, 1, 0), sem a zebra: é o que conta exato e resultado certo. */
  pontos_base: number | null;
  /** Frase curta junto do placar. Some junto com o palpite até o apito. */
  resenha: string | null;
  /** Zebra da rodada: este jogo vale o dobro. */
  dobrado: boolean;
};

/** Limite da resenha — o mesmo do `check` em 0004_resenha_e_zebra.sql. */
export const RESENHA_MAX = 80;

export type AutorDoBolao = { id: string; nome: string; iniciais: string; foto: string | null };

export type LinhaRanking = {
  autor_id: string;
  nome: string;
  iniciais: string;
  clube: string;
  foto_url: string | null;
  foto_blog_url: string | null;
  ordem: number;
  pontos: number;
  exatos: number;
  resultados: number;
  jogos_pontuados: number;
  /** Vezes que fez +3, +2 e +1. Vêm do 0003_ranking_por_faixa.sql. */
  vencedor_e_gols: number;
  so_vencedor: number;
  so_gols: number;
  /** A view tem uma linha por pessoa e temporada: cada campeonato começa do zero. */
  temporada: number;
};

/** Quantas vezes a linha do ranking fez cada faixa de `REGRAS`. */
export function vezesPorFaixa(linha: LinhaRanking): Record<(typeof REGRAS)[number]['pontos'], number> {
  return { 5: linha.exatos, 3: linha.vencedor_e_gols, 2: linha.so_vencedor, 1: linha.so_gols };
}

/** Colunas de `bolao_jogos` que as telas usam. */
export const COLUNAS_JOGO =
  'id, temporada, rodada, mandante, mandante_sigla, mandante_escudo, visitante, visitante_sigla, ' +
  'visitante_escudo, inicio, status, gols_mandante, gols_visitante, revelado, editado_a_mao';

export const REGRAS = [
  { pontos: 5, texto: 'Placar exato' },
  { pontos: 3, texto: 'Acertou o vencedor (ou o empate) e os gols de um dos times' },
  { pontos: 2, texto: 'Acertou o vencedor (ou o empate)' },
  { pontos: 1, texto: 'Errou o resultado, mas cravou os gols de um dos times' },
] as const;

/** Mesma regra do trigger `bolao_uma_zebra_por_rodada`. */
export const REGRA_ZEBRA = 'Zebra: em um jogo por rodada, os pontos valem o dobro.';

/** Mesma regra de `bolao_aberto` no banco. Aqui é só para a tela; quem barra é a RLS. */
export function jogoAberto(jogo: Jogo, agora = Date.now()): boolean {
  return jogo.status === 'agendado' && new Date(jogo.inicio).getTime() > agora && !jogo.revelado;
}

/** Mesma regra de `bolao_visivel` no banco. */
export function palpitesVisiveis(jogo: Jogo, agora = Date.now()): boolean {
  return (
    jogo.revelado ||
    jogo.status === 'ao_vivo' ||
    jogo.status === 'encerrado' ||
    (jogo.status === 'agendado' && new Date(jogo.inicio).getTime() <= agora)
  );
}

/** Placar final, ou o do momento se o jogo está rolando (a sincronização grava o parcial). */
export function placar(jogo: Pick<Jogo, 'gols_mandante' | 'gols_visitante'>): string | null {
  if (jogo.gols_mandante === null || jogo.gols_visitante === null) return null;
  return `${jogo.gols_mandante} x ${jogo.gols_visitante}`;
}

/* ------------------------------------------------------------- Ao vivo -- */
/*
 * "Se acabasse agora": os pontos que cada palpite faria com o placar parcial.
 * É só prévia na tela. O ranking que vale continua sendo o da view
 * `bolao_ranking`, que só pontua jogo encerrado.
 */

/** Mesma conta de `bolao_pontos` no SQL. Só para prévia: quem pontua de verdade é o banco. */
export function pontosDoPalpite(pm: number, pv: number, gm: number, gv: number): number {
  if (pm === gm && pv === gv) return 5;
  const mesmoResultado = Math.sign(pm - pv) === Math.sign(gm - gv);
  if (mesmoResultado && (pm === gm || pv === gv)) return 3;
  if (mesmoResultado) return 2;
  if (pm === gm || pv === gv) return 1;
  return 0;
}

/** Jogo rolando, com o placar de agora. Sem placar ainda (a API demora no apito), vale 0 x 0. */
export function placarParcial(jogo: Jogo): { mandante: number; visitante: number } | null {
  if (jogo.status !== 'ao_vivo') return null;
  return { mandante: jogo.gols_mandante ?? 0, visitante: jogo.gols_visitante ?? 0 };
}

/** Os palpites dos jogos rolando com os pontos que fariam se o jogo acabasse agora (zebra incluída). */
export function palpitesAoVivo(jogos: Jogo[], palpites: Palpite[]): Palpite[] {
  const parciais = new Map(jogos.flatMap((jogo) => {
    const parcial = placarParcial(jogo);
    return parcial ? [[jogo.id, parcial] as const] : [];
  }));
  return palpites.flatMap((p) => {
    const parcial = parciais.get(p.jogo_id);
    if (!parcial) return [];
    const base = pontosDoPalpite(p.gols_mandante, p.gols_visitante, parcial.mandante, parcial.visitante);
    return [{ ...p, pontos: base * (p.dobrado ? 2 : 1), pontos_base: base }];
  });
}

/**
 * Soma palpites pontuados fora do banco (a prévia ao vivo, a simulação do dev)
 * no ranking: total com a zebra, faixas pela regra sem ela, como a view. E
 * reordena como a consulta de `lerBolao`.
 */
export function somarNoRanking(ranking: LinhaRanking[], extras: Palpite[]): LinhaRanking[] {
  return ranking
    .map((linha) => {
      const meus = extras.filter((palpite) => palpite.autor_id === linha.autor_id && palpite.pontos !== null);
      if (meus.length === 0) return linha;
      const conta = (n: number) => meus.filter((p) => p.pontos_base === n).length;
      return {
        ...linha,
        pontos: linha.pontos + meus.reduce((soma, p) => soma + (p.pontos ?? 0), 0),
        exatos: linha.exatos + conta(5),
        resultados: linha.resultados + meus.filter((p) => (p.pontos_base ?? 0) >= 2).length,
        jogos_pontuados: linha.jogos_pontuados + meus.length,
        vencedor_e_gols: (linha.vencedor_e_gols ?? 0) + conta(3),
        so_vencedor: (linha.so_vencedor ?? 0) + conta(2),
        so_gols: (linha.so_gols ?? 0) + conta(1),
      };
    })
    .sort(
      (a, b) =>
        b.pontos - a.pontos ||
        b.exatos - a.exatos ||
        b.resultados - a.resultados ||
        a.ordem - b.ordem ||
        a.nome.localeCompare(b.nome),
    );
}

export const rotuloStatus: Record<StatusJogo, string> = {
  agendado: 'Agendado',
  ao_vivo: 'Rolando',
  encerrado: 'Encerrado',
  adiado: 'Adiado',
  cancelado: 'Cancelado',
};

const dataDoJogo = new Intl.DateTimeFormat('pt-BR', {
  weekday: 'short',
  day: '2-digit',
  month: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  timeZone: 'America/Sao_Paulo',
});

/** "sáb., 25/10, 16:00" → "sáb 25/10 · 16:00" */
export function quandoE(inicio: string): string {
  const partes = dataDoJogo.formatToParts(new Date(inicio));
  const valor = (tipo: Intl.DateTimeFormatPartTypes) => partes.find((p) => p.type === tipo)?.value ?? '';
  return `${valor('weekday').replace('.', '')} ${valor('day')}/${valor('month')} · ${valor('hour')}:${valor('minute')}`;
}

/**
 * A rodada que a tela abre por padrão: a primeira com jogo marcado ou
 * rolando. Adiado não conta — um jogo da rodada 30 sem data nova prenderia a
 * tela na 30. Sem nada pendente, a última.
 */
export function rodadaAtual(jogos: Pick<Jogo, 'rodada' | 'status'>[]): number | null {
  if (jogos.length === 0) return null;
  const pendentes = jogos.filter((j) => j.status === 'agendado' || j.status === 'ao_vivo');
  const base = pendentes.length > 0 ? pendentes : jogos;
  const rodadas = base.map((j) => j.rodada);
  return pendentes.length > 0 ? Math.min(...rodadas) : Math.max(...rodadas);
}

/**
 * Posição no ranking com empate de verdade: quem tem os mesmos pontos, exatos
 * e resultados divide a posição (1, 2, 2, 4).
 */
export function posicoes(ranking: LinhaRanking[]): number[] {
  return ranking.map((linha, indice) => {
    let primeira = indice;
    while (
      primeira > 0 &&
      ranking[primeira - 1].pontos === linha.pontos &&
      ranking[primeira - 1].exatos === linha.exatos &&
      ranking[primeira - 1].resultados === linha.resultados
    ) {
      primeira--;
    }
    return primeira + 1;
  });
}

/** Quem aparece nos cards: a bancada na ordem dos cards da home, não na do ranking. */
export function autoresDoRanking(ranking: LinhaRanking[]): AutorDoBolao[] {
  return [...ranking]
    .sort((a, b) => a.ordem - b.ordem || a.nome.localeCompare(b.nome, 'pt-BR'))
    .map((linha) => ({
      id: linha.autor_id,
      nome: linha.nome,
      iniciais: linha.iniciais,
      foto: linha.foto_blog_url ?? linha.foto_url,
    }));
}

/* ------------------------------------------------------------ Histórico -- */
/*
 * Contas sobre os palpites dos jogos encerrados. Os pontos de cada palpite já
 * vêm do banco (`bolao_palpites_pontuados`); aqui só se soma e se agrupa.
 */

/** Pontos de cada um numa rodada, em ordem de mais pontos. Só jogos encerrados contam. */
export type PlacarDaRodada = {
  linhas: { autor: AutorDoBolao; pontos: number; exatos: number }[];
  encerrados: number;
  total: number;
};

export function placarDaRodada(jogos: Jogo[], palpites: Palpite[], autores: AutorDoBolao[]): PlacarDaRodada {
  const encerrados = jogos.filter((jogo) => jogo.status === 'encerrado');
  const ids = new Set(encerrados.map((jogo) => jogo.id));
  const linhas = autores
    .map((autor) => {
      const meus = palpites.filter((p) => p.autor_id === autor.id && ids.has(p.jogo_id) && p.pontos !== null);
      return {
        autor,
        pontos: meus.reduce((soma, p) => soma + (p.pontos ?? 0), 0),
        exatos: meus.filter((p) => p.pontos_base === 5).length,
      };
    })
    .sort((a, b) => b.pontos - a.pontos || b.exatos - a.exatos);
  // Adiado e cancelado não entram na conta de "faltam jogos".
  const total = jogos.filter((jogo) => jogo.status !== 'adiado' && jogo.status !== 'cancelado').length;
  return { linhas, encerrados: encerrados.length, total };
}

/** Pontos acumulados de cada um, rodada a rodada, para o gráfico de evolução. */
export type Evolucao = {
  rodadas: number[];
  series: { autor: AutorDoBolao; acumulado: number[] }[];
};

export function evolucao(jogos: Jogo[], palpites: Palpite[], autores: AutorDoBolao[]): Evolucao {
  const rodadaDoJogo = new Map(jogos.filter((j) => j.status === 'encerrado').map((j) => [j.id, j.rodada]));
  const rodadas = Array.from(new Set(rodadaDoJogo.values())).sort((a, b) => a - b);
  const series = autores.map((autor) => {
    let soma = 0;
    const acumulado = rodadas.map((rodada) => {
      for (const p of palpites) {
        if (p.autor_id === autor.id && rodadaDoJogo.get(p.jogo_id) === rodada) soma += p.pontos ?? 0;
      }
      return soma;
    });
    return { autor, acumulado };
  });
  return { rodadas, series };
}

/**
 * Nome do time no football-data para cada clube da bancada. A sigla de lá não
 * serve: o Corinthians e o Coritiba saem os dois como "COR". Se o
 * football-data mudar o nome, o "próprio time" some em silêncio — confira aqui.
 */
export const TIME_DO_CLUBE: Record<ClubeSigla, string> = {
  SPFC: 'São Paulo',
  SCCP: 'Corinthians',
  SEP: 'Palmeiras',
  SFC: 'Santos',
};

export type DesempenhoNoTime = {
  autor: AutorDoBolao;
  clube: ClubeSigla;
  time: string;
  /** Jogos encerrados do próprio time em que a pessoa palpitou. */
  jogos: number;
  /** Acertou o resultado (vencedor ou empate): +5, +3 ou +2. */
  acertos: number;
  pontos: number;
  /** Quantas vezes apostou na vitória do próprio time. */
  fe: number;
  /** O mesmo acerto nos outros jogos, para comparar. */
  outrosJogos: number;
  outrosAcertos: number;
};

export function desempenhoNoProprioTime(
  jogos: Jogo[],
  palpites: Palpite[],
  autores: (AutorDoBolao & { clube?: ClubeSigla })[],
): DesempenhoNoTime[] {
  const encerrados = new Map(jogos.filter((j) => j.status === 'encerrado').map((j) => [j.id, j]));
  return autores.flatMap((autor) => {
    if (!autor.clube) return [];
    const time = TIME_DO_CLUBE[autor.clube];
    const linha: DesempenhoNoTime = {
      autor,
      clube: autor.clube,
      time,
      jogos: 0,
      acertos: 0,
      pontos: 0,
      fe: 0,
      outrosJogos: 0,
      outrosAcertos: 0,
    };
    for (const p of palpites) {
      const jogo = encerrados.get(p.jogo_id);
      if (!jogo || p.autor_id !== autor.id || p.pontos === null) continue;
      const acertou = (p.pontos_base ?? 0) >= 2;
      if (jogo.mandante === time || jogo.visitante === time) {
        linha.jogos++;
        linha.pontos += p.pontos;
        if (acertou) linha.acertos++;
        const saldo = p.gols_mandante - p.gols_visitante;
        if ((jogo.mandante === time && saldo > 0) || (jogo.visitante === time && saldo < 0)) linha.fe++;
      } else {
        linha.outrosJogos++;
        if (acertou) linha.outrosAcertos++;
      }
    }
    return [linha];
  });
}

/* ---------------------------------------------------------------- Times -- */

export type TimeDoBolao = { nome: string; slug: string; sigla: string; escudo: string | null; grande: boolean };

/** "São Paulo" → "sao-paulo", "Léo" → "leo". Endereço de /bolao/time/<slug> e /bolao/duelo/<a>-x-<b>. */
export function paraSlug(nome: string): string {
  return nome
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

const GRANDES = new Set(Object.values(TIME_DO_CLUBE));

/**
 * Os times que aparecem no bolão, para o filtro. Os quatro grandes de SP vêm
 * primeiro — é deles que a bancada torce —, entre si em ordem alfabética, sem
 * nenhum na frente dos outros por gosto (regra de equilíbrio). Depois o resto,
 * também em ordem alfabética.
 */
export function timesDoBolao(jogos: Jogo[]): TimeDoBolao[] {
  const porNome = new Map<string, TimeDoBolao>();
  for (const jogo of jogos) {
    for (const [nome, sigla, escudo] of [
      [jogo.mandante, jogo.mandante_sigla, jogo.mandante_escudo],
      [jogo.visitante, jogo.visitante_sigla, jogo.visitante_escudo],
    ] as const) {
      const atual = porNome.get(nome);
      if (!atual) porNome.set(nome, { nome, slug: paraSlug(nome), sigla, escudo, grande: GRANDES.has(nome) });
      else if (!atual.escudo && escudo) atual.escudo = escudo;
    }
  }
  return Array.from(porNome.values()).sort(
    (a, b) => Number(b.grande) - Number(a.grande) || a.nome.localeCompare(b.nome, 'pt-BR'),
  );
}

export function jogosDoTime(jogos: Jogo[], nome: string): Jogo[] {
  return jogos.filter((jogo) => jogo.mandante === nome || jogo.visitante === nome);
}

/** Quem mais pontua nos jogos encerrados de um time: o mini ranking da página do time. */
export function rankingNoTime(
  jogos: Jogo[],
  palpites: Palpite[],
  autores: AutorDoBolao[],
): { autor: AutorDoBolao; pontos: number; acertos: number; jogos: number }[] {
  const encerrados = new Set(jogos.filter((j) => j.status === 'encerrado').map((j) => j.id));
  return autores
    .map((autor) => {
      const meus = palpites.filter((p) => p.autor_id === autor.id && encerrados.has(p.jogo_id) && p.pontos !== null);
      return {
        autor,
        pontos: meus.reduce((soma, p) => soma + (p.pontos ?? 0), 0),
        acertos: meus.filter((p) => (p.pontos_base ?? 0) >= 2).length,
        jogos: meus.length,
      };
    })
    .sort((a, b) => b.pontos - a.pontos || b.acertos - a.acertos);
}

/* ---------------------------------------------------------------- Duelo -- */

export type JogoDoDuelo = {
  jogo: Jogo;
  a: Palpite | null;
  b: Palpite | null;
  /** Quem fez mais pontos no jogo; `null` é empate. Sem palpite vale zero. */
  vencedor: 'a' | 'b' | null;
};

export type Duelo = {
  a: AutorDoBolao;
  b: AutorDoBolao;
  vitoriasA: number;
  vitoriasB: number;
  empates: number;
  pontosA: number;
  pontosB: number;
  exatosA: number;
  exatosB: number;
  /** Jogos encerrados em que pelo menos um dos dois palpitou, do mais recente ao mais antigo. */
  jogos: JogoDoDuelo[];
  /** O jogo de maior diferença de pontos entre os dois. */
  goleada: JogoDoDuelo | null;
};

/** Endereço do duelo, sempre na ordem da bancada: "gj-x-marti", nunca "marti-x-gj". */
export function slugDoDuelo(a: AutorDoBolao, b: AutorDoBolao, autores: AutorDoBolao[]): string {
  const [primeiro, segundo] = autores.indexOf(a) <= autores.indexOf(b) ? [a, b] : [b, a];
  return `${paraSlug(primeiro.nome)}-x-${paraSlug(segundo.nome)}`;
}

/**
 * Confronto direto: em cada jogo encerrado, quem fez mais pontos leva. Conta
 * o total com a zebra (é o que vale no ranking); exato é pela faixa da regra.
 */
export function duelo(jogos: Jogo[], palpites: Palpite[], a: AutorDoBolao, b: AutorDoBolao): Duelo {
  const resultado: Duelo = {
    a,
    b,
    vitoriasA: 0,
    vitoriasB: 0,
    empates: 0,
    pontosA: 0,
    pontosB: 0,
    exatosA: 0,
    exatosB: 0,
    jogos: [],
    goleada: null,
  };

  const encerrados = jogos
    .filter((jogo) => jogo.status === 'encerrado')
    .sort((x, y) => new Date(y.inicio).getTime() - new Date(x.inicio).getTime());

  let maiorDiferenca = 0;
  for (const jogo of encerrados) {
    const pa = palpites.find((p) => p.jogo_id === jogo.id && p.autor_id === a.id) ?? null;
    const pb = palpites.find((p) => p.jogo_id === jogo.id && p.autor_id === b.id) ?? null;
    if (!pa && !pb) continue;

    const na = pa?.pontos ?? 0;
    const nb = pb?.pontos ?? 0;
    const vencedor = na > nb ? 'a' : nb > na ? 'b' : null;
    const linha: JogoDoDuelo = { jogo, a: pa, b: pb, vencedor };
    resultado.jogos.push(linha);

    resultado.pontosA += na;
    resultado.pontosB += nb;
    if (pa?.pontos_base === 5) resultado.exatosA++;
    if (pb?.pontos_base === 5) resultado.exatosB++;
    if (vencedor === 'a') resultado.vitoriasA++;
    else if (vencedor === 'b') resultado.vitoriasB++;
    else resultado.empates++;

    if (Math.abs(na - nb) > maiorDiferenca) {
      maiorDiferenca = Math.abs(na - nb);
      resultado.goleada = linha;
    }
  }

  return resultado;
}

/* ------------------------------------------------------ A bancada acha -- */

export type BancadaAcha = {
  /** Quantos palpitaram no jogo. */
  total: number;
  /** Palpites por resultado, na ordem mandante, empate, visitante. */
  mandante: number;
  empate: number;
  visitante: number;
  /** O placar que mais se repetiu, se algum se repetiu e sem empate na contagem. */
  placarMaisApostado: { placar: string; vezes: number } | null;
};

/**
 * O resumo do jogo depois do apito: para onde a bancada foi e qual placar
 * mais saiu. Só com dois palpites ou mais — um palpite sozinho não é "a
 * bancada". Antes do apito a RLS nem devolve os palpites dos outros.
 */
export function bancadaAcha(palpites: Palpite[]): BancadaAcha | null {
  if (palpites.length < 2) return null;
  const resumo: BancadaAcha = { total: palpites.length, mandante: 0, empate: 0, visitante: 0, placarMaisApostado: null };
  const placares = new Map<string, number>();
  for (const p of palpites) {
    if (p.gols_mandante > p.gols_visitante) resumo.mandante++;
    else if (p.gols_mandante < p.gols_visitante) resumo.visitante++;
    else resumo.empate++;
    const chave = `${p.gols_mandante} x ${p.gols_visitante}`;
    placares.set(chave, (placares.get(chave) ?? 0) + 1);
  }
  const ordenados = Array.from(placares).sort((a, b) => b[1] - a[1]);
  const [primeiro, segundo] = ordenados;
  if (primeiro[1] >= 2 && (!segundo || segundo[1] < primeiro[1])) {
    resumo.placarMaisApostado = { placar: primeiro[0], vezes: primeiro[1] };
  }
  return resumo;
}

/* ----------------------------------------------------------- Palpiteiro -- */

export type RodadaDoPalpiteiro = {
  rodada: number;
  pontos: number;
  exatos: number;
  /** Todos os jogos da rodada (fora adiado e cancelado) já terminaram. */
  completa: boolean;
};

export type TimeDoPalpiteiro = { time: string; jogos: number; acertos: number; erros: number };

export type Palpiteiro = {
  /** Jogos encerrados com palpite dele, do mais recente ao mais antigo. */
  historico: { jogo: Jogo; palpite: Palpite }[];
  rodadas: RodadaDoPalpiteiro[];
  /** Melhor e pior rodada fechada. A pior só com duas rodadas fechadas ou mais. */
  melhor: RodadaDoPalpiteiro | null;
  pior: RodadaDoPalpiteiro | null;
  /** O time em que mais erra o resultado (e erra mais do que acerta). Só conta time com dois jogos ou mais. */
  freguesia: TimeDoPalpiteiro | null;
  /** O time em que mais acerta o resultado (e acerta mais do que erra). Nunca é o mesmo da freguesia. */
  manja: TimeDoPalpiteiro | null;
};

/**
 * A página de cada um da bancada. Os pontos vêm do banco
 * (`bolao_palpites_pontuados`), como no resto do histórico; aqui só se agrupa.
 * Acerto e erro são pelo resultado (vencedor ou empate), como em "próprio time".
 */
export function palpiteiro(jogos: Jogo[], palpites: Palpite[], autorId: string): Palpiteiro {
  const encerrados = new Map(jogos.filter((j) => j.status === 'encerrado').map((j) => [j.id, j]));
  const meus = palpites.filter((p) => p.autor_id === autorId && p.pontos !== null && encerrados.has(p.jogo_id));

  const historico = meus
    .map((palpite) => ({ jogo: encerrados.get(palpite.jogo_id)!, palpite }))
    .sort((a, b) => new Date(b.jogo.inicio).getTime() - new Date(a.jogo.inicio).getTime());

  // Rodada sem palpite nenhum também conta, com zero: esquecer faz parte do bolão.
  const rodadas = Array.from(new Set(Array.from(encerrados.values()).map((j) => j.rodada)))
    .sort((a, b) => a - b)
    .map((rodada) => {
      const daRodada = meus.filter((p) => encerrados.get(p.jogo_id)!.rodada === rodada);
      const pendentes = jogos.filter(
        (j) => j.rodada === rodada && (j.status === 'agendado' || j.status === 'ao_vivo'),
      ).length;
      return {
        rodada,
        pontos: daRodada.reduce((soma, p) => soma + (p.pontos ?? 0), 0),
        exatos: daRodada.filter((p) => p.pontos_base === 5).length,
        completa: pendentes === 0,
      };
    });

  const fechadas = rodadas.filter((r) => r.completa);
  // Empate de pontos: vale a mais recente, que é a que a bancada lembra.
  const melhor = fechadas.reduce<RodadaDoPalpiteiro | null>(
    (atual, r) => (!atual || r.pontos > atual.pontos || (r.pontos === atual.pontos && r.exatos >= atual.exatos) ? r : atual),
    null,
  );
  const pior =
    fechadas.length >= 2
      ? fechadas.reduce<RodadaDoPalpiteiro | null>((atual, r) => (!atual || r.pontos <= atual.pontos ? r : atual), null)
      : null;

  const porTime = new Map<string, TimeDoPalpiteiro>();
  for (const { jogo, palpite } of historico) {
    const acertou = (palpite.pontos_base ?? 0) >= 2;
    for (const time of [jogo.mandante, jogo.visitante]) {
      const linha = porTime.get(time) ?? { time, jogos: 0, acertos: 0, erros: 0 };
      linha.jogos++;
      if (acertou) linha.acertos++;
      else linha.erros++;
      porTime.set(time, linha);
    }
  }
  const comBase = Array.from(porTime.values()).filter((t) => t.jogos >= 2);
  const freguesia =
    comBase
      .filter((t) => t.erros > t.acertos)
      .sort((a, b) => b.erros - a.erros || b.erros / b.jogos - a.erros / a.jogos || a.time.localeCompare(b.time, 'pt-BR'))[0] ??
    null;
  const manja =
    comBase
      .filter((t) => t.acertos > t.erros)
      .sort(
        (a, b) => b.acertos - a.acertos || b.acertos / b.jogos - a.acertos / a.jogos || a.time.localeCompare(b.time, 'pt-BR'),
      )[0] ?? null;

  return { historico, rodadas, melhor, pior, freguesia, manja };
}

/** O próximo jogo do bolão: o que está rolando, ou o primeiro marcado daqui para a frente. */
export function proximoJogo(jogos: Jogo[], agora = Date.now()): Jogo | null {
  return (
    jogos.find((j) => j.status === 'ao_vivo') ??
    jogos
      .filter((j) => j.status === 'agendado' && new Date(j.inicio).getTime() > agora)
      .sort((a, b) => new Date(a.inicio).getTime() - new Date(b.inicio).getTime())[0] ??
    null
  );
}
