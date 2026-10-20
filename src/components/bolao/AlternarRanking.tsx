'use client';

import { useState } from 'react';

/**
 * Ranking oficial ou "se acabasse agora", com jogo rolando. As duas tabelas
 * chegam prontas do servidor (`TabelaRanking` não precisa virar client); aqui
 * só se escolhe qual aparece. Abre no oficial: é o que vale.
 *
 * Sem jogo rolando, `aoVivo` vem nulo e fica só o oficial, sem botão.
 */
export default function AlternarRanking({
  oficial,
  aoVivo,
  rolando,
}: {
  oficial: React.ReactNode;
  aoVivo: React.ReactNode | null;
  /** Quantos jogos estão rolando agora, para o aviso da prévia. */
  rolando: number;
}) {
  const [verAoVivo, setVerAoVivo] = useState(false);

  if (!aoVivo) return <>{oficial}</>;

  // Altura de botão de verdade (44px) em qualquer tela, não só no toque: é o
  // controle principal do ranking enquanto tem jogo.
  const opcao = (ativo: boolean) =>
    `inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-3 text-sm font-bold transition-colors ${
      ativo ? 'bg-primary text-ink shadow-glow-soft' : 'text-zinc-300 hover:bg-ink-elevated hover:text-white'
    }`;

  return (
    <>
      <div
        role="group"
        aria-label="Qual ranking mostrar"
        className="grid grid-cols-2 gap-1 rounded-xl border border-ink-line bg-ink-surface p-1"
      >
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
      {verAoVivo ? (
        <p className="mt-2 text-xs text-muted">
          Conta o placar de agora {rolando === 1 ? 'do jogo rolando' : `dos ${rolando} jogos rolando`}. Só vale
          quando o juiz apitar o fim.
        </p>
      ) : null}
      <div className="mt-3">{verAoVivo ? aoVivo : oficial}</div>
    </>
  );
}
