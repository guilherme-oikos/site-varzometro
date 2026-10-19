import { revalidateTag } from 'next/cache';
import { NextResponse, type NextRequest } from 'next/server';
import { sincronizarBolao } from '@/lib/bolao-sync';
import { limparVariavel } from '@/lib/env';
import { TAG_BOLAO } from '@/lib/supabase/config';

/**
 * Sincronização diária dos jogos do bolão com o football-data.org (ver
 * `vercel.json`). Roda de madrugada para pegar o placar dos jogos da noite.
 *
 * No plano grátis da Vercel o cron é no máximo diário. O resto do dia fica por
 * conta do painel: abrir o bolão logado sincroniza se a última passou de 1
 * minuto (com jogo em andamento) ou 10 (sem jogo), e o admin tem o botão
 * "Atualizar jogos agora".
 *
 * Mesma proteção do /api/manter-ativo: a Vercel manda o CRON_SECRET sozinha.
 */
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const segredo = limparVariavel(process.env.CRON_SECRET);
  if (!segredo || request.headers.get('authorization') !== `Bearer ${segredo}`) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const resultado = await sincronizarBolao();
  if (resultado.ok) revalidateTag(TAG_BOLAO);

  return NextResponse.json(resultado, { status: resultado.ok ? 200 : 502 });
}
