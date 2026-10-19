import { NextResponse } from 'next/server';
import { atualizarParaLogado } from '@/lib/bolao-logado';

/** Placar novo do football-data, pedido pela página /bolao de quem está logado. Ver `src/lib/bolao-logado.ts`. */
export const dynamic = 'force-dynamic';

export async function POST() {
  const resultado = await atualizarParaLogado();
  return NextResponse.json(resultado, {
    status: resultado ? 200 : 401,
    headers: { 'Cache-Control': 'private, no-store' },
  });
}
