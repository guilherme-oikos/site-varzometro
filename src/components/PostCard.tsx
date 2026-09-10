import Image from 'next/image';
import Link from 'next/link';
import { ArrowRightIcon, ClockIcon } from '@/components/Icons';
import { clubes } from '@/lib/site';
import type { PostMeta } from '@/lib/posts';

export default function PostCard({ post }: { post: PostMeta }) {
  const clube = clubes[post.clube];

  /*
   * O anel de foco vai no card, não no link. O link é um overlay
   * (`before:inset-0`) que cobre o card inteiro, mas o elemento focado é o
   * <a> em volta do título — o anel padrão desenhava um retângulo só ao redor
   * do texto, sem relação nenhuma com a área que o Enter vai acionar.
   * `focus-within` devolve o anel para a área clicável de verdade.
   */
  return (
    <article className="card card-hover group relative flex flex-col overflow-hidden focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2 focus-within:ring-offset-ink">
      {post.cover ? (
        <div className="relative aspect-[16/9] overflow-hidden bg-ink-elevated">
          <Image
            src={post.cover}
            /*
              Na arte de reserva o texto alternativo descreve a arte, não o
              artigo: anunciar o título como se fosse a imagem faria o leitor de
              tela ouvir a manchete duas vezes seguidas, e a segunda mentindo
              sobre o que está ali.
            */
            alt={
              post.capaPadrao
                ? 'Arte do VARzômetro'
                : (post.coverAlt ?? post.title)
            }
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 380px"
            className="object-cover transition-transform duration-500 ease-smooth group-hover:scale-105"
          />
          <span
            aria-hidden
            className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-ink-surface to-transparent"
          />
          <span className={`tag-clube absolute left-4 top-4 backdrop-blur-sm ${clube.classe}`}>
            {post.clube}
          </span>
        </div>
      ) : null}

      <div className="flex flex-1 flex-col p-6 sm:p-7">
        <div className="flex items-center justify-between gap-3">
          {post.cover ? (
            <span className="t-micro text-muted">
              {clube.nome}
            </span>
          ) : (
            <span className={`tag-clube ${clube.classe}`}>{post.clube}</span>
          )}

          <span className="t-micro numerico inline-flex items-center gap-1.5 text-muted">
            <ClockIcon className="h-3.5 w-3.5" />
            {post.readingTime}
          </span>
        </div>

        <h3 className="t-title mt-5 text-white transition-colors duration-200 group-hover:text-primary">
          <Link
            href={`/blog/${post.slug}`}
            className="outline-none ring-0 before:absolute before:inset-0 focus-visible:ring-0"
          >
            {post.title}
          </Link>
        </h3>

        <p className="t-body-sm mt-3 flex-1 text-muted">
          {post.excerpt}
        </p>

        <div className="mt-6 flex items-center justify-between gap-3 border-t border-ink-line pt-5">
          <div className="flex items-center gap-2.5">
            {post.autorFoto ? (
              <span className="relative block h-8 w-8 shrink-0 overflow-hidden rounded-full ring-1 ring-ink-line">
                <Image
                  src={post.autorFoto}
                  alt=""
                  fill
                  sizes="32px"
                  className="object-cover"
                />
              </span>
            ) : (
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-primary/15 text-[11px] font-extrabold text-primary">
                {post.autorIniciais}
              </span>
            )}
            <span className="text-xs">
              <span className="block font-semibold text-zinc-200">
                {post.author}
              </span>
              <time dateTime={post.date} className="numerico block text-[11px] text-muted">
                {post.dateLabel}
              </time>
            </span>
          </div>

          <ArrowRightIcon className="h-4 w-4 shrink-0 text-muted transition-all duration-300 ease-smooth group-hover:translate-x-1 group-hover:text-primary" />
        </div>
      </div>
    </article>
  );
}
