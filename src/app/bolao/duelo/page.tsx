import type { Metadata } from 'next';
import PaginaDuelo from '@/components/bolao/PaginaDuelo';

export const metadata: Metadata = {
  title: 'Duelo da bancada',
  description: 'Um contra um no bolão do VARzômetro: em cada jogo, quem da bancada fez mais pontos.',
  alternates: { canonical: '/bolao/duelo' },
};

// Mesmo ritmo do resto do bolão: refeita a cada 5 minutos, no máximo.
export const revalidate = 300;

export default function DuelosPage() {
  return <PaginaDuelo />;
}
