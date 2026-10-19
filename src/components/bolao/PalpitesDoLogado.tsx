'use client';

import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import type { AutorDoBolao } from '@/lib/bolao';
import type { MeuBolao } from '@/lib/bolao-logado';
import { temCookieDeSessao } from '@/lib/usuario';

// Só quem está logado baixa o formulário: o visitante fica com os cards de `children`.
const FormPalpites = dynamic(() => import('@/components/painel/FormPalpites'));
const BotaoAtualizarJogos = dynamic(() => import('@/components/painel/BotaoAtualizarJogos'));

const dataHora = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  timeZone: 'America/Sao_Paulo',
});

/**
 * Os jogos da rodada em /bolao. Para o visitante, é só `children` — os cards
 * que o servidor já montou, iguais para todo mundo.
 *
 * Com o cookie de sessão, pede os dados da pessoa a `/api/bolao/meu` e troca
 * os cards pelo formulário de palpite. Assim a página segue estática e sem
 * ler cookie no servidor, e não existe uma segunda página só para palpitar.
 * Enquanto a resposta não vem, os cards públicos ficam na tela.
 *
 * Se a última busca de placar já passou do intervalo, chama
 * `/api/bolao/atualizar` depois, sem ninguém esperar por ela; trouxe placar
 * novo, a página se refaz. Detalhes em `src/lib/bolao-logado.ts`.
 *
 * O admin ganha aqui o "Atualizar jogos agora" e a correção de cada jogo.
 */
export default function PalpitesDoLogado({
  rodada,
  time,
  autores,
  mostrarRodada = false,
  children,
}: {
  /** Uma rodada (/bolao) ou um time (/bolao/time/<slug>). */
  rodada?: number;
  time?: string;
  autores: AutorDoBolao[];
  /** Na lista de um time os jogos são de várias rodadas: cada card diz a sua. */
  mostrarRodada?: boolean;
  children: React.ReactNode;
}) {
  const filtro = time ? `time=${encodeURIComponent(time)}` : `rodada=${rodada ?? 0}`;
  const router = useRouter();
  const [meu, setMeu] = useState<MeuBolao | null>(null);
  const [carregando, setCarregando] = useState(false);

  useEffect(() => {
    if (!temCookieDeSessao()) return;
    // Trocou de rodada no meio (ou o modo estrito do dev montou duas vezes): cancela a anterior.
    const controle = new AbortController();
    const ler = async () => {
      const resposta = await fetch(`/api/bolao/meu?${filtro}`, { signal: controle.signal, cache: 'no-store' });
      return resposta.ok ? ((await resposta.json()) as MeuBolao) : null;
    };

    setCarregando(true);
    ler()
      .then(async (dados) => {
        setMeu(dados);
        setCarregando(false);
        if (!dados?.atrasado) return;
        const resposta = await fetch('/api/bolao/atualizar', { method: 'POST', signal: controle.signal });
        const resultado = resposta.ok ? ((await resposta.json()) as { sincronizou: boolean } | null) : null;
        if (!resultado?.sincronizou) return;
        // Placar novo: a parte pública (ranking, campeão, gráfico) e o formulário.
        router.refresh();
        setMeu(await ler());
      })
      // Sem rede, sessão vencida ou cancelado: fica a versão pública, que já está na tela.
      .catch(() => {
        if (!controle.signal.aborted) setCarregando(false);
      });

    return () => controle.abort();
  }, [filtro, router]);

  if (!meu) {
    return (
      <>
        {carregando ? (
          <p role="status" className="mb-3 text-xs text-muted motion-safe:animate-pulse">
            Carregando seus palpites...
          </p>
        ) : null}
        {children}
      </>
    );
  }

  return (
    <>
      {meu.admin ? (
        <div className="card mb-5 flex flex-wrap items-center justify-between gap-4 p-4 sm:p-5">
          <p className="text-sm text-muted">
            {meu.sincronizadoEm
              ? `Jogos buscados no football-data em ${dataHora.format(new Date(meu.sincronizadoEm))}.`
              : 'Os jogos ainda não foram buscados no football-data.'}
          </p>
          <BotaoAtualizarJogos />
        </div>
      ) : null}
      {/* Sem jogo (bolão vazio, antes da primeira busca): fica o aviso público, e o admin tem o botão acima. */}
      {meu.jogos.length === 0 ? (
        children
      ) : (
        // `key`: trocar de rodada recomeça o formulário em vez de herdar o rascunho da anterior.
        <FormPalpites
          key={filtro}
          mostrarRodada={mostrarRodada}
          jogos={meu.jogos}
          palpites={meu.palpites}
          quemPalpitou={meu.quemPalpitou}
          autores={autores}
          meuId={meu.meuId}
          admin={meu.admin}
          agora={meu.agora}
        />
      )}
    </>
  );
}
