import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import PaginaTemporada from '@/components/bolao/PaginaTemporada';

type Params = { params: { ano: string } };

function anoValido(bruto: string): number | null {
  return /^20\d{2}$/.test(bruto) ? Number(bruto) : null;
}

export function generateMetadata({ params }: Params): Metadata {
  const ano = anoValido(params.ano);
  return {
    title: ano ? `Bolão da bancada · ${ano}` : 'Bolão da bancada',
    description: ano ? `Como terminou o bolão da bancada do VARzômetro no Brasileirão ${ano}.` : undefined,
    alternates: { canonical: ano ? `/bolao/temporada/${ano}` : '/bolao' },
  };
}

// Campeonato que acabou quase não muda, mas a correção de um placar pelo admin
// ainda precisa aparecer: mesmo ritmo do resto do bolão.
export const revalidate = 300;
export const dynamicParams = true;
export function generateStaticParams() {
  return [];
}

export default function TemporadaPage({ params }: Params) {
  const ano = anoValido(params.ano);
  if (!ano) notFound();
  return <PaginaTemporada ano={ano} />;
}
