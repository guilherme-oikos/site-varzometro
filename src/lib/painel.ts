import 'server-only';
import { redirect } from 'next/navigation';
import { supabaseServidor } from '@/lib/supabase/server';

export type PerfilDoPainel = {
  id: string;
  nome: string;
  iniciais: string;
  clube: string;
  papel: string;
  funcao: string;
  bio: string;
  foto_url: string | null;
  foto_blog_url: string | null;
  is_admin: boolean;
};

export type ArtigoDoPainel = {
  id: string;
  slug: string | null;
  autor_id: string;
  titulo: string;
  resumo: string;
  conteudo: string;
  clube: string | null;
  capa_url: string | null;
  capa_alt: string | null;
  capa_credito: string | null;
  tags: string[];
  status: 'rascunho' | 'publicado';
  publicado_em: string | null;
  atualizado_em: string;
};

/**
 * Quem está logado e o perfil dele. Sem sessão, volta para /login — o
 * middleware já faz isso, mas a página não confia só nele.
 *
 * `perfil` nulo é login sem linha em `perfis`: conta criada no Auth e esquecida
 * no script de migração. O painel mostra um aviso em vez de quebrar.
 */
export async function exigirSessao() {
  const supabase = supabaseServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { data: perfil } = await supabase
    .from('perfis')
    .select('id, nome, iniciais, clube, papel, funcao, bio, foto_url, foto_blog_url, is_admin')
    .eq('id', user.id)
    .maybeSingle<PerfilDoPainel>();

  return { supabase, user, perfil };
}
