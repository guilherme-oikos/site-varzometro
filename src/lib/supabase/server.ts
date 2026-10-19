import 'server-only';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { SUPABASE_ANON_KEY, SUPABASE_URL } from '@/lib/supabase/config';

/**
 * Cliente com a sessão de quem está logado, para o painel e as Server Actions.
 *
 * `cache: 'no-store'` porque o painel precisa ver o que acabou de salvar — e o
 * rascunho de um não pode ficar no cache compartilhado do outro.
 */
export function supabaseServidor() {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error('[supabase] NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY não configuradas.');
  }

  const loja = cookies();

  return createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: {
      fetch: (entrada, init) => fetch(entrada, { ...init, cache: 'no-store' }),
    },
    cookies: {
      getAll: () => loja.getAll(),
      setAll: (lista) => {
        // Em Server Component o Next não deixa gravar cookie e lança erro. Tudo
        // bem: o middleware já renovou a sessão antes de a página rodar.
        try {
          lista.forEach(({ name, value, options }) => loja.set(name, value, options));
        } catch {}
      },
    },
  });
}
