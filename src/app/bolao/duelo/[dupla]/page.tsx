import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import PaginaDuelo from '@/components/bolao/PaginaDuelo';
import { autoresDoRanking, paraSlug } from '@/lib/bolao';
import { getBolaoPublico } from '@/lib/bolao-dados';

type Params = { params: { dupla: string } };

const valido = (dupla: string) => /^[a-z0-9-]{1,40}-x-[a-z0-9-]{1,40}$/.test(dupla);

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const bolao = valido(params.dupla) ? await getBolaoPublico() : null;
  if (!bolao) return { title: 'Duelo da bancada' };
  const nomes = params.dupla
    .split('-x-')
    .map((slug) => autoresDoRanking(bolao.ranking).find((autor) => paraSlug(autor.nome) === slug)?.nome);
  if (nomes.some((nome) => !nome)) return { title: 'Duelo da bancada' };
  return {
    title: `${nomes[0]} x ${nomes[1]} · Duelo da bancada`,
    description: `O mano a mano de ${nomes[0]} e ${nomes[1]} no bolão do VARzômetro, jogo a jogo.`,
    alternates: { canonical: `/bolao/duelo/${params.dupla}` },
  };
}

// Como as rodadas: nenhuma dupla é gerada no build; cada uma é montada na
// primeira visita e fica no cache, refeita a cada 5 minutos no máximo.
export const revalidate = 300;
export const dynamicParams = true;
export function generateStaticParams() {
  return [];
}

export default function DueloPage({ params }: Params) {
  if (!valido(params.dupla)) notFound();
  return <PaginaDuelo dupla={params.dupla} />;
}
