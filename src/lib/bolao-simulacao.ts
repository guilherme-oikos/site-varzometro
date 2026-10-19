import 'server-only';
import type { Bolao, Rodada } from '@/lib/bolao-dados';
import type { Palpite } from '@/lib/bolao';
import { limparVariavel } from '@/lib/env';

/**
 * Prévia de jogo encerrado, só no `npm run dev`. Com `BOLAO_SIMULAR` no
 * `.env.local` — `<id>:<placar>` separados por vírgula, como
 * `555044:2x1,555055:1x2` (sem placar, vale 2x1) —, esses jogos aparecem como
 * encerrados, com palpite de toda a bancada e os pontos somados no ranking,
 * no campeão da rodada, na evolução e no "próprio time". Serve para ver a
 * tela antes de as rodadas terminarem de verdade.
 *
 * Nada vai para o banco: o Supabase é o de produção, e encerrar um jogo real
 * revelaria os palpites para sempre (o trigger não deixa `revelado` voltar).
 * Em build de produção a variável é ignorada.
 */

type JogoSimulado = { jogoId: number; mandante: number; visitante: number };

const simulados: JogoSimulado[] = (() => {
  if (process.env.NODE_ENV === 'production') return [];
  const bruto = limparVariavel(process.env.BOLAO_SIMULAR);
  if (!bruto) return [];
  const lista = bruto.split(',').flatMap((item) => {
    const partes = item.trim().match(/^(\d+)(?::(\d+)x(\d+))?$/i);
    if (!partes) return [];
    return [{
      jogoId: Number(partes[1]),
      mandante: partes[2] ? Number(partes[2]) : 2,
      visitante: partes[3] ? Number(partes[3]) : 1,
    }];
  });
  if (lista.length > 0) {
    console.warn(`[bolao] SIMULAÇÃO ligada em ${lista.length} jogo(s) — nada disso está no banco.`);
  }
  return lista;
})();

const simulado = (jogoId: number) => simulados.find((s) => s.jogoId === jogoId);

/** Mesma conta de `bolao_pontos` no SQL. */
function pontos(pm: number, pv: number, gm: number, gv: number): number {
  if (pm === gm && pv === gv) return 5;
  const mesmoResultado = Math.sign(pm - pv) === Math.sign(gm - gv);
  if (mesmoResultado && (pm === gm || pv === gv)) return 3;
  if (mesmoResultado) return 2;
  if (pm === gm || pv === gv) return 1;
  return 0;
}

// Um palpite por faixa de pontos (5, 3, 2, 1, 0), montado a partir do placar.
// Em empate não existe a faixa de 3 (acertar o empate e um dos gols é exato).
function palpitesDeMentira(gm: number, gv: number): [number, number][] {
  if (gm > gv) return [[gm, gv], [gm + 1, gv], [gm + 1, gv + 1], [gm, gm + 1], [gm + 1, gm + 3]];
  if (gm < gv) return [[gm, gv], [gm, gv + 1], [gm + 1, gv + 1], [gv + 1, gv], [gv + 3, gv + 1]];
  return [[gm, gv], [gm + 1, gv + 1], [gm, gv + 1], [gm + 2, gv + 1], [gm + 1, gv + 2]];
}

/** Palpites de toda a bancada nos jogos simulados que existem em `bolao`. */
function palpitesSimulados(bolao: Bolao): Palpite[] {
  const autores = [...bolao.ranking].sort((a, b) => a.ordem - b.ordem);
  return simulados
    .filter((s) => bolao.jogos.some((jogo) => jogo.id === s.jogoId))
    .flatMap((s, k) => {
      const base = palpitesDeMentira(s.mandante, s.visitante);
      // Gira a faixa a cada jogo, senão a mesma pessoa cravaria todos.
      return autores.map((autor, i) => {
        const [m, v] = base[(i + k * 2) % base.length];
        return {
          jogo_id: s.jogoId,
          autor_id: autor.autor_id,
          gols_mandante: m,
          gols_visitante: v,
          pontos: pontos(m, v, s.mandante, s.visitante),
        };
      });
    });
}

export function simularBolao(bolao: Bolao): Bolao {
  if (!simulados.some((s) => bolao.jogos.some((jogo) => jogo.id === s.jogoId))) return bolao;

  const jogos = bolao.jogos.map((jogo) => {
    const s = simulado(jogo.id);
    return s
      ? { ...jogo, status: 'encerrado' as const, gols_mandante: s.mandante, gols_visitante: s.visitante, revelado: true }
      : jogo;
  });

  const extras = palpitesSimulados(bolao);
  const ranking = bolao.ranking
    .map((linha) => {
      const meus = extras.filter((palpite) => palpite.autor_id === linha.autor_id).map((p) => p.pontos ?? 0);
      if (meus.length === 0) return linha;
      const conta = (n: number) => meus.filter((p) => p === n).length;
      return {
        ...linha,
        pontos: linha.pontos + meus.reduce((a, b) => a + b, 0),
        exatos: linha.exatos + conta(5),
        resultados: linha.resultados + meus.filter((p) => p >= 2).length,
        jogos_pontuados: linha.jogos_pontuados + meus.length,
        vencedor_e_gols: (linha.vencedor_e_gols ?? 0) + conta(3),
        so_vencedor: (linha.so_vencedor ?? 0) + conta(2),
        so_gols: (linha.so_gols ?? 0) + conta(1),
      };
    })
    // Mesma ordem da consulta em `lerBolao`.
    .sort(
      (a, b) =>
        b.pontos - a.pontos ||
        b.exatos - a.exatos ||
        b.resultados - a.resultados ||
        a.ordem - b.ordem ||
        a.nome.localeCompare(b.nome),
    );

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
