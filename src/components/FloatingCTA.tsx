'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { PlayIcon, SpotifyIcon, YoutubeIcon } from '@/components/Icons';
import { socials } from '@/lib/site';

/**
 * Botão fixo de conversão.
 * Mobile: barra inferior com os dois destinos.
 * Desktop: pílula flutuante no canto inferior direito.
 * Aparece só depois que o usuário rola a primeira dobra.
 *
 * Some na área da bancada (/painel e /login): é chamada para o público ouvir
 * o podcast, e ali só atrapalha quem está escrevendo — no celular a barra
 * cobria o fim do editor.
 *
 * Some também no bolão (/bolao e as páginas de rodada e de time): o botão
 * "Salvar palpites" fica grudado no pé da tela, no mesmo lugar.
 */
export default function FloatingCTA() {
  const [visivel, setVisivel] = useState(false);
  const rota = usePathname();

  useEffect(() => {
    const onScroll = () => setVisivel(window.scrollY > 520);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  if (rota.startsWith('/painel') || rota === '/login' || rota === '/bolao' || rota.startsWith('/bolao/')) {
    return null;
  }

  return (
    <>
      {/* Mobile */}
      <div
        className={`fixed inset-x-0 bottom-0 z-40 border-t border-ink-line bg-ink/95 px-4 pb-[calc(env(safe-area-inset-bottom)+12px)] pt-3 backdrop-blur-xl transition-transform duration-300 ease-smooth sm:hidden ${
          visivel ? 'translate-y-0' : 'translate-y-full'
        }`}
      >
        <div className="flex gap-2.5">
          <a
            href={socials.youtube}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary t-compact flex-1 !px-4 !py-3"
          >
            <PlayIcon className="h-3.5 w-3.5" />
            YouTube
          </a>
          <a
            href={socials.spotify}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-ghost t-compact flex-1 !px-4 !py-3"
          >
            <SpotifyIcon className="h-4 w-4 text-[#1DB954]" />
            Spotify
          </a>
        </div>
      </div>

      {/* Desktop */}
      <div
        className={`fixed bottom-7 right-7 z-40 hidden transition-all duration-300 ease-smooth sm:block ${
          visivel
            ? 'translate-y-0 opacity-100'
            : 'pointer-events-none translate-y-4 opacity-0'
        }`}
      >
        {/* O rótulo fica com o canal principal; o secundário vira ícone. */}
        <div className="flex items-center gap-2 rounded-2xl border border-ink-line bg-ink-surface/95 p-2 shadow-glow backdrop-blur-xl">
          <a
            href={socials.spotify}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Ouvir o VARzômetro no Spotify"
            className="grid h-11 w-11 place-items-center rounded-xl text-muted transition-colors hover:bg-white/5 hover:text-[#1DB954]"
          >
            <SpotifyIcon className="h-5 w-5" />
          </a>

          <a
            href={socials.youtube}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary t-compact !px-5 !py-3"
          >
            <YoutubeIcon className="h-4 w-4" />
            Assistir no YouTube
          </a>
        </div>
      </div>
    </>
  );
}
