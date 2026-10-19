import 'server-only';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_ANON_KEY, SUPABASE_URL, TAG_BOLAO, TAG_CONTEUDO } from '@/lib/supabase/config';

const clientes = new Map<string, SupabaseClient>();

/**
 * Quanto cada tipo de conteúdo pode ficar no cache. Artigo e perfil só mudam
 * quando alguém salva no painel, que invalida a etiqueta na hora — a hora é só
 * rede de segurança. O bolão muda sozinho (o apito inicial abre os palpites, a
 * sincronização traz o placar), então fica no máximo 5 minutos.
 */
const CACHE = {
  conteudo: { tag: TAG_CONTEUDO, revalidate: 3600 },
  bolao: { tag: TAG_BOLAO, revalidate: 300 },
} as const;

/**
 * Cliente anônimo, sem cookie, para as páginas públicas.
 *
 * Sem sessão de propósito: ler cookie tornaria home e blog dinâmicos e cada
 * visita bateria no banco. Assim as consultas entram no cache do Next com a
 * etiqueta do tipo de conteúdo, e só saem dele quando alguém salva no painel
 * (ou depois do tempo de `CACHE`, como rede de segurança).
 *
 * Por ser anônimo, a RLS só deixa ver artigo publicado e palpite de jogo que
 * já começou — rascunho e palpite em aberto nunca vazam para o site, nem por
 * engano no código.
 */
export function supabasePublico(tipo: keyof typeof CACHE = 'conteudo'): SupabaseClient {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error('[supabase] NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY não configuradas.');
  }

  const { tag, revalidate } = CACHE[tipo];
  let cliente = clientes.get(tipo);

  if (!cliente) {
    cliente = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: {
        fetch: (entrada, init) => fetch(entrada, { ...init, next: { tags: [tag], revalidate } }),
      },
    });
    clientes.set(tipo, cliente);
  }

  return cliente;
}
