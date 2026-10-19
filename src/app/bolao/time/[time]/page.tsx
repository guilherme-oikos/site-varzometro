import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import PaginaTime from '@/components/bolao/PaginaTime';
import { getTimePublico } from '@/lib/bolao-dados';

type Params = { params: { time: string } };

const valido = (slug: string) => /^[a-z0-9-]{1,40}$/.test(slug);

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const dados = valido(params.time) ? await getTimePublico(params.time) : null;
  if (!dados) return { title: 'Bolão da bancada' };
  return {
    title: `Bolão da bancada · ${dados.time.nome}`,
    description: `Os jogos do ${dados.time.nome} no bolão do VARzômetro e quem da bancada mais acerta os palpites.`,
    alternates: { canonical: `/bolao/time/${dados.time.slug}` },
  };
}

// Como as rodadas: nenhum time é gerado no build; cada um é montado na
// primeira visita e fica no cache, refeito a cada 5 minutos no máximo.
export const revalidate = 300;
export const dynamicParams = true;
export function generateStaticParams() {
  return [];
}

export default function TimePage({ params }: Params) {
  if (!valido(params.time)) notFound();
  return <PaginaTime slug={params.time} />;
}
