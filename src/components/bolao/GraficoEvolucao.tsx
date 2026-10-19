'use client';

import dynamic from 'next/dynamic';
import type { Evolucao } from '@/lib/bolao';

/**
 * Evolução da bancada no bolão. O gráfico (Recharts, no padrão do shadcn/ui)
 * fica em `GraficoEvolucaoRecharts` e só é baixado no navegador, depois da
 * página: são uns 100 KB que quem só olha os jogos não precisa esperar.
 *
 * Enquanto carrega, um esqueleto do mesmo card, para a página não pular.
 */
const Grafico = dynamic(() => import('@/components/bolao/GraficoEvolucaoRecharts'), {
  ssr: false,
  // Mesmo card, com o título já no lugar, para a página não pular.
  loading: () => (
    <div role="status" aria-label="Carregando o gráfico" className="card overflow-hidden">
      <div className="flex flex-col gap-4 border-b border-ink-line p-5 sm:flex-row sm:justify-between sm:p-6">
        <div className="grid gap-1">
          <p className="font-semibold leading-none tracking-tight text-white">Evolução do bolão</p>
          <div className="mt-1 h-4 w-56 max-w-full rounded-md bg-white/[0.06] motion-safe:animate-pulse" />
        </div>
        <div className="h-8 w-48 rounded-lg bg-white/[0.05]" />
      </div>
      <div className="px-2 pt-6 sm:px-6">
        <div className="h-[240px] rounded-lg bg-white/[0.03] motion-safe:animate-pulse sm:h-[280px]" />
        <div className="mx-auto mt-3 h-6 w-64 max-w-full rounded-md bg-white/[0.05]" />
      </div>
      <div className="p-5 pt-4 sm:p-6 sm:pt-4">
        <div className="h-4 w-48 rounded-md bg-white/[0.06] motion-safe:animate-pulse" />
      </div>
    </div>
  ),
});

export default function GraficoEvolucao({ dados }: { dados: Evolucao }) {
  return <Grafico dados={dados} />;
}
