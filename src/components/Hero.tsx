import type { CSSProperties } from 'react';
import { PlayIcon, SpotifyIcon, YoutubeIcon } from '@/components/Icons';
import FeixesHero from '@/components/FeixesHero';
import { clubes, socials } from '@/lib/site';

const siglas = ['SPFC', 'SCCP', 'SEP', 'SFC'] as const;

/*
 * A cascata das quatro camisas, uma depois da outra, da esquerda para a
 * direita. É o momento focal do topo.
 */
const ATRASO_FAIXA = (i: number) => `${300 + i * 90}ms`;

export default function Hero() {
  return (
    <section
      id="inicio"
      className="relative overflow-hidden pb-16 pt-24 sm:pb-24 sm:pt-32"
    >
      {/*
        Os feixes ocuparam o lugar do halo laranja estático que ficava aqui:
        eram a mesma ideia, e empilhar os dois só viraria borrão. A faixa de
        cima e o degradê de baixo continuam — o de baixo é o que costura o topo
        com o fundo da página.
      */}
      <FeixesHero />

      {/*
        Véu de legibilidade: vem depois dos feixes e antes do conteúdo. Sem ele
        o texto de apoio cai para ~2:1 quando um feixe passa por trás dele.
      */}
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-veu-hero" />

      {/*
        A faixa `bg-fade-primary` de 520px saiu daqui: era um lençol laranja de
        12% cobrindo o topo inteiro, justamente a mancha que a versão de riscos
        finos existe para não ter. O token continua no lugar, usado na página
        do artigo.
      */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-56 bg-gradient-to-b from-transparent to-ink"
      />

      <div className="container-page relative">
        <div className="mx-auto max-w-3xl text-center">
          {/*
            Tamanho fluido em vez de degraus: "vive a arquibancada" não quebra
            linha (a sublinha depende disso) e a 34px fixos estourava a coluna
            em telas de 320-360px, ficando cortado.
          */}
          <h1 className="t-display animate-fade-up text-balance text-white">
            O futebol paulista analisado por quem{' '}
            <span className="relative whitespace-nowrap text-primary">
              vive a arquibancada
              <span
                aria-hidden
                className="absolute -bottom-1 left-0 h-[3px] w-full rounded-full bg-primary/40"
              />
            </span>
            .
          </h1>

          <p className="t-lead medida-apoio animate-fade-up mx-auto mt-6 text-balance text-muted [animation-delay:80ms]">
            Quatro torcedores, quatro visões e nenhuma frescura. O seu pré e
            pós-jogo dos 4 grandes de SP em uma resenha 100% autêntica entre
            amigos.
          </p>

          <div className="animate-fade-up mt-9 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center [animation-delay:160ms]">
            <a
              href={socials.youtube}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary group !py-4 sm:!px-8"
            >
              <span className="grid h-6 w-6 place-items-center rounded-full bg-ink/20 transition-transform duration-300 group-hover:scale-110">
                <PlayIcon className="ml-0.5 h-3 w-3" />
              </span>
              Assistir no YouTube
            </a>

            <a
              href={socials.spotify}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-ghost !py-4 sm:!px-8"
            >
              <SpotifyIcon className="h-5 w-5 text-[#1DB954]" />
              Ouvir no Spotify
            </a>
          </div>

          <div className="animate-fade-up mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-muted [animation-delay:240ms]">
            <span className="inline-flex items-center gap-2">
              <YoutubeIcon className="h-4 w-4" />
              Episódio novo toda semana
            </span>
            <span className="inline-flex items-center gap-2">
              <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-primary" />
              Pré-jogo e pós-jogo dos 4 grandes
            </span>
          </div>
        </div>

        {/*
          As quatro camisas, com as listras reais de cada clube, penduradas
          acima do card do seu time. Não é gráfico e não mede nada: são quatro
          faixas do mesmo tamanho — a regra de equilíbrio entre os 4 grandes
          dita em objeto, não em geometria.

          A faixa mora dentro da célula do card, e não numa grade própria: em
          duas colunas, duas grades separadas empilhavam as quatro bandeiras
          num bloco 2x2 e o Palmeiras acabava sobre o card do São Paulo.

          O anel de 1px existe porque metade dessas camisas tem preto: sobre o
          fundo grafite a listra escura some, e sem o contorno as faixas
          pareciam ter comprimentos diferentes — exatamente o contrário do que
          elas estão ali para dizer.
        */}
        <div className="animate-fade-up mt-14 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4 [animation-delay:300ms]">
          {siglas.map((sigla, i) => {
            const clube = clubes[sigla];

            return (
              <div
                key={sigla}
                style={{ '--clube': clube.cor } as CSSProperties}
              >
                <div
                  aria-hidden
                  style={{ '--faixa-atraso': ATRASO_FAIXA(i) } as CSSProperties}
                  className="faixa-clube flex h-2.5 overflow-hidden rounded-full ring-1 ring-inset ring-white/10"
                >
                  {clube.faixas.map((faixa, j) => (
                    <span
                      key={j}
                      className="h-full flex-1"
                      style={{ backgroundColor: faixa }}
                    />
                  ))}
                </div>

                <div className="group relative mt-3 overflow-hidden rounded-2xl border border-ink-line bg-ink-surface transition-all duration-300 ease-smooth hover:-translate-y-1 hover:border-[color:var(--clube)]">
                  <span
                    aria-hidden
                    className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full bg-[color:var(--clube)] opacity-[0.06] blur-2xl transition-opacity duration-300 group-hover:opacity-20"
                  />

                  <div className="relative p-5 sm:p-6">
                    <span
                      className="tag-clube border"
                      style={{
                        color: clube.corTexto,
                        borderColor: `${clube.cor}55`,
                        backgroundColor: `${clube.cor}14`,
                      }}
                    >
                      {sigla}
                    </span>

                    <p className="t-title mt-4 text-white">
                      {clube.nome}
                    </p>
                    <p className="mt-1 text-xs text-muted">
                      Na pauta toda semana
                    </p>

                    <span
                      className="mt-4 block text-[11px] font-extrabold uppercase tracking-widest opacity-80"
                      style={{ color: clube.corTexto }}
                    >
                      {clube.apelido}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
