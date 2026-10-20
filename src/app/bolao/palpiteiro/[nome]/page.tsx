import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import PaginaPalpiteiro from '@/components/bolao/PaginaPalpiteiro';
import { autoresDoRanking, paraSlug } from '@/lib/bolao';
import { getBolaoPublico } from '@/lib/bolao-dados';

type Params = { params: { nome: string } };

const valido = (slug: string) => /^[a-z0-9-]{1,40}$/.test(slug);

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const bolao = valido(params.nome) ? await getBolaoPublico() : null;
  const autor = bolao ? autoresDoRanking(bolao.ranking).find((a) => paraSlug(a.nome) === params.nome) : null;
  if (!autor) return { title: 'Bolão da bancada' };
  return {
    title: `${autor.nome} · Bolão da bancada`,
    description: `Os palpites de ${autor.nome} no bolão do VARzômetro: melhor e pior rodada, onde manja e a freguesia.`,
    alternates: { canonical: `/bolao/palpiteiro/${params.nome}` },
  };
}

// Como as rodadas: ninguém é gerado no build; cada página é montada na
// primeira visita e fica no cache, refeita a cada 5 minutos no máximo.
export const revalidate = 300;
export const dynamicParams = true;
export function generateStaticParams() {
  return [];
}

export default function PalpiteiroPage({ params }: Params) {
  if (!valido(params.nome)) notFound();
  return <PaginaPalpiteiro slug={params.nome} />;
}
