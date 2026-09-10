import Image from 'next/image';
import Link from 'next/link';
import { site } from '@/lib/site';

type LogoProps = {
  /** Classe de altura da marca — a largura acompanha. */
  className?: string;
  priority?: boolean;
};

/**
 * Logo oficial do VARzômetro. O lockup já traz o nome da marca,
 * por isso não acompanha texto ao lado.
 */
export default function Logo({
  className = 'h-9 sm:h-10',
  priority = false,
}: LogoProps) {
  return (
    <Link
      href="/"
      className="toque inline-flex shrink-0 items-center transition-opacity duration-200 ease-smooth hover:opacity-80"
    >
      <Image
        src={site.logo}
        alt="VARzômetro"
        width={site.logoWidth}
        height={site.logoHeight}
        priority={priority}
        className={`w-auto ${className}`}
      />
      <span className="sr-only">Ir para a página inicial</span>
    </Link>
  );
}
