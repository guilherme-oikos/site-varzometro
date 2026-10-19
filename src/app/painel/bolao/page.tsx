import { redirect } from 'next/navigation';

/**
 * O palpite é feito direto em /bolao (ver `PalpitesDoLogado`). Este endereço
 * fica só para não quebrar link salvo, levando para a mesma rodada.
 */
export default function BolaoPainelPage({ searchParams }: { searchParams: { rodada?: string } }) {
  const rodada = String(searchParams.rodada ?? '');
  redirect(/^\d{1,2}$/.test(rodada) ? `/bolao/rodada/${rodada}` : '/bolao');
}
