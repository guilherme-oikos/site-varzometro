import type { ImgHTMLAttributes } from 'react';

/**
 * Como o Markdown dos artigos vira HTML.
 *
 * Imagem no meio do texto:
 *   ![Descrição da imagem](/blog/nome-do-arquivo.jpg)
 *
 * Com legenda visível embaixo (o texto entre aspas):
 *   ![Descrição](/blog/nome-do-arquivo.jpg "Legenda que aparece na página")
 */

function ImagemDoArtigo({
  src,
  alt,
  title,
}: ImgHTMLAttributes<HTMLImageElement>) {
  if (!src) return null;

  return (
    <figure className="my-8">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={typeof src === 'string' ? src : ''}
        alt={alt ?? ''}
        loading="lazy"
        decoding="async"
        className="w-full rounded-2xl border border-ink-line bg-ink-elevated"
      />
      {title ? (
        <figcaption className="mt-3 text-center text-xs text-muted">
          {title}
        </figcaption>
      ) : null}
    </figure>
  );
}

export const mdxComponents = {
  img: ImagemDoArtigo,
};
