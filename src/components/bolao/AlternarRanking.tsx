'use client';

import { useState } from 'react';

/**
 * Qual ranking aparece: de todos os jogos ou só dos jogos dos quatro grandes,
 * e, com jogo rolando, o oficial ou o "se acabasse agora". As tabelas chegam
 * prontas do servidor (`TabelaRanking` não precisa virar client); aqui só se
 * escolhe qual aparece. Abre em todos os jogos, no oficial: é o que vale.
 *
 * Sem jogo rolando, `aoVivo` e `grandesAoVivo` vêm nulos e fica só o filtro
 * dos jogos.
 */
export default function AlternarRanking({
  oficial,
  aoVivo,
  grandes,
  grandesAoVivo,
  rolando,
}: {
  oficial: React.ReactNode;
  aoVivo: React.ReactNode | null;
  /** O ranking contando só os jogos de Corinthians, Palmeiras, Santos e São Paulo. */
  grandes: React.ReactNode;
  grandesAoVivo: React.ReactNode | null;
  /** Quantos jogos estão rolando agora, para o aviso da prévia. */
  rolando: number;
}) {
  const [verAoVivo, setVerAoVivo] = useState(false);
  const [soGrandes, setSoGrandes] = useState(false);

  const temAoVivo = aoVivo !== null;
  const mostrarAoVivo = verAoVivo && temAoVivo;

  // Altura de botão de verdade (44px) em qualquer tela, não só no toque: é o
  // controle principal do ranking.
  const opcao = (ativo: boolean) =>
    `inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-3 text-sm font-bold transition-colors ${
      ativo ? 'bg-primary text-ink shadow-glow-soft' : 'text-zinc-300 hover:bg-ink-elevated hover:text-white'
    }`;
  const grupo = 'grid grid-cols-2 gap-1 rounded-xl border border-ink-line bg-ink-surface p-1';

  const tabela = soGrandes ? (mostrarAoVivo ? grandesAoVivo : grandes) : mostrarAoVivo ? aoVivo : oficial;

  return (
    <>
      <div role="group" aria-label="Quais jogos contam" className={grupo}>
        <button type="button" aria-pressed={!soGrandes} onClick={() => setSoGrandes(false)} className={opcao(!soGrandes)}>
          Todos os jogos
        </button>
        <button type="button" aria-pressed={soGrandes} onClick={() => setSoGrandes(true)} className={opcao(soGrandes)}>
          Times da bancada
        </button>
      </div>
      {temAoVivo ? (
        <div role="group" aria-label="Qual ranking mostrar" className={`mt-2 ${grupo}`}>
          <button type="button" aria-pressed={!verAoVivo} onClick={() => setVerAoVivo(false)} className={opcao(!verAoVivo)}>
            Oficial
          </button>
          <button type="button" aria-pressed={verAoVivo} onClick={() => setVerAoVivo(true)} className={opcao(verAoVivo)}>
            <span
              aria-hidden
              className={`h-2 w-2 shrink-0 animate-pulse rounded-full ${verAoVivo ? 'bg-ink' : 'bg-primary'}`}
            />
            Se acabasse agora
          </button>
        </div>
      ) : null}
      {soGrandes ? (
        <p className="mt-2 text-xs text-muted">
          Só os jogos de Corinthians, Palmeiras, Santos e São Paulo. Clássico entre eles conta uma vez.
        </p>
      ) : null}
      {mostrarAoVivo ? (
        <p className="mt-2 text-xs text-muted">
          Conta o placar de agora {rolando === 1 ? 'do jogo rolando' : `dos ${rolando} jogos rolando`}. Só vale
          quando o juiz apitar o fim.
        </p>
      ) : null}
      <div className="mt-3">{tabela}</div>
    </>
  );
}
