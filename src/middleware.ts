import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { SUPABASE_ANON_KEY, SUPABASE_URL } from '@/lib/supabase/config';

/**
 * Renova a sessão e barra quem não está logado no painel.
 *
 * Roda só em /painel e /login (ver `matcher`). As páginas públicas não passam
 * por aqui: visitante não recebe cookie nenhum, como diz a política de
 * privacidade.
 */
export async function middleware(request: NextRequest) {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return NextResponse.next();
  }

  let resposta = NextResponse.next({ request });

  const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (lista) => {
        lista.forEach(({ name, value }) => request.cookies.set(name, value));
        resposta = NextResponse.next({ request });
        lista.forEach(({ name, value, options }) => resposta.cookies.set(name, value, options));
      },
    },
  });

  // `getUser` valida o token no servidor do Supabase; `getSession` só leria o
  // cookie, que qualquer um consegue forjar.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  // O redirecionamento leva junto o cookie que acabou de ser renovado; sem
  // isso a sessão expiraria no salto.
  const redirecionar = (destino: string) => {
    const url = request.nextUrl.clone();
    url.pathname = destino;
    url.search = '';
    const salto = NextResponse.redirect(url);
    resposta.cookies.getAll().forEach((cookie) => salto.cookies.set(cookie));
    return salto;
  };

  if (!user && pathname.startsWith('/painel')) return redirecionar('/login');
  if (user && pathname === '/login') return redirecionar('/painel');

  return resposta;
}

export const config = {
  matcher: ['/painel/:path*', '/login'],
};
