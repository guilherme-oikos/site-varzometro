import { NextResponse, type NextRequest } from 'next/server';
import { limparVariavel } from '@/lib/env';
import { supabaseConfigurado, SUPABASE_ANON_KEY, SUPABASE_URL } from '@/lib/supabase/config';

/**
 * Consulta diária para o Supabase grátis não pausar.
 *
 * Projeto do plano Free é pausado depois de 7 dias sem atividade no banco. Com
 * o cache do site, uma semana sem artigo novo e sem ninguém no painel é o
 * bastante para isso — e o site pararia de atualizar. A Vercel chama esta rota
 * uma vez por dia (ver `vercel.json`).
 *
 * A Vercel manda `Authorization: Bearer <CRON_SECRET>` sozinha quando a
 * variável existe. Sem ela configurada, a rota recusa todo mundo.
 */
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const segredo = limparVariavel(process.env.CRON_SECRET);
  if (!segredo || request.headers.get('authorization') !== `Bearer ${segredo}`) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  if (!supabaseConfigurado) {
    return NextResponse.json({ ok: false, motivo: 'Supabase não configurado' }, { status: 500 });
  }

  // Direto pela API REST, sem cache: o ponto é chegar no banco de verdade.
  const resposta = await fetch(`${SUPABASE_URL}/rest/v1/perfis?select=id&limit=1`, {
    headers: { apikey: SUPABASE_ANON_KEY!, Authorization: `Bearer ${SUPABASE_ANON_KEY}` },
    cache: 'no-store',
  });

  console.info(`[manter-ativo] Supabase respondeu ${resposta.status}.`);
  return NextResponse.json({ ok: resposta.ok, status: resposta.status }, { status: resposta.ok ? 200 : 502 });
}
