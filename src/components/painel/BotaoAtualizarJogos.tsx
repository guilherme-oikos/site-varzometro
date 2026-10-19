'use client';

import { useState, useTransition } from 'react';
import { atualizarJogos, type Resultado } from '@/app/painel/actions';

/** Só para o admin: busca os jogos no football-data na hora. */
export default function BotaoAtualizarJogos() {
  const [resultado, setResultado] = useState<Resultado | null>(null);
  const [atualizando, iniciar] = useTransition();

  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
      <button
        type="button"
        onClick={() => iniciar(async () => setResultado(await atualizarJogos()))}
        disabled={atualizando}
        className="btn-ghost"
      >
        {atualizando ? 'Buscando...' : 'Atualizar jogos agora'}
      </button>
      {resultado ? (
        <p
          role={resultado.ok ? 'status' : 'alert'}
          className={`text-sm font-medium ${resultado.ok ? 'text-emerald-400' : 'text-red-400'}`}
        >
          {resultado.ok ? resultado.mensagem : resultado.erro}
        </p>
      ) : null}
    </div>
  );
}
