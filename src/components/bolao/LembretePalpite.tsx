'use client';

import { useEffect, useState } from 'react';
import { ClockIcon } from '@/components/Icons';
import { quandoE } from '@/lib/bolao';
import type { Lembrete } from '@/lib/bolao-logado';
import { temCookieDeSessao } from '@/lib/usuario';

/** Disparado pelo `FormPalpites` depois de salvar: o lembrete se refaz. */
export const EVENTO_PALPITES_SALVOS = 'bolao:palpites-salvos';

/** Menos que isso para o apito, o aviso fica em laranja. */
const URGENTE_MS = 3 * 60 * 60 * 1000;

function falta(inicio: string): string {
  const minutos = Math.max(1, Math.round((new Date(inicio).getTime() - Date.now()) / 60000));
  if (minutos < 60) return `em ${minutos} min`;
  const horas = Math.round(minutos / 60);
  if (horas < 24) return `em ${horas}h`;
  const dias = Math.round(horas / 24);
  return dias === 1 ? 'amanhã' : `em ${dias} dias`;
}

/**
 * Aviso no topo do bolão para quem está logado e tem jogo sem palpite nos
 * próximos dias. Visitante não vê nada e não dispara nada (sem cookie de
 * sessão, nem chama a rota). Some quando não falta nenhum.
 */
export default function LembretePalpite() {
  const [lembrete, setLembrete] = useState<Lembrete | null>(null);

  useEffect(() => {
    if (!temCookieDeSessao()) return;
    let controle = new AbortController();

    const ler = () => {
      controle.abort();
      controle = new AbortController();
      fetch('/api/bolao/lembrete', { signal: controle.signal, cache: 'no-store' })
        .then((resposta) => (resposta.ok ? (resposta.json() as Promise<Lembrete>) : null))
        .then(setLembrete)
        .catch(() => {});
    };

    ler();
    window.addEventListener(EVENTO_PALPITES_SALVOS, ler);
    return () => {
      controle.abort();
      window.removeEventListener(EVENTO_PALPITES_SALVOS, ler);
    };
  }, []);

  if (!lembrete?.proximo || lembrete.faltam === 0) return null;

  const { proximo, faltam } = lembrete;
  const urgente = new Date(proximo.inicio).getTime() - Date.now() < URGENTE_MS;

  return (
    <div
      role="status"
      className={`card mt-8 p-4 sm:p-5 ${
        urgente ? 'border-primary/50 bg-primary/[0.06]' : ''
      }`}
    >
      <div className="flex items-start gap-3">
        <ClockIcon className={`mt-0.5 h-5 w-5 shrink-0 ${urgente ? 'text-primary' : 'text-zinc-400'}`} />
        <div>
          <p className="font-semibold text-white">
            {faltam === 1 ? 'Falta 1 jogo sem o seu palpite' : `Faltam ${faltam} jogos sem o seu palpite`}
          </p>
          <p className="mt-0.5 text-sm text-muted">
            {faltam === 1 ? 'É' : 'O primeiro é'} {proximo.mandante} x {proximo.visitante} (rodada {proximo.rodada}),{' '}
            <span className="numerico">{quandoE(proximo.inicio)}</span> —{' '}
            <span className={urgente ? 'font-semibold text-primary' : 'text-zinc-300'}>{falta(proximo.inicio)}</span>.
          </p>
        </div>
      </div>
    </div>
  );
}
