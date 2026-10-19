'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * Escudo do time pela rota /escudos (ver o route.ts dela), ou a sigla num
 * círculo quando o football-data não mandou escudo — ou mandou um que não
 * abre. Client só por causa do `onError`.
 */
export default function Escudo({ arquivo, sigla, tamanho = 'h-8 w-8' }: { arquivo: string | null; sigla: string; tamanho?: string }) {
  const [falhou, setFalhou] = useState(false);
  const imagem = useRef<HTMLImageElement>(null);

  // A imagem vem no HTML do servidor: se falhar antes de o React hidratar, o
  // `onError` nunca dispara. Confere na montagem.
  useEffect(() => {
    const no = imagem.current;
    if (no?.complete && no.naturalWidth === 0) setFalhou(true);
  }, []);

  return arquivo && !falhou ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      ref={imagem}
      src={`/escudos/${arquivo}`}
      alt=""
      loading="lazy"
      onError={() => setFalhou(true)}
      className={`${tamanho} shrink-0 object-contain`}
    />
  ) : (
    <span
      aria-hidden
      className={`${tamanho} grid shrink-0 place-items-center rounded-full border border-ink-line bg-ink-elevated text-[0.5625rem] font-extrabold text-zinc-300`}
    >
      {sigla.slice(0, 3).toUpperCase()}
    </span>
  );
}
