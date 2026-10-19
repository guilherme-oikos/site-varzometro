import { NextResponse, type NextRequest } from 'next/server';
import { lerMeuBolao } from '@/lib/bolao-logado';

/** Os dados de quem está logado para palpitar em /bolao. Ver `src/lib/bolao-logado.ts`. */
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const busca = request.nextUrl.searchParams;
  const time = busca.get('time') ?? '';
  const rodada = busca.get('rodada') ?? '';
  const meu = /^[a-z0-9-]{1,40}$/.test(time)
    ? await lerMeuBolao({ time })
    : await lerMeuBolao({ rodada: /^\d{1,2}$/.test(rodada) ? Number(rodada) : 0 });
  return NextResponse.json(meu, {
    status: meu ? 200 : 401,
    // Dado de uma pessoa: nada de cache compartilhado no caminho.
    headers: { 'Cache-Control': 'private, no-store' },
  });
}
