import { limparVariavel } from '@/lib/env';

/*
 * As duas variáveis são públicas por design: vão para o navegador, porque o
 * painel envia imagem direto para o Storage. Quem protege os dados é a RLS do
 * banco (supabase/migrations/0001_inicial.sql), não o segredo da chave.
 *
 * `process.env.NEXT_PUBLIC_...` precisa estar escrito por extenso: o Next só
 * substitui o valor no bundle do navegador quando encontra o nome literal.
 */
export const SUPABASE_URL = limparVariavel(process.env.NEXT_PUBLIC_SUPABASE_URL);
export const SUPABASE_ANON_KEY = limparVariavel(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

/**
 * Sem as variáveis, o site continua de pé lendo `content/posts/` e a bancada do
 * `site.ts` — é o modo de desenvolvimento sem conta no Supabase. O painel é que
 * não funciona.
 */
export const supabaseConfigurado = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

/** Bucket das fotos de perfil, capas e imagens do corpo dos artigos. */
export const BUCKET_IMAGENS = 'imagens';

/**
 * Etiqueta de cache de tudo que vem do banco. Salvar perfil ou artigo chama
 * `revalidateTag(TAG_CONTEUDO)`, e home, blog, artigos e sitemap se refazem na
 * hora, sem novo deploy.
 */
export const TAG_CONTEUDO = 'conteudo';

/** Etiqueta do bolão: palpite salvo, placar corrigido e sincronização a invalidam. */
export const TAG_BOLAO = 'bolao';
