'use client';

import Image from 'next/image';
import { useState, type CSSProperties } from 'react';
import { BallIcon } from '@/components/Icons';
import { clubes, type Integrante } from '@/lib/site';

/**
 * Card da bancada que gira: frente com a foto, verso nas cores do clube.
 *
 * A mecânica 3D veio de um card de biblioteca; a pele é toda do site. O que
 * mudou em relação ao original: fora o gradiente azul/rosa/amarelo, fora o
 * halo branco permanente e fora o pulso neon infinito — aqui a profundidade é
 * borda de 1px sobre grafite, e a cor do clube só aparece no verso.
 *
 * Vira no hover (mouse), no foco (teclado) e no toque (estado). Um card que só
 * virasse no hover seria um verso inalcançável no celular.
 */
export default function CardIntegrante({
  membro,
  temFoto,
}: {
  membro: Integrante;
  temFoto: boolean;
}) {
  const [virado, setVirado] = useState(false);
  const clube = clubes[membro.clube];

  return (
    <div
      className="flip aspect-[3/4] w-full"
      data-virado={virado}
      style={{ '--clube': clube.cor } as CSSProperties}
    >
      <button
        type="button"
        onClick={() => setVirado((v) => !v)}
        aria-pressed={virado}
        aria-label={`${membro.nome}, ${clube.torcedor}. Ver a ficha.`}
        className="flip-inner block cursor-pointer text-left"
      >
        {/* Frente: a foto */}
        <span className="face bg-ink-elevated">
          {temFoto && membro.foto ? (
            <Image
              src={membro.foto}
              alt=""
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 300px"
              className="object-cover"
            />
          ) : (
            <span className="grid h-full w-full place-items-center text-4xl font-extrabold text-primary/70">
              {membro.iniciais}
            </span>
          )}

          <span
            aria-hidden
            className="absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-ink-deep via-ink-deep/70 to-transparent"
          />

          {/* Faixas da camisa: a única cor do clube na frente. */}
          <span aria-hidden className="faixa-clube absolute inset-x-0 top-0 flex h-1.5">
            {clube.faixas.map((faixa, i) => (
              <span key={i} className="h-full flex-1" style={{ backgroundColor: faixa }} />
            ))}
          </span>

          <span className="relative mt-auto p-5">
            <span className="block text-xl font-extrabold leading-none text-white">
              {membro.nome}
            </span>
            <span
              className="t-micro mt-2 block uppercase"
              style={{ color: clube.corTexto }}
            >
              {membro.clube} · {clube.torcedor}
            </span>
          </span>
        </span>

        {/* Verso: as cores do clube */}
        <span className="face face-verso bg-ink-surface">
          <span
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-[0.14]"
            style={{
              background: `radial-gradient(120% 90% at 50% 0%, ${clube.cor} 0%, transparent 70%)`,
            }}
          />

          <span aria-hidden className="faixa-clube relative flex h-1.5 w-full shrink-0">
            {clube.faixas.map((faixa, i) => (
              <span key={i} className="h-full flex-1" style={{ backgroundColor: faixa }} />
            ))}
          </span>

          <span className="relative flex flex-1 flex-col p-5">
            <span className={`tag-clube self-start ${clube.classe}`}>
              {membro.clube}
            </span>

            <span className="mt-4 block text-lg font-extrabold leading-tight text-white">
              {membro.nome}
            </span>
            <span className="t-micro mt-1 block uppercase text-muted">
              {membro.papel}
            </span>

            <span className="t-compact mt-3 block text-muted">
              {membro.bio}
            </span>

            <span className="t-micro mt-auto flex items-center gap-2 border-t border-ink-line pt-4 uppercase text-muted">
              <BallIcon
                aria-hidden
                className="h-3.5 w-3.5 shrink-0"
                style={{ color: clube.corTexto }}
              />
              {membro.funcao}
            </span>
          </span>
        </span>
      </button>
    </div>
  );
}
