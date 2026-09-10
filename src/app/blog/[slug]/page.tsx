import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { MDXRemote } from 'next-mdx-remote/rsc';
import remarkUnwrapImages from 'remark-unwrap-images';
import PostCard from '@/components/PostCard';
import { mdxComponents } from '@/components/MdxComponents';
import { ArrowLeftIcon, ClockIcon } from '@/components/Icons';
import {
  getAllPosts,
  getPostBySlug,
  getRelatedPosts,
  OG_PADRAO,
} from '@/lib/posts';
import { clubes, site } from '@/lib/site';

type Params = { params: { slug: string } };

export function generateStaticParams() {
  return getAllPosts().map((post) => ({ slug: post.slug }));
}

export function generateMetadata({ params }: Params): Metadata {
  const post = getPostBySlug(params.slug);
  if (!post) return { title: 'Artigo não encontrado' };

  return {
    title: post.title,
    description: post.excerpt,
    alternates: { canonical: `/blog/${post.slug}` },
    openGraph: {
      type: 'article',
      title: post.title,
      description: post.excerpt,
      publishedTime: post.date,
      authors: [post.author],
      url: `${site.url}/blog/${post.slug}`,
      /*
        A capa do artigo é a imagem que aparece ao compartilhar no WhatsApp —
        mas só quando é uma capa de verdade. A arte de reserva é SVG, e nem
        WhatsApp nem Facebook renderizam SVG em prévia de link: o artigo sairia
        sem imagem nenhuma. Nesse caso vai a arte do site, em JPG.
      */
      images: [{ url: post.capaPadrao ? OG_PADRAO : (post.cover ?? OG_PADRAO) }],
    },
  };
}

export default function PostPage({ params }: Params) {
  const post = getPostBySlug(params.slug);
  if (!post) notFound();

  const clube = clubes[post.clube];
  const relacionados = getRelatedPosts(post.slug);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.excerpt,
    datePublished: post.date,
    inLanguage: 'pt-BR',
    author: { '@type': 'Person', name: post.author },
    publisher: { '@type': 'Organization', name: site.name },
    mainEntityOfPage: `${site.url}/blog/${post.slug}`,
  };

  return (
    <article className="relative pb-24 pt-28 sm:pt-36">
      {/*
        Quanto falta para acabar de ler. Existe só aqui, onde a página é longa
        e a pessoa está de fato lendo — na home seria enfeite. Puro CSS: o
        preenchimento vem de `animation-timeline: scroll()`, sem listener e sem
        estado. Ver `.progresso-leitura` no globals.css.
      */}
      <div aria-hidden className="progresso-leitura" />

      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-80 bg-fade-primary"
      />

      <div className="container-page relative">
        <Link
          href="/blog"
          className="toque-linha inline-flex items-center gap-2 text-xs font-bold text-zinc-400 transition-colors hover:text-primary"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          Voltar para o blog
        </Link>

        <header className="medida-titulo mx-auto mt-8">
          <div className="flex flex-wrap items-center gap-3">
            <span className={`tag-clube ${clube.classe}`}>{post.clube}</span>
            <span className="text-xs font-medium text-muted">
              {clube.nome}
            </span>
          </div>

          <h1 className="t-page mt-5 text-balance text-white">
            {post.title}
          </h1>

          <p className="t-lead medida-prosa mt-5 text-muted">
            {post.excerpt}
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-4 border-y border-ink-line py-5">
            {/*
              `alt=""` de propósito: o nome do autor está escrito ao lado, em
              texto. Descrever a foto de novo faria o leitor de tela anunciar a
              mesma pessoa duas vezes seguidas.
            */}
            {post.autorFoto ? (
              <span className="relative block h-10 w-10 shrink-0 overflow-hidden rounded-full ring-1 ring-ink-line">
                <Image
                  src={post.autorFoto}
                  alt=""
                  fill
                  sizes="40px"
                  className="object-cover"
                />
              </span>
            ) : (
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary/15 text-xs font-extrabold text-primary">
                {post.autorIniciais}
              </span>
            )}

            <span className="text-sm">
              <span className="block font-bold text-white">{post.author}</span>
              <span className="block text-xs text-muted">
                Bancada VARzômetro
              </span>
            </span>

            <span className="numerico ml-auto flex items-center gap-4 text-xs text-muted">
              <time dateTime={post.date}>{post.dateLabel}</time>
              <span className="inline-flex items-center gap-1.5">
                <ClockIcon className="h-3.5 w-3.5" />
                {post.readingTime}
              </span>
            </span>
          </div>
        </header>

        {post.cover ? (
          <figure className="mx-auto mt-10 max-w-4xl">
            <div className="relative aspect-[16/9] overflow-hidden rounded-2xl border border-ink-line bg-ink-elevated sm:rounded-3xl">
              <Image
                src={post.cover}
                alt={
                  post.capaPadrao
                    ? 'Arte do VARzômetro'
                    : (post.coverAlt ?? post.title)
                }
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 900px"
                className="object-cover"
              />
            </div>
            {/*
              Arte de reserva não ganha legenda: ela não descreve este artigo.
              O crédito da foto vem depois da legenda, um tom mais apagado — é
              obrigação de atribuição, não informação que o leitor procura.
            */}
            {!post.capaPadrao && (post.coverAlt || post.coverCredito) ? (
              <figcaption className="mt-3 text-center text-xs text-muted">
                {post.coverAlt}
                {post.coverCredito ? (
                  <span className="block text-[11px] text-zinc-500 sm:ml-2 sm:inline">
                    Foto: {post.coverCredito}
                  </span>
                ) : null}
              </figcaption>
            ) : null}
          </figure>
        ) : null}

        <div className="article-body medida-prosa mx-auto mt-10">
          {/*
            remarkUnwrapImages tira o <p> que o Markdown coloca em volta de uma
            imagem sozinha. Sem isso o <figure> ficaria dentro de <p>, que é HTML
            inválido e quebra a hidratação do React.
          */}
          <MDXRemote
            source={post.content}
            components={mdxComponents}
            options={{ mdxOptions: { remarkPlugins: [remarkUnwrapImages] } }}
          />
        </div>

        <div className="medida-prosa mx-auto mt-14 rounded-2xl border border-primary/25 bg-primary/[0.06] p-7 text-center sm:p-9">
          <p className="text-lg font-bold text-white sm:text-xl">
            Gostou da análise? A resenha completa está no episódio.
          </p>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted">
            Toda semana a bancada debate esses temas com as quatro torcidas na
            mesa.
          </p>
          <Link href="/#episodios" className="btn-primary mt-6">
            Ver os episódios
          </Link>
        </div>

        {relacionados.length > 0 ? (
          <section className="mt-20">
            <h2 className="t-headline text-white">
              Leia também
            </h2>

            <div className="mt-6 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {relacionados.map((item) => (
                <PostCard key={item.slug} post={item} />
              ))}
            </div>
          </section>
        ) : null}
      </div>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </article>
  );
}
