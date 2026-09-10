import type { ReactNode } from 'react';

type SectionHeadingProps = {
  title: ReactNode;
  description?: string;
  align?: 'left' | 'center';
  className?: string;
};

/**
 * Título de seção. Sem rótulo solto acima do título: o título carrega o
 * próprio peso, e o texto de apoio vem depois dele.
 */
export default function SectionHeading({
  title,
  description,
  align = 'center',
  className = '',
}: SectionHeadingProps) {
  const isCenter = align === 'center';

  return (
    <div
      className={`${isCenter ? 'mx-auto max-w-2xl text-center' : 'max-w-2xl'} ${className}`}
    >
      <h2 className="t-headline text-balance text-white">
        {title}
      </h2>

      {description ? (
        <p
          className={`t-lead medida-apoio mt-4 text-balance text-muted ${
            isCenter ? 'mx-auto' : ''
          }`}
        >
          {description}
        </p>
      ) : null}
    </div>
  );
}
