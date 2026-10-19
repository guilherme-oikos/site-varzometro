import Link from 'next/link';
import { notFound } from 'next/navigation';
import EditorArtigo from '@/components/painel/EditorArtigo';
import { ArrowLeftIcon } from '@/components/Icons';
import { exigirSessao, type ArtigoDoPainel } from '@/lib/painel';

export default async function EditarArtigoPage({ params }: { params: { id: string } }) {
  const { supabase, user, perfil } = await exigirSessao();

  // ID que não é UUID faria o Postgres responder erro em vez de "não achei".
  if (!/^[0-9a-f-]{36}$/i.test(params.id)) notFound();

  const { data: artigo } = await supabase
    .from('artigos')
    .select('id, slug, autor_id, titulo, resumo, conteudo, clube, capa_url, capa_alt, capa_credito, tags, status, publicado_em, atualizado_em')
    .eq('id', params.id)
    .maybeSingle<ArtigoDoPainel>();

  // A RLS deixa ver artigo publicado de outra pessoa; editar, só o dono ou o admin.
  if (!artigo || (artigo.autor_id !== user.id && !perfil?.is_admin)) notFound();

  return (
    <>
      <Link href="/painel" className="toque-linha inline-flex items-center gap-2 text-xs font-bold text-zinc-400 hover:text-primary">
        <ArrowLeftIcon className="h-4 w-4" />
        Voltar para os artigos
      </Link>
      <div className="mt-6">
        <EditorArtigo artigo={artigo} usuarioId={user.id} />
      </div>
    </>
  );
}
