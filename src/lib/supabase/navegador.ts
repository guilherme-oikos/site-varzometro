'use client';

import { createBrowserClient } from '@supabase/ssr';
import { SUPABASE_ANON_KEY, SUPABASE_URL } from '@/lib/supabase/config';

/** Cliente do navegador. Usado só para enviar imagem direto ao Storage. */
export function supabaseNavegador() {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error('Supabase não configurado.');
  }
  return createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}
