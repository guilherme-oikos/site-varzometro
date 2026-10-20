'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useTransition } from 'react';
import { EsqueletoDosDois } from '@/components/bolao/EsqueletoJogos';
import { ArrowLeftIcon, ArrowRightIcon } from '@/components/Icons';

/**
 * Anterior / próxima entre as rodadas que têm jogo no bolão, com os jogos da
 * rodada em `children`. `prefixo` + número monta o endereço (/bolao/rodada/);
 * é texto e não função porque função não atravessa a fronteira server → client.
 *
 * Client para o esqueleto entrar no lugar dos jogos no mesmo instante do
 * clique: com internet lenta, a lista velha ficava parada na tela até o
 * servidor responder, parecendo que a seta não pegou. O número da rodada já
 * muda no clique pelo mesmo motivo. Continua sendo `<Link>`, então abrir em
 * outra aba e o prefetch seguem funcionando.
 */
export default function SeletorRodada({
  rodadas,
  atual,
  prefixo,
  quantidade,
  children,
}: {
  rodadas: number[];
  atual: number;
  prefixo: string;
  /** Quantos cards o esqueleto desenha — os jogos da rodada que está na tela. */
  quantidade: number;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [carregando, iniciar] = useTransition();
  const [pedida, setPedida] = useState<number | null>(null);

  // A rodada nova chegou (ou a URL mudou por fora, no voltar do navegador).
  useEffect(() => setPedida(null), [atual]);

  const exibida = pedida ?? atual;
  const indice = rodadas.indexOf(exibida);
  const anterior = indice > 0 ? rodadas[indice - 1] : null;
  const proxima = indice >= 0 && indice < rodadas.length - 1 ? rodadas[indice + 1] : null;

  const ir = (evento: React.MouseEvent<HTMLAnchorElement>, rodada: number) => {
    // Ctrl/Cmd/Shift/botão do meio: deixa o navegador abrir outra aba.
    if (evento.button !== 0 || evento.metaKey || evento.ctrlKey || evento.shiftKey || evento.altKey) return;
    evento.preventDefault();
    setPedida(rodada);
    iniciar(() => router.push(`${prefixo}${rodada}`, { scroll: false }));
  };

  const seta = 'btn-ghost toque !px-3 !py-2';

  const botao = (rodada: number | null, Icone: typeof ArrowLeftIcon) =>
    rodada !== null ? (
      <Link href={`${prefixo}${rodada}`} onClick={(e) => ir(e, rodada)} className={seta} aria-label={`Rodada ${rodada}`}>
        <Icone className="h-4 w-4" />
      </Link>
    ) : (
      <span className={`${seta} pointer-events-none opacity-30`} aria-hidden>
        <Icone className="h-4 w-4" />
      </span>
    );

  return (
    <>
      <nav aria-label="Rodadas" className="flex items-center justify-between gap-3">
        {botao(anterior, ArrowLeftIcon)}
        <p className="t-title numerico text-white">Rodada {exibida}</p>
        {botao(proxima, ArrowRightIcon)}
      </nav>

      <div className="mt-5" aria-busy={carregando}>
        {/* Logado e visitante têm cards diferentes: cada um vê o esqueleto do seu. */}
        {carregando ? <EsqueletoDosDois quantidade={quantidade} /> : children}
      </div>
    </>
  );
}
