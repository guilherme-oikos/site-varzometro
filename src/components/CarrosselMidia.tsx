'use client';

import Image from 'next/image';
import { useCallback, useRef, useState } from 'react';
import SectionHeading from '@/components/SectionHeading';
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  ClockIcon,
  PlayIcon,
  SpotifyIcon,
  TiktokIcon,
  YoutubeIcon,
} from '@/components/Icons';
import type { Corte, Episodio } from '@/lib/site';
import { socials } from '@/lib/site';
import { ytCapa, ytCapaVertical, ytShort, ytWatch } from '@/lib/youtube';

type Aba = 'episodios' | 'cortes';

const ABAS: readonly Aba[] = ['episodios', 'cortes'];

type Props = {
  episodios: Episodio[];
  cortes: Corte[];
};

/**
 * Estado real da faixa que rola: se dá para ir para trás, se dá para ir para
 * frente e onde ela está. É o que alimenta as setas e o trilho de posição —
 * seta que continua acesa no fim da lista é o painel mentindo sobre si mesmo.
 */
function useTrilho() {
  const trilhoRef = useRef<HTMLDivElement | null>(null);
  const polegarRef = useRef<HTMLSpanElement | null>(null);
  const observadorRef = useRef<ResizeObserver | null>(null);
  const quadroRef = useRef<number | null>(null);

  const [pontas, setPontas] = useState({ noInicio: true, noFim: true });

  const medir = useCallback(() => {
    const trilho = trilhoRef.current;
    if (!trilho) return;

    const { scrollLeft, scrollWidth, clientWidth } = trilho;
    const maximo = scrollWidth - clientWidth;

    // 2px de folga: com zoom e densidade fracionária o fim quase nunca cai
    // exato, e sem a folga a seta da direita nunca desabilitaria.
    const noInicio = scrollLeft <= 2;
    const noFim = scrollLeft >= maximo - 2;

    const polegar = polegarRef.current;
    if (polegar) {
      const visivel = scrollWidth > 0 ? clientWidth / scrollWidth : 1;
      const andado = maximo > 0 ? scrollLeft / maximo : 0;
      polegar.style.width = `${visivel * 100}%`;
      polegar.style.left = `${andado * (100 - visivel * 100)}%`;
    }

    // Devolver o mesmo objeto quando nada mudou faz o React descartar o
    // update: a rolagem não re-renderiza a lista inteira a cada quadro.
    setPontas((atual) =>
      atual.noInicio === noInicio && atual.noFim === noFim
        ? atual
        : { noInicio, noFim },
    );
  }, []);

  const aoRolar = useCallback(() => {
    if (quadroRef.current !== null) return;
    quadroRef.current = requestAnimationFrame(() => {
      quadroRef.current = null;
      medir();
    });
  }, [medir]);

  /*
   * Ref de callback, e não `useRef` simples: o painel é remontado a cada troca
   * de aba, e é aqui que o listener migra para a faixa nova e a medição
   * recomeça do zero.
   */
  const conectarTrilho = useCallback(
    (no: HTMLDivElement | null) => {
      if (trilhoRef.current) {
        trilhoRef.current.removeEventListener('scroll', aoRolar);
      }
      observadorRef.current?.disconnect();
      observadorRef.current = null;

      trilhoRef.current = no;
      if (!no) return;

      no.addEventListener('scroll', aoRolar, { passive: true });
      const observador = new ResizeObserver(medir);
      observador.observe(no);
      observadorRef.current = observador;
      medir();
    },
    [aoRolar, medir],
  );

  /** Rola na largura de um card + gap. */
  const rolar = useCallback((direcao: 1 | -1) => {
    const trilho = trilhoRef.current;
    if (!trilho) return;

    const card = trilho.firstElementChild as HTMLElement | null;
    const passo = card ? card.offsetWidth + 20 : trilho.clientWidth * 0.8;
    trilho.scrollBy({ left: passo * direcao, behavior: 'smooth' });
  }, []);

  return { conectarTrilho, polegarRef, pontas, rolar };
}

export default function CarrosselMidia({ episodios, cortes }: Props) {
  const [aba, setAba] = useState<Aba>('episodios');
  const { conectarTrilho, polegarRef, pontas, rolar } = useTrilho();
  const botoesRef = useRef<Partial<Record<Aba, HTMLButtonElement | null>>>({});

  /*
   * `role="tablist"` promete seta esquerda/direita: quem navega por teclado
   * espera trocar de aba com as setas, não com Tab. Sem isso o papel ARIA
   * anuncia um comportamento que o componente não tem.
   */
  const aoTeclar = (evento: React.KeyboardEvent<HTMLDivElement>) => {
    const indice = ABAS.indexOf(aba);
    let proxima: Aba | undefined;

    if (evento.key === 'ArrowRight') proxima = ABAS[(indice + 1) % ABAS.length];
    else if (evento.key === 'ArrowLeft')
      proxima = ABAS[(indice - 1 + ABAS.length) % ABAS.length];
    else if (evento.key === 'Home') proxima = ABAS[0];
    else if (evento.key === 'End') proxima = ABAS[ABAS.length - 1];

    if (!proxima) return;
    evento.preventDefault();
    setAba(proxima);
    botoesRef.current[proxima]?.focus();
  };

  return (
    <section
      id="episodios"
      className="relative scroll-mt-24 border-y border-ink-line bg-ink-surface/40 py-20 sm:py-28"
    >
      <div className="container-page">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <SectionHeading
            align="left"
            title={
              <>
                Acompanhe a <span className="text-primary">resenha</span>
              </>
            }
            description="Episódios completos no YouTube e no Spotify, mais os cortes que rodam no Shorts e no TikTok."
          />

          {/*
            O indicador desliza entre as duas abas em vez de sumir de uma e
            aparecer na outra: é o movimento que explica que são dois estados
            do mesmo lugar, não dois lugares diferentes.
          */}
          <div
            role="tablist"
            aria-label="Formatos de conteúdo"
            onKeyDown={aoTeclar}
            className="relative grid w-full shrink-0 grid-cols-2 gap-1 rounded-2xl border border-ink-line bg-ink p-1.5 sm:w-auto"
          >
            {/*
              Largura e deslocamento em `style`: o JIT do Tailwind não emite
              valor arbitrário com `calc` + `%` em translate, e aqui o valor
              precisa acompanhar a largura real das duas colunas.
            */}
            <span
              aria-hidden
              style={{
                width: 'calc(50% - 0.5rem)',
                transform:
                  aba === 'cortes'
                    ? 'translateX(calc(100% + 0.25rem))'
                    : 'translateX(0)',
              }}
              className="absolute inset-y-1.5 left-1.5 rounded-xl bg-primary shadow-glow-soft transition-transform duration-300 ease-smooth"
            />
            <TabButton
              aoMontar={(no) => {
                botoesRef.current.episodios = no;
              }}
              active={aba === 'episodios'}
              onClick={() => setAba('episodios')}
              id="tab-episodios"
              controls="painel-episodios"
            >
              <YoutubeIcon className="h-4 w-4" />
              Episódios
            </TabButton>

            <TabButton
              aoMontar={(no) => {
                botoesRef.current.cortes = no;
              }}
              active={aba === 'cortes'}
              onClick={() => setAba('cortes')}
              id="tab-cortes"
              controls="painel-cortes"
            >
              <TiktokIcon className="h-4 w-4" />
              Cortes
            </TabButton>
          </div>
        </div>

        {aba === 'episodios' ? (
          <div
            role="tabpanel"
            id="painel-episodios"
            aria-labelledby="tab-episodios"
            className="animate-fade-up mt-12"
          >
            <div ref={conectarTrilho} className="swiper-row no-scrollbar">
              {episodios.map((ep) => {
                const link = ytWatch(ep.youtubeId);

                return (
                  <article
                    key={ep.youtubeId}
                    className="card card-hover swiper-item group flex w-[300px] flex-col overflow-hidden sm:w-[360px] lg:w-[380px]"
                  >
                    <div className="relative aspect-video overflow-hidden bg-ink-elevated">
                      <Image
                        src={ytCapa(ep.youtubeId)}
                        alt={ep.titulo}
                        fill
                        sizes="380px"
                        className="object-cover transition-transform duration-500 ease-smooth group-hover:scale-105"
                      />
                      <span
                        aria-hidden
                        className="absolute inset-0 bg-ink-deep/40 transition-colors duration-300 group-hover:bg-ink-deep/20"
                      />

                      <a
                        href={link}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`Assistir "${ep.titulo}" no YouTube`}
                        className="absolute inset-0 grid place-items-center"
                      >
                        <span className="grid h-14 w-14 place-items-center rounded-full bg-primary text-ink shadow-glow-soft transition-transform duration-300 ease-smooth group-hover:scale-110">
                          <PlayIcon className="ml-1 h-5 w-5" />
                        </span>
                      </a>

                      {ep.duracao ? (
                        <span className="t-micro numerico absolute bottom-3 right-3 inline-flex items-center gap-1.5 rounded-md bg-ink-deep/85 px-2 py-1 text-zinc-200 backdrop-blur-sm">
                          <ClockIcon className="h-3.5 w-3.5" />
                          {ep.duracao}
                        </span>
                      ) : null}
                    </div>

                    <div className="flex flex-1 flex-col p-6">
                      <h3 className="t-title text-white">
                        <span className="numerico text-primary">{ep.numero}</span>
                        <span aria-hidden className="mx-2 text-ink-line">
                          ·
                        </span>
                        {ep.titulo}
                      </h3>

                      {ep.descricao ? (
                        <p className="t-body-sm mt-2.5 flex-1 text-muted">
                          {ep.descricao}
                        </p>
                      ) : (
                        <div className="flex-1" />
                      )}

                      <div className="mt-6 flex items-center gap-2 border-t border-ink-line pt-5">
                        <a
                          href={link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="toque inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-primary px-3 py-2.5 text-xs font-bold text-ink transition-colors hover:bg-primary-600"
                        >
                          <YoutubeIcon className="h-4 w-4" />
                          YouTube
                        </a>
                        <a
                          href={ep.spotifyUrl ?? socials.spotify}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="toque inline-flex flex-1 items-center justify-center gap-2 rounded-lg border border-ink-line px-3 py-2.5 text-xs font-bold text-zinc-300 transition-colors hover:border-[#1DB954]/50 hover:text-white"
                        >
                          <SpotifyIcon className="h-4 w-4 text-[#1DB954]" />
                          Spotify
                        </a>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>

            <CarrosselControles
              polegarRef={polegarRef}
              pontas={pontas}
              onPrev={() => rolar(-1)}
              onNext={() => rolar(1)}
            />
          </div>
        ) : (
          <div
            role="tabpanel"
            id="painel-cortes"
            aria-labelledby="tab-cortes"
            className="animate-fade-up mt-12"
          >
            <div ref={conectarTrilho} className="swiper-row no-scrollbar">
              {cortes.map((corte) => {
                const capa = corte.youtubeId
                  ? ytCapaVertical(corte.youtubeId)
                  : (corte.thumb ?? '/cortes/placeholder.svg');
                const link = corte.youtubeId
                  ? ytShort(corte.youtubeId)
                  : (corte.link ?? socials.tiktok);

                return (
                  <a
                    key={corte.youtubeId ?? corte.titulo}
                    href={link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="card card-hover swiper-item group relative block w-[172px] overflow-hidden sm:w-[210px]"
                  >
                    <div className="relative aspect-[9/16] overflow-hidden bg-ink-elevated">
                      <Image
                        src={capa}
                        alt={corte.titulo}
                        fill
                        sizes="210px"
                        className="object-cover transition-transform duration-500 ease-smooth group-hover:scale-105"
                      />

                      <span
                        aria-hidden
                        className="absolute inset-0 bg-gradient-to-t from-ink-deep via-ink-deep/25 to-transparent"
                      />

                      <span className="absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-full bg-ink-deep/70 text-white backdrop-blur-sm transition-colors duration-300 group-hover:bg-primary group-hover:text-ink">
                        <PlayIcon className="ml-0.5 h-3 w-3" />
                      </span>

                      {corte.views ? (
                        <span className="t-micro numerico absolute left-3 top-3 rounded-md bg-primary px-2 py-0.5 uppercase text-ink">
                          {corte.views}
                        </span>
                      ) : null}

                      <div className="absolute inset-x-0 bottom-0 p-4">
                        <p className="t-compact line-clamp-3 font-bold text-white">
                          {corte.titulo}
                        </p>
                        <span className="t-micro mt-2.5 inline-flex items-center gap-1.5 text-primary">
                          Ver corte
                          <ArrowRightIcon className="h-3.5 w-3.5" />
                        </span>
                      </div>
                    </div>
                  </a>
                );
              })}
            </div>

            <CarrosselControles
              polegarRef={polegarRef}
              pontas={pontas}
              onPrev={() => rolar(-1)}
              onNext={() => rolar(1)}
            />
          </div>
        )}
      </div>
    </section>
  );
}

type TabButtonProps = {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  id: string;
  controls: string;
  /*
   * Não se chama `ref`: no React 18 `ref` não é prop comum de componente de
   * função — chegaria como `undefined` e o aviso só apareceria no console.
   * O nome muda, o comportamento de ref de callback é o mesmo.
   */
  aoMontar: (no: HTMLButtonElement | null) => void;
};

function TabButton({
  active,
  onClick,
  children,
  id,
  controls,
  aoMontar,
}: TabButtonProps) {
  return (
    <button
      ref={aoMontar}
      type="button"
      role="tab"
      id={id}
      aria-selected={active}
      aria-controls={controls}
      /*
       * Só a aba ativa entra na ordem de tabulação. É o que faz o Tab pular o
       * grupo inteiro de uma vez e deixa as setas cuidarem de escolher dentro
       * dele — o padrão de tablist.
       */
      tabIndex={active ? 0 : -1}
      onClick={onClick}
      className={`toque relative z-10 inline-flex w-full items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm transition-colors duration-200 ease-smooth ${
        active ? 'font-extrabold text-ink' : 'font-semibold text-muted hover:text-white'
      }`}
    >
      {children}
    </button>
  );
}

function CarrosselControles({
  polegarRef,
  pontas,
  onPrev,
  onNext,
}: {
  polegarRef: React.MutableRefObject<HTMLSpanElement | null>;
  pontas: { noInicio: boolean; noFim: boolean };
  onPrev: () => void;
  onNext: () => void;
}) {
  return (
    <div className="mt-6 flex items-center justify-between gap-4">
      {/*
        No celular não há setas, então o trilho é quem diz que existe mais
        conteúdo e onde a faixa está. Substituiu o aviso "arraste para o lado":
        a barra mostra a mesma coisa e ainda responde ao dedo.
      */}
      <div className="trilho-posicao sm:hidden">
        <span ref={polegarRef} />
      </div>

      <div className="ml-auto hidden gap-2 sm:flex">
        <SetaCarrossel
          onClick={onPrev}
          desabilitada={pontas.noInicio}
          rotulo="Conteúdo anterior"
        >
          <ArrowLeftIcon className="h-4 w-4" />
        </SetaCarrossel>
        <SetaCarrossel
          onClick={onNext}
          desabilitada={pontas.noFim}
          rotulo="Próximo conteúdo"
        >
          <ArrowRightIcon className="h-4 w-4" />
        </SetaCarrossel>
      </div>
    </div>
  );
}

function SetaCarrossel({
  onClick,
  desabilitada,
  rotulo,
  children,
}: {
  onClick: () => void;
  desabilitada: boolean;
  rotulo: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={desabilitada}
      aria-label={rotulo}
      className="grid h-11 w-11 place-items-center rounded-xl border border-ink-line bg-ink text-muted transition-all duration-200 ease-smooth enabled:hover:border-primary/50 enabled:hover:text-primary enabled:active:scale-95 disabled:cursor-default disabled:border-ink-line/60 disabled:text-ink-line"
    >
      {children}
    </button>
  );
}
