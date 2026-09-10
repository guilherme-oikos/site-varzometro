import Link from 'next/link';
import Logo from '@/components/Logo';
import CopiarEmail from '@/components/CopiarEmail';
import {
  InstagramIcon,
  MailIcon,
  SpotifyIcon,
  TiktokIcon,
  YoutubeIcon,
} from '@/components/Icons';
import { navLinks, site, socials } from '@/lib/site';

const redes = [
  { label: 'YouTube', href: socials.youtube, Icon: YoutubeIcon },
  { label: 'Spotify', href: socials.spotify, Icon: SpotifyIcon },
  { label: 'TikTok', href: socials.tiktok, Icon: TiktokIcon },
  { label: 'Instagram', href: socials.instagram, Icon: InstagramIcon },
];

export default function Footer() {
  return (
    <footer className="relative border-t border-ink-line bg-ink-deep pb-28 pt-16 sm:pb-16">
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-0 h-px w-2/3 -translate-x-1/2 divider-glow"
      />

      <div className="container-page">
        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-12">
          <div className="md:col-span-2 lg:col-span-5">
            <Logo className="h-12 sm:h-14" />

            <p className="t-body-sm mt-5 max-w-sm text-muted">
              O hub da resenha do futebol paulista. Quatro torcedores, quatro
              visões e nenhuma frescura — do pré-jogo ao pós-jogo dos 4 grandes
              de SP.
            </p>

            <div className="mt-6 flex flex-wrap gap-2.5">
              {redes.map(({ label, href, Icon }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`VARzômetro no ${label}`}
                  className="grid h-11 w-11 place-items-center rounded-xl border border-ink-line bg-ink-surface text-zinc-400 transition-all duration-200 ease-smooth hover:border-primary/50 hover:text-primary"
                >
                  <Icon className="h-[18px] w-[18px]" />
                </a>
              ))}
            </div>
          </div>

          <div className="lg:col-span-3">
            <h3 className="t-label text-white">
              Navegação
            </h3>
            <ul className="mt-5 space-y-3">
              {navLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="toque-linha inline-block text-sm text-muted transition-colors hover:text-primary"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="lg:col-span-4">
            <h3 className="t-label text-white">
              Publicidade e Parcerias
            </h3>

            <p className="t-body-sm mt-5 text-muted">
              Quer anunciar no VARzômetro, propor uma parceria ou sugerir pauta?
              Fale direto com a bancada.
            </p>

            <a
              href={`mailto:${site.email}?subject=Publicidade%20e%20parcerias%20%7C%20VARz%C3%B4metro`}
              className="btn-primary mt-5 w-full sm:w-auto"
            >
              <MailIcon className="h-4 w-4" />
              Publicidade e Parcerias
            </a>

            {/*
              O e-mail e o botão de copiar ficam no mesmo `inline-flex`: se a
              linha estourar, os dois descem juntos. Soltos, o "Copiar" caía
              sozinho na linha de baixo, encostado na margem, sem parecer ter
              relação com o endereço acima dele.
            */}
            <p className="mt-3 text-xs leading-relaxed text-muted">
              ou escreva para{' '}
              <span className="inline-flex items-center gap-1 whitespace-nowrap align-middle">
                <a
                  href={`mailto:${site.email}`}
                  className="font-semibold text-zinc-300 underline decoration-ink-line underline-offset-4 transition-colors hover:text-primary"
                >
                  {site.email}
                </a>
                <CopiarEmail email={site.email} />
              </span>
            </p>
          </div>
        </div>

        <div className="mt-14 flex flex-col items-center justify-between gap-4 border-t border-ink-line pt-8 text-xs text-muted sm:flex-row">
          <p>
            © {new Date().getFullYear()} {site.name}. Todos os direitos
            reservados.
          </p>

          <div className="flex items-center gap-4">
            <Link
              href="/politica-de-privacidade"
              className="toque-linha inline-block transition-colors hover:text-primary"
            >
              Política de Privacidade
            </Link>
            <span aria-hidden className="h-3 w-px bg-ink-line" />
            <p>Feito para quem ama futebol sem filtro.</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
