import 'server-only';
import type { Bolao, Rodada } from '@/lib/bolao-dados';
import { pontosDoPalpite, somarNoRanking, type Palpite } from '@/lib/bolao';
import { limparVariavel } from '@/lib/env';

/**
 * Prévia de jogo encerrado, só no `npm run dev`. Com `BOLAO_SIMULAR` no
 * `.env.local` — `<id>:<placar>` separados por vírgula, como
 * `555044:2x1,555055:1x2` (sem placar, vale 2x1) —, esses jogos aparecem como
 * encerrados, com palpite de toda a bancada e os pontos somados no ranking,
 * no campeão da rodada, na evolução e no "próprio time". Serve para ver a
 * tela antes de as rodadas terminarem de verdade.
 *
 * Com `:vivo` no fim (`555044:1x0:vivo`), o jogo aparece rolando com esse
 * placar parcial: palpites à mostra, sem pontos, e o ranking "se acabasse
 * agora" ligado.
 *
 * Nada vai para o banco: o Supabase é o de produção, e encerrar um jogo real
 * revelaria os palpites para sempre (o trigger não deixa `revelado` voltar).
 * Em build de produção a variável é ignorada.
 */

type JogoSimulado = { jogoId: number; mandante: number; visitante: number; vivo: boolean };

const simulados: JogoSimulado[] = (() => {
  if (process.env.NODE_ENV === 'production') return [];
  const bruto = limparVariavel(process.env.BOLAO_SIMULAR);
  if (!bruto) return [];
  const lista = bruto.split(',').flatMap((item) => {
    const partes = item.trim().match(/^(\d+)(?::(\d+)x(\d+))?(:vivo)?$/i);
    if (!partes) return [];
    return [{
      jogoId: Number(partes[1]),
      mandante: partes[2] ? Number(partes[2]) : 2,
      visitante: partes[3] ? Number(partes[3]) : 1,
      vivo: Boolean(partes[4]),
    }];
  });
  if (lista.length > 0) {
    console.warn(`[bolao] SIMULAÇÃO ligada em ${lista.length} jogo(s) — nada disso está no banco.`);
  }
  return lista;
})();

const simulado = (jogoId: number) => simulados.find((s) => s.jogoId === jogoId);

// Um palpite por faixa de pontos (5, 3, 2, 1, 0), montado a partir do placar.
// Em empate não existe a faixa de 3 (acertar o empate e um dos gols é exato).
function palpitesDeMentira(gm: number, gv: number): [number, number][] {
  if (gm > gv) return [[gm, gv], [gm + 1, gv], [gm + 1, gv + 1], [gm, gm + 1], [gm + 1, gm + 3]];
  if (gm < gv) return [[gm, gv], [gm, gv + 1], [gm + 1, gv + 1], [gv + 1, gv], [gv + 3, gv + 1]];
  return [[gm, gv], [gm + 1, gv + 1], [gm, gv + 1], [gm + 2, gv + 1], [gm + 1, gv + 2]];
}

// Resenha de mentira, para ver como a frase aparece no card.
const RESENHAS = [
  'Hoje não tem jeito, é vitória fácil.',
  'Confio no time até o fim, como sempre.',
  'Esse aqui é zebra na certa, anota aí.',
  'Empate com cara de jogo truncado.',
  'Vai ser sofrido, mas sai o gol no fim.',
];

/** Palpites de toda a bancada nos jogos simulados que existem em `bolao`. */
function palpitesSimulados(bolao: Bolao): Palpite[] {
  const autores = [...bolao.ranking].sort((a, b) => a.ordem - b.ordem);
  const rodadaDe = new Map(bolao.jogos.map((jogo) => [jogo.id, jogo.rodada]));
  // Uma zebra por pessoa por rodada, como no banco.
  const zebraUsada = new Set<string>();
  return simulados
    .filter((s) => rodadaDe.has(s.jogoId))
    .flatMap((s, k) => {
      const base = palpitesDeMentira(s.mandante, s.visitante);
      // Gira a faixa a cada jogo, senão a mesma pessoa cravaria todos.
      return autores.map((autor, i) => {
        const [m, v] = base[(i + k * 2) % base.length];
        const chave = `${autor.autor_id}:${rodadaDe.get(s.jogoId)}`;
        const dobrado = (i + k) % 2 === 0 && !zebraUsada.has(chave);
        if (dobrado) zebraUsada.add(chave);
        // Rolando, o banco ainda não deu ponto: a prévia sai de `palpitesAoVivo`.
        const pontosBase = s.vivo ? null : pontosDoPalpite(m, v, s.mandante, s.visitante);
        return {
          jogo_id: s.jogoId,
          autor_id: autor.autor_id,
          gols_mandante: m,
          gols_visitante: v,
          pontos: pontosBase === null ? null : pontosBase * (dobrado ? 2 : 1),
          pontos_base: pontosBase,
          resenha: (i + k) % 3 === 0 ? RESENHAS[(i + k) % RESENHAS.length] : null,
          dobrado,
        };
      });
    });
}

export function simularBolao(bolao: Bolao): Bolao {
  if (!simulados.some((s) => bolao.jogos.some((jogo) => jogo.id === s.jogoId))) return bolao;

  const jogos = bolao.jogos.map((jogo) => {
    const s = simulado(jogo.id);
    return s
      ? {
          ...jogo,
          status: s.vivo ? ('ao_vivo' as const) : ('encerrado' as const),
          gols_mandante: s.mandante,
          gols_visitante: s.visitante,
          revelado: true,
        }
      : jogo;
  });

  // Só os encerrados somam no ranking oficial; `somarNoRanking` ignora palpite sem pontos.
  const ranking = somarNoRanking(bolao.ranking, palpitesSimulados(bolao));

  return { ...bolao, jogos, ranking };
}

/** Troca os palpites reais dos jogos simulados pelos de mentira. `ids`: os jogos consultados. */
export function simularPalpites(bolao: Bolao, ids: number[] | null, palpites: Palpite[]): Palpite[] {
  const extras = palpitesSimulados(bolao).filter((p) => ids === null || ids.includes(p.jogo_id));
  if (extras.length === 0) return palpites;
  return [...palpites.filter((p) => !simulado(p.jogo_id)), ...extras];
}

/** `ids`: os jogos da rodada pedida — os simulados só entram se forem deles. */
export function simularRodada(bolao: Bolao, ids: number[], rodada: Rodada): Rodada {
  const extras = palpitesSimulados(bolao).filter((p) => ids.includes(p.jogo_id));
  if (extras.length === 0) return rodada;
  return {
    palpites: simularPalpites(bolao, ids, rodada.palpites),
    quemPalpitou: [
      ...rodada.quemPalpitou.filter((q) => !simulado(q.jogo_id)),
      ...extras.map((p) => ({ jogo_id: p.jogo_id, autor_id: p.autor_id })),
    ],
  };
}
