import { createClient } from '@supabase/supabase-js';
import { NextResponse, type NextRequest } from 'next/server';
import { supabaseConfigurado, SUPABASE_ANON_KEY, SUPABASE_URL } from '@/lib/supabase/config';

/**
 * Contador de visualizações dos artigos (`0006_visualizacoes.sql`).
 *
 * - `POST { slug }` — a página do artigo chama ao abrir: soma 1 e devolve o total.
 * - `GET ?slugs=a,b,c` — os totais para os cards do /blog.
 *
 * Rota nossa, e não o navegador falando direto com o Supabase: a política de
 * privacidade só cita o Supabase para a área da bancada e as imagens. E não
 * leva cookie nem guarda nada de quem leu, então a página do artigo continua
 * estática e sem aviso de cookies.
 *
 * Quem lê a contagem é o navegador, depois de a página aparecer. Se o número
 * saísse no HTML, cada visita teria que refazer a página (ou o número ficaria
 * parado no cache), e as páginas do blog deixariam de ser estáticas.
 */
export const dynamic = 'force-dynamic';

// Mesma forma do `check` de `artigos.slug` no 0001_inicial.sql.
const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const valido = (slug: unknown): slug is string => typeof slug === 'string' && slug.length <= 120 && SLUG.test(slug);

/** Anônimo e sem cache do Next: contagem é coisa que precisa chegar no banco toda vez. */
function cliente() {
  return createClient(SUPABASE_URL!, SUPABASE_ANON_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { fetch: (entrada, init) => fetch(entrada, { ...init, cache: 'no-store' }) },
  });
}

const SEM_CACHE = { 'Cache-Control': 'private, no-store' };

export async function POST(request: NextRequest) {
  if (!supabaseConfigurado) return NextResponse.json({ total: null }, { status: 503, headers: SEM_CACHE });

  const corpo = (await request.json().catch(() => null)) as { slug?: unknown } | null;
  if (!valido(corpo?.slug)) return NextResponse.json({ total: null }, { status: 400, headers: SEM_CACHE });

  const { data, error } = await cliente().rpc('registrar_visualizacao', { slug_alvo: corpo.slug });
  if (error) {
    // Função ausente é o 0006_visualizacoes.sql que ainda não rodou.
    console.error(`[visualizacoes] Supabase recusou a contagem: ${error.message}`);
    return NextResponse.json({ total: null }, { status: 503, headers: SEM_CACHE });
  }
  return NextResponse.json({ total: data === null ? null : Number(data) }, { headers: SEM_CACHE });
}

export async function GET(request: NextRequest) {
  if (!supabaseConfigurado) return NextResponse.json({}, { status: 503, headers: SEM_CACHE });

  const slugs = (request.nextUrl.searchParams.get('slugs') ?? '').split(',').filter(valido).slice(0, 200);
  if (slugs.length === 0) return NextResponse.json({}, { headers: SEM_CACHE });

  const { data, error } = await cliente().rpc('visualizacoes_dos_artigos', { slugs });
  if (error) {
    console.error(`[visualizacoes] Supabase recusou a leitura: ${error.message}`);
    return NextResponse.json({}, { status: 503, headers: SEM_CACHE });
  }

  const totais: Record<string, number> = {};
  for (const linha of (data ?? []) as { slug: string; total: number | string }[]) totais[linha.slug] = Number(linha.total);
  // Um minuto no cache da Vercel: o blog inteiro aberto por muita gente vira
  // uma consulta por minuto, e o número atrasa no máximo isso.
  return NextResponse.json(totais, {
    headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300' },
  });
}
