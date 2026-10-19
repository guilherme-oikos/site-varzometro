'use client';

import { useEffect, useRef } from 'react';

/**
 * Confirmação de ação sem volta (excluir artigo), no lugar do `window.confirm`.
 *
 * `<dialog>` nativo com `showModal()`: o navegador já prende o foco dentro do
 * modal, deixa o resto da página inerte e fecha com Esc — nada disso precisa
 * ser refeito à mão. O foco começa em "Cancelar", que é o botão seguro.
 *
 * Enquanto a ação roda (`ocupado`), Esc e clique fora não fecham: fechar no meio
 * da exclusão daria a impressão de que ela foi cancelada.
 */
export default function ModalConfirmacao({
  aberto,
  titulo,
  children,
  rotuloConfirmar,
  rotuloOcupado,
  ocupado,
  erro,
  onConfirmar,
  onFechar,
}: {
  aberto: boolean;
  titulo: string;
  children: React.ReactNode;
  rotuloConfirmar: string;
  rotuloOcupado: string;
  ocupado: boolean;
  erro?: string | null;
  onConfirmar: () => void;
  onFechar: () => void;
}) {
  const dialogo = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const no = dialogo.current;
    if (!no) return;
    if (aberto && !no.open) no.showModal();
    if (!aberto && no.open) no.close();
  }, [aberto]);

  const fechar = () => {
    if (!ocupado) onFechar();
  };

  return (
    <dialog
      ref={dialogo}
      aria-labelledby="modal-confirmacao-titulo"
      onCancel={(evento) => {
        // Esc: quem decide fechar é o estado do React, não o navegador.
        evento.preventDefault();
        fechar();
      }}
      onClick={(evento) => {
        // Clique no fundo escuro cai no próprio <dialog>, fora do cartão.
        if (evento.target === evento.currentTarget) fechar();
      }}
      // `!m-auto`: dentro de um `space-y-*` o Tailwind põe margem no topo e
      // zera a de baixo, e o modal grudava no alto da tela em vez de centralizar.
      className="!m-auto max-h-[calc(100%-2rem)] w-[calc(100%-2rem)] max-w-md bg-transparent p-0 text-left backdrop:bg-black/70 backdrop:backdrop-blur-sm"
    >
      <div className="card border-red-500/30 p-6 sm:p-7">
        <h2 id="modal-confirmacao-titulo" className="text-lg font-bold text-white">
          {titulo}
        </h2>
        <div className="mt-3 space-y-2 text-sm leading-relaxed text-zinc-300">{children}</div>

        {erro ? (
          <p role="alert" className="mt-4 text-sm font-medium text-red-400">
            {erro}
          </p>
        ) : null}

        <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button type="button" autoFocus onClick={fechar} disabled={ocupado} className="btn-ghost">
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirmar}
            disabled={ocupado}
            className="btn border border-red-500/60 bg-red-500/15 text-red-300 hover:bg-red-500/25 hover:text-white disabled:opacity-60"
          >
            {ocupado ? rotuloOcupado : rotuloConfirmar}
          </button>
        </div>
      </div>
    </dialog>
  );
}
