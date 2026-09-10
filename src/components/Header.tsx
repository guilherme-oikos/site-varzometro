'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import Logo from '@/components/Logo';
import { CloseIcon, MenuIcon, SpotifyIcon, YoutubeIcon } from '@/components/Icons';
import { navLinks, socials } from '@/lib/site';

/** As âncoras do menu que apontam para uma seção da home, na ordem da página. */
const secoes = navLinks
  .map((link) => link.href.match(/^\/#(.+)$/)?.[1])
  .filter((id): id is string => Boolean(id));

export default function Header() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [secaoAtiva, setSecaoAtiva] = useState<string | null>(null);
  const rota = usePathname();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  /*
   * Em qual seção a pessoa está. É a única orientação que uma página de âncoras
   * pode dar: sem isso o menu tem cinco itens e nenhum deles diz onde você está.
   *
   * IntersectionObserver, não listener de scroll: o navegador avisa quando a
   * seção entra ou sai, sem medir posição a cada quadro.
   *
   * A faixa de leitura é estreita de propósito — do fim do header fixo (92px)
   * até 30% da tela. Faixa larga deixa duas seções dentro dela ao mesmo tempo
   * e aí a escolha vira sorteio: com -55% embaixo, "A Bancada" continuava
   * acesa quando dela só restava uma tira de 94px no topo.
   */
  useEffect(() => {
    if (rota !== '/') {
      setSecaoAtiva(null);
      return;
    }

    const alvos = secoes
      .map((id) => document.getElementById(id))
      .filter((no): no is HTMLElement => Boolean(no));

    if (alvos.length === 0) return;

    const visiveis = new Set<string>();

    const observador = new IntersectionObserver(
      (entradas) => {
        for (const entrada of entradas) {
          if (entrada.isIntersecting) visiveis.add(entrada.target.id);
          else visiveis.delete(entrada.target.id);
        }

        // A última da ordem da página, e não a primeira: quando duas dividem a
        // faixa, a de baixo é a que a pessoa está entrando.
        const naFaixa = [...secoes].reverse().find((id) => visiveis.has(id));

        /*
         * Abaixo da última seção observada — o blog da home, o rodapé — não há
         * nada na faixa. Aí vale a última que já passou por cima dela, medida
         * na hora. Guardar simplesmente "a anterior" quebrava no salto: quem
         * aperta End ou clica num link do rodapé pula de uma vez, o conjunto
         * de visíveis esvazia sem passo intermediário e o menu ficava marcando
         * "Início" com a pessoa lá embaixo.
         */
        const acima = [...secoes]
          .reverse()
          .find((id) => {
            const no = document.getElementById(id);
            return no ? no.getBoundingClientRect().top < 92 : false;
          });

        setSecaoAtiva(naFaixa ?? acima ?? null);
      },
      { rootMargin: '-92px 0px -70% 0px' },
    );

    alvos.forEach((alvo) => observador.observe(alvo));
    return () => observador.disconnect();
  }, [rota]);

  const estaAtivo = (href: string) => {
    const secao = href.match(/^\/#(.+)$/)?.[1];
    if (secao) return rota === '/' && secao === secaoAtiva;
    return rota === href || rota.startsWith(`${href}/`);
  };

  // Trava o scroll do body enquanto o menu mobile estiver aberto.
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ease-smooth ${
        scrolled
          ? 'border-b border-ink-line bg-ink/85 backdrop-blur-xl'
          : 'border-b border-transparent bg-transparent'
      }`}
    >
      <div className="container-page">
        <div className="flex h-[72px] items-center justify-between gap-4">
          <Logo priority />

          <nav className="hidden items-center gap-1 md:flex">
            {navLinks.map((link) => {
              const ativo = estaAtivo(link.href);

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  aria-current={ativo ? 'true' : undefined}
                  className={`toque relative inline-flex items-center rounded-lg px-3.5 py-2 text-sm font-semibold transition-colors duration-200 hover:bg-white/[0.04] ${
                    ativo ? 'text-white' : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  {link.label}

                  {/*
                    Marca curta embaixo do rótulo, não pílula preenchida: o
                    header tem um botão laranja sólido a três centímetros dali,
                    e dois blocos laranja disputando não orientam ninguém.
                  */}
                  <span
                    aria-hidden
                    className={`absolute inset-x-3.5 bottom-0.5 h-[2px] origin-center rounded-full bg-primary transition-transform duration-300 ease-smooth ${
                      ativo ? 'scale-x-100' : 'scale-x-0'
                    }`}
                  />
                </Link>
              );
            })}
          </nav>

          {/*
            O YouTube é o canal principal declarado no PRODUCT.md, então é ele
            que carrega o botão sólido. O Spotify fica ao lado, em ícone.
          */}
          <div className="flex items-center gap-2">
            <a
              href={socials.spotify}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Ouvir o VARzômetro no Spotify"
              className="hidden h-11 w-11 place-items-center rounded-xl border border-ink-line bg-ink-surface text-muted transition-colors hover:border-[#1DB954]/50 hover:text-white sm:grid"
            >
              <SpotifyIcon className="h-[18px] w-[18px]" />
            </a>

            <a
              href={socials.youtube}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary hidden !px-5 !py-2.5 sm:inline-flex"
            >
              <YoutubeIcon className="h-4 w-4" />
              Assistir no YouTube
            </a>

            <button
              type="button"
              onClick={() => setOpen((value) => !value)}
              aria-label={open ? 'Fechar menu' : 'Abrir menu'}
              aria-expanded={open}
              className="grid h-11 w-11 place-items-center rounded-xl border border-ink-line bg-ink-surface text-zinc-300 transition-colors hover:text-white md:hidden"
            >
              {open ? (
                <CloseIcon className="h-5 w-5" />
              ) : (
                <MenuIcon className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Drawer mobile */}
      <div
        className={`overflow-hidden border-t border-ink-line bg-ink/98 backdrop-blur-xl transition-[max-height,opacity] duration-300 ease-smooth md:hidden ${
          open ? 'max-h-[420px] opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <nav className="container-page flex flex-col gap-1 py-4">
          {navLinks.map((link) => {
            const ativo = estaAtivo(link.href);

            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                aria-current={ativo ? 'true' : undefined}
                className={`flex items-center justify-between rounded-xl px-4 py-3.5 text-base font-semibold transition-colors hover:bg-white/[0.05] hover:text-primary ${
                  ativo ? 'bg-white/[0.04] text-white' : 'text-zinc-300'
                }`}
              >
                {link.label}
                {ativo ? (
                  <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-primary" />
                ) : null}
              </Link>
            );
          })}

          <a
            href={socials.youtube}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setOpen(false)}
            className="btn-primary mt-3 w-full"
          >
            <YoutubeIcon className="h-4 w-4" />
            Assistir no YouTube
          </a>
        </nav>
      </div>
    </header>
  );
}
