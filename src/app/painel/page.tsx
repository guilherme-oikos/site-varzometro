import Link from 'next/link';
import { Suspense } from 'react';
import { criarArtigo } from '@/app/painel/actions';
import { ArrowLeftIcon, ArrowRightIcon } from '@/components/Icons';
import AvatarAutor from '@/components/painel/AvatarAutor';
import FiltrosArtigos, { type AutorDoFiltro } from '@/components/painel/FiltrosArtigos';
import EsqueletoArtigos from '@/components/painel/EsqueletoArtigos';
import { exigirSessao, type ArtigoDoPainel } from '@/lib/painel';
import { seloDoArtigo, siglaDeClube } from '@/lib/site';

const dataCurta = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  timeZone: 'America/Sao_Paulo',
});

const POR_PAGINA = 12;

type Linha = Pick<
  ArtigoDoPainel,
  'id' | 'slug' | 'titulo' | 'clube' | 'status' | 'publicado_em' | 'atualizado_em' | 'autor_id'
> & {
  autor: {
    nome: string;
    iniciais: string;
    foto_blog_url: string | null;
    foto_url: string | null;
  } | null;
};

type Busca = { q?: string; autor?: string; pagina?: string };

/** `%` e `_` são curingas do `ilike`: quem busca "100%" quer o caractere, não "qualquer coisa". */
function escaparCuringas(texto: string) {
  return texto.replace(/[\\%_]/g, '\\$&');
}

export default async function PainelPage({ searchParams }: { searchParams: Busca }) {
  const { supabase, user, perfil } = await exigirSessao();
  const admin = Boolean(perfil?.is_admin);

  const termo = String(searchParams.q ?? '')
    .trim()
    .slice(0, 100);
  const autorFiltro = admin ? String(searchParams.autor ?? '') : '';
  const pagina = Math.max(1, Number.parseInt(String(searchParams.pagina ?? '1'), 10) || 1);

  // Só o admin filtra por integrante. Convidado entra junto: também assina artigo.
  const { data: perfis } = admin
    ? await supabase
        .from('perfis')
        .select('id, nome, iniciais, foto_blog_url, foto_url')
        .order('na_bancada', { ascending: false })
        .order('ordem')
    : { data: null };

  const autores: AutorDoFiltro[] | null = perfis
    ? perfis.map((p) => ({
        id: p.id,
        nome: p.nome,
        iniciais: p.iniciais,
        foto: p.foto_blog_url ?? p.foto_url,
      }))
    : null;

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="t-headline text-white">{admin ? 'Artigos' : 'Meus artigos'}</h1>
          <p className="mt-2 text-sm text-muted">
            {admin
              ? 'Os artigos de toda a bancada, rascunhos inclusive. Publicado vai para o blog na hora.'
              : 'Rascunho só você vê. Publicado vai para o blog na hora.'}
          </p>
        </div>
        <form action={criarArtigo} className="w-full sm:w-auto">
          <button type="submit" className="btn-primary w-full sm:w-auto">
            Novo artigo
          </button>
        </form>
      </div>

      <FiltrosArtigos autores={autores}>
        {/*
        A `key` muda a cada filtro, busca ou página. Boundary nova não herda o
        conteúdo da anterior, então o esqueleto aparece na hora em vez de a
        lista velha ficar parada na tela até o banco responder.
      */}
        <Suspense key={`${termo}|${autorFiltro}|${pagina}`} fallback={<EsqueletoArtigos admin={admin} />}>
          <ListaArtigos
            supabase={supabase}
            usuarioId={user.id}
            admin={admin}
            termo={termo}
            autorFiltro={autorFiltro}
            pagina={pagina}
          />
        </Suspense>
      </FiltrosArtigos>
    </>
  );
}

async function ListaArtigos({
  supabase,
  usuarioId,
  admin,
  termo,
  autorFiltro,
  pagina,
}: {
  supabase: Awaited<ReturnType<typeof exigirSessao>>['supabase'];
  usuarioId: string;
  admin: boolean;
  termo: string;
  autorFiltro: string;
  pagina: number;
}) {
  const inicio = (pagina - 1) * POR_PAGINA;

  // Admin vê os artigos de todo mundo; os outros, só os próprios. A RLS
  // devolveria só os publicados dos outros de qualquer jeito — o filtro é para
  // a lista não misturar texto alheio com o seu.
  let consulta = supabase
    .from('artigos')
    .select(
      'id, slug, titulo, clube, status, publicado_em, atualizado_em, autor_id, ' +
        'autor:perfis!artigos_autor_id_fkey (nome, iniciais, foto_blog_url, foto_url)',
      { count: 'exact' },
    )
    .order('atualizado_em', { ascending: false })
    .range(inicio, inicio + POR_PAGINA - 1);

  if (!admin) consulta = consulta.eq('autor_id', usuarioId);
  else if (autorFiltro) consulta = consulta.eq('autor_id', autorFiltro);
  if (termo) consulta = consulta.ilike('titulo', `%${escaparCuringas(termo)}%`);

  const { data: artigos, error, count } = await consulta.returns<Linha[]>();

  const total = count ?? 0;
  const totalPaginas = Math.max(1, Math.ceil(total / POR_PAGINA));
  const filtrando = Boolean(termo || autorFiltro);

  const linkPagina = (numero: number) => {
    const params = new URLSearchParams();
    if (termo) params.set('q', termo);
    if (autorFiltro) params.set('autor', autorFiltro);
    if (numero > 1) params.set('pagina', String(numero));
    const texto = params.toString();
    return texto ? `/painel?${texto}` : '/painel';
  };

  return (
    <>
      {error ? (
        <p role="alert" className="mt-8 text-sm text-red-400">
          Não deu para carregar os artigos: {error.message}
        </p>
      ) : null}

      {artigos ? (
        <p className="numerico mt-6 text-xs text-muted" aria-live="polite">
          {total === 0
            ? null
            : `${total} ${total === 1 ? 'artigo' : 'artigos'}${totalPaginas > 1 ? ` · página ${pagina} de ${totalPaginas}` : ''}`}
        </p>
      ) : null}

      {artigos && artigos.length === 0 ? (
        <div className="card mt-3 p-8 text-center text-sm text-muted">
          {filtrando ? (
            <>
              Nada encontrado com esse filtro.{' '}
              <Link href="/painel" className="font-semibold text-primary hover:underline">
                Limpar filtros
              </Link>
            </>
          ) : pagina > 1 ? (
            <>
              Essa página não existe.{' '}
              <Link href="/painel" className="font-semibold text-primary hover:underline">
                Voltar para o começo
              </Link>
            </>
          ) : (
            'Nenhum artigo ainda. Clica em “Novo artigo” para começar.'
          )}
        </div>
      ) : null}

      <ul className="mt-3 space-y-3">
        {artigos?.map((artigo) => {
          const selo = seloDoArtigo(siglaDeClube(artigo.clube));
          const publicado = artigo.status === 'publicado';
          const meu = artigo.autor_id === usuarioId;
          return (
            <li key={artigo.id}>
              {/*
                No celular o card tem duas linhas: em cima clube, situação e
                data; embaixo o título inteiro, que é o que importa. Do `sm`
                para cima vira uma linha só — o `sm:contents` desfaz a linha de
                cima e os itens se reordenam ao redor do título.
              */}
              <Link
                href={`/painel/artigos/${artigo.id}`}
                className="card card-hover group flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:gap-4 sm:p-5"
              >
                <div className="flex items-center gap-2 sm:contents">
                  <span className={`tag-clube ${selo.classe} shrink-0 justify-center sm:order-1 sm:w-16`}>
                    {selo.sigla}
                  </span>
                  <span
                    className={`t-micro shrink-0 rounded-full border px-2.5 py-1 text-center uppercase sm:order-3 sm:w-28 ${
                      publicado ? 'border-emerald-500/40 text-emerald-400' : 'border-ink-line text-muted'
                    }`}
                  >
                    {publicado ? 'Publicado' : 'Rascunho'}
                  </span>
                  <span className="numerico ml-auto shrink-0 whitespace-nowrap text-xs text-muted sm:order-4 sm:ml-0 sm:w-44 sm:text-right">
                    {publicado && artigo.publicado_em
                      ? dataCurta.format(new Date(artigo.publicado_em))
                      : `editado ${dataCurta.format(new Date(artigo.atualizado_em))}`}
                  </span>
                </div>

                <div className="min-w-0 sm:order-2 sm:flex-1">
                  <p className="line-clamp-2 font-bold leading-snug text-white transition-colors group-hover:text-primary">
                    {artigo.titulo || <span className="text-muted">Sem título</span>}
                  </p>
                  {admin && artigo.autor ? (
                    <span
                      className={`mt-2 inline-flex items-center gap-1.5 rounded-full border py-0.5 pl-0.5 pr-2.5 text-xs font-semibold ${
                        meu ? 'border-primary/40 text-primary' : 'border-ink-line text-zinc-300'
                      }`}
                    >
                      <AvatarAutor
                        autor={{
                          iniciais: artigo.autor.iniciais,
                          foto: artigo.autor.foto_blog_url ?? artigo.autor.foto_url,
                        }}
                        tamanho="h-5 w-5"
                      />
                      {meu ? 'Você' : artigo.autor.nome}
                    </span>
                  ) : null}
                </div>

                <ArrowRightIcon className="hidden h-4 w-4 shrink-0 text-zinc-500 transition-colors group-hover:text-primary sm:order-5 sm:block" />
              </Link>
            </li>
          );
        })}
      </ul>

      {totalPaginas > 1 ? (
        <nav aria-label="Páginas" className="mt-8 flex items-center justify-between gap-4">
          {pagina > 1 ? (
            <Link href={linkPagina(pagina - 1)} className="btn-ghost toque inline-flex items-center gap-2">
              <ArrowLeftIcon className="h-4 w-4" />
              Anterior
            </Link>
          ) : (
            <span />
          )}
          <span className="numerico text-sm text-muted">
            {pagina} / {totalPaginas}
          </span>
          {pagina < totalPaginas ? (
            <Link href={linkPagina(pagina + 1)} className="btn-ghost toque inline-flex items-center gap-2">
              Próxima
              <ArrowRightIcon className="h-4 w-4" />
            </Link>
          ) : (
            <span />
          )}
        </nav>
      ) : null}
    </>
  );
}
