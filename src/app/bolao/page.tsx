import type { Metadata } from 'next';
import PaginaBolao from '@/components/bolao/PaginaBolao';

export const metadata: Metadata = {
  title: 'Bolão da bancada',
  description:
    'Os palpites da bancada do VARzômetro para cada jogo do Brasileirão e o ranking de quem mais acerta.',
  alternates: { canonical: '/bolao' },
};

// O apito inicial abre os palpites e a sincronização traz o placar sem ninguém
// salvar nada: a página se refaz sozinha a cada 5 minutos, no máximo.
export const revalidate = 300;

export default function BolaoPage() {
  return <PaginaBolao />;
}
