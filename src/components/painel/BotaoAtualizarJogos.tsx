'use client';

import { useEffect, useState, useTransition } from 'react';
import { atualizarJogos } from '@/app/painel/actions';
import { SpinnerIcon } from '@/components/Icons';
import { toast } from '@/components/ui/sonner';

/**
 * Só para o admin: busca os jogos no football-data na hora. O resultado sai em
 * toast, como o salvar palpites (o <Toaster> fica em `PalpitesDoLogado`).
 *
 * Cada clique é uma consulta, e o plano grátis de lá é de 10 por minuto. Se
 * estourar, o servidor devolve quantos segundos faltam e o botão trava com a
 * contagem até liberar — clicar antes só levaria outro 429.
 */
export default function BotaoAtualizarJogos() {
  const [atualizando, iniciar] = useTransition();
  // Momento em que o football-data libera de novo; `null` é liberado.
  const [liberaEm, setLiberaEm] = useState<number | null>(null);
  const [agora, setAgora] = useState(() => Date.now());

  useEffect(() => {
    if (liberaEm === null) return;
    const relogio = window.setInterval(() => {
      const instante = Date.now();
      setAgora(instante);
      if (instante >= liberaEm) setLiberaEm(null);
    }, 1000);
    return () => window.clearInterval(relogio);
  }, [liberaEm]);

  const faltam = liberaEm === null ? 0 : Math.max(0, Math.ceil((liberaEm - agora) / 1000));

  const atualizar = () =>
    iniciar(async () => {
      try {
        const resultado = await atualizarJogos();
        if (resultado.ok) {
          toast.success('Jogos atualizados', { description: resultado.mensagem });
        } else if (resultado.esperar !== undefined) {
          setAgora(Date.now());
          setLiberaEm(Date.now() + resultado.esperar * 1000);
          toast.error('Limite de buscas por minuto', { description: resultado.erro });
        } else {
          toast.error('Não deu para atualizar', { description: resultado.erro });
        }
      } catch {
        // A action nem respondeu: sem rede, ou o servidor caiu no meio.
        toast.error('Não deu para atualizar', { description: 'Sem conexão com o servidor. Confira a internet e tente de novo.' });
      }
    });

  return (
    <button
      type="button"
      onClick={atualizar}
      disabled={atualizando || faltam > 0}
      aria-busy={atualizando}
      className="btn-ghost disabled:opacity-50"
    >
      {atualizando ? <SpinnerIcon className="h-4 w-4 animate-spin" /> : null}
      {atualizando ? 'Buscando...' : faltam > 0 ? `Tente em ${faltam}s` : 'Atualizar jogos agora'}
    </button>
  );
}
