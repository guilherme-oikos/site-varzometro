import 'server-only';
import { cache } from 'react';
import { bancada as bancadaDoCodigo, siglaDeClube, type Integrante } from '@/lib/site';
import { supabaseConfigurado } from '@/lib/supabase/config';
import { supabasePublico } from '@/lib/supabase/publico';

/** Colunas de `perfis` que o site público usa. */
export type LinhaPerfil = {
  id: string;
  nome: string;
  iniciais: string;
  clube: string;
  papel: string;
  funcao: string;
  bio: string;
  foto_url: string | null;
  foto_blog_url: string | null;
};

export function integranteDaLinha(linha: LinhaPerfil): Integrante {
  return {
    nome: linha.nome,
    iniciais: linha.iniciais,
    // O banco já restringe a sigla com `check`; a reserva só existe para o tipo.
    clube: siglaDeClube(linha.clube) ?? 'SPFC',
    papel: linha.papel,
    funcao: linha.funcao,
    bio: linha.bio,
    foto: linha.foto_url ?? undefined,
    fotoBlog: linha.foto_blog_url ?? undefined,
  };
}

/**
 * Quem ganha card na seção "A Bancada", na ordem definida pelo admin.
 *
 * Sem Supabase configurado, vale a lista do `site.ts`. Erro do banco sobe, pelo
 * mesmo motivo de `posts.ts`: manter no ar a última home boa em vez de publicar
 * uma bancada vazia.
 */
export const getBancada = cache(async (): Promise<Integrante[]> => {
  if (!supabaseConfigurado) return bancadaDoCodigo;

  const { data, error } = await supabasePublico()
    .from('perfis')
    .select('id, nome, iniciais, clube, papel, funcao, bio, foto_url, foto_blog_url')
    .eq('na_bancada', true)
    .order('ordem')
    .order('nome')
    .returns<LinhaPerfil[]>();

  if (error) {
    console.error(`[perfis] Supabase recusou a consulta: ${error.message}`);
    throw new Error(`[perfis] falha ao ler a bancada do Supabase: ${error.message}`);
  }

  return data.map(integranteDaLinha);
});
