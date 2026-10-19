import { NextResponse } from 'next/server';
import { lerLembrete } from '@/lib/bolao-logado';

/** Quantos jogos dos próximos dias estão sem o palpite de quem está logado. Ver `src/lib/bolao-logado.ts`. */
export const dynamic = 'force-dynamic';

export async function GET() {
  const lembrete = await lerLembrete();
  return NextResponse.json(lembrete, {
    status: lembrete ? 200 : 401,
    headers: { 'Cache-Control': 'private, no-store' },
  });
}
