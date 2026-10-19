'use client';

import { useState, useTransition } from 'react';
import { corrigirJogo, type Resultado } from '@/app/painel/actions';
import { rotuloStatus, type Jogo, type StatusJogo } from '@/lib/bolao';

/**
 * Correção do admin dentro do card: situação e placar. Para quando a API erra,
 * demora para fechar o jogo ou some. Jogo corrigido fica travado para a
 * sincronização até alguém devolver para a API.
 */
export default function CorrecaoJogo({ jogo }: { jogo: Jogo }) {
  const [status, setStatus] = useState<StatusJogo>(jogo.status);
  const [mandante, setMandante] = useState(jogo.gols_mandante === null ? '' : String(jogo.gols_mandante));
  const [visitante, setVisitante] = useState(jogo.gols_visitante === null ? '' : String(jogo.gols_visitante));
  const [resultado, setResultado] = useState<Resultado | null>(null);
  const [salvando, iniciar] = useTransition();

  const enviar = (seguirApi: boolean) =>
    iniciar(async () => {
      setResultado(
        await corrigirJogo(jogo.id, { status, gols_mandante: mandante, gols_visitante: visitante, seguirApi }),
      );
    });

  const placarCampo = 'campo numerico !w-14 !px-0 !py-2 text-center';

  return (
    <details className="mt-4 border-t border-ink-line pt-3">
      <summary className="toque-linha cursor-pointer text-xs font-bold text-zinc-400 hover:text-primary">
        Corrigir jogo (admin){jogo.editado_a_mao ? ' · corrigido à mão' : ''}
      </summary>

      <form
        onSubmit={(evento) => {
          evento.preventDefault();
          enviar(false);
        }}
        className="mt-3 flex flex-wrap items-end gap-3"
      >
        <label className="block">
          <span className="rotulo !text-xs">Situação</span>
          <select
            value={status}
            onChange={(evento) => setStatus(evento.target.value as StatusJogo)}
            className="campo !py-2"
          >
            {Object.entries(rotuloStatus).map(([valor, rotulo]) => (
              <option key={valor} value={valor}>
                {rotulo}
              </option>
            ))}
          </select>
        </label>

        {status === 'encerrado' ? (
          <div className="flex items-center gap-2">
            <input
              aria-label={`Gols do ${jogo.mandante}`}
              inputMode="numeric"
              value={mandante}
              onChange={(evento) => setMandante(evento.target.value.replace(/\D/g, '').slice(0, 2))}
              className={placarCampo}
            />
            <span className="text-zinc-600">x</span>
            <input
              aria-label={`Gols do ${jogo.visitante}`}
              inputMode="numeric"
              value={visitante}
              onChange={(evento) => setVisitante(evento.target.value.replace(/\D/g, '').slice(0, 2))}
              className={placarCampo}
            />
          </div>
        ) : null}

        <button type="submit" disabled={salvando} className="btn-ghost !py-2">
          {salvando ? 'Salvando...' : 'Salvar correção'}
        </button>

        {jogo.editado_a_mao ? (
          <button type="button" onClick={() => enviar(true)} disabled={salvando} className="btn-ghost !py-2">
            Voltar a seguir a API
          </button>
        ) : null}
      </form>

      {resultado ? (
        <p
          role={resultado.ok ? 'status' : 'alert'}
          className={`mt-2 text-xs font-medium ${resultado.ok ? 'text-emerald-400' : 'text-red-400'}`}
        >
          {resultado.ok ? resultado.mensagem : resultado.erro}
        </p>
      ) : null}
    </details>
  );
}
