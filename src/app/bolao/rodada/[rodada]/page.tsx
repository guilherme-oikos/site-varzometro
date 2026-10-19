import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import PaginaBolao from '@/components/bolao/PaginaBolao';

type Params = { params: { rodada: string } };

function numeroDaRodada(bruto: string): number | null {
  if (!/^\d{1,2}$/.test(bruto)) return null;
  const numero = Number(bruto);
  return numero >= 1 && numero <= 38 ? numero : null;
}

export function generateMetadata({ params }: Params): Metadata {
  const rodada = numeroDaRodada(params.rodada);
  return {
    title: rodada ? `Bolão da bancada · rodada ${rodada}` : 'Bolão da bancada',
    alternates: { canonical: rodada ? `/bolao/rodada/${rodada}` : '/bolao' },
  };
}

// Nenhuma rodada é gerada no build: cada uma é montada na primeira visita e
// fica no cache, como a página principal do bolão.
export const revalidate = 300;
export const dynamicParams = true;
export function generateStaticParams() {
  return [];
}

export default function RodadaPage({ params }: Params) {
  const rodada = numeroDaRodada(params.rodada);
  if (!rodada) notFound();
  return <PaginaBolao rodada={rodada} />;
}
