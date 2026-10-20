'use client';

import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import EsqueletoJogos from '@/components/bolao/EsqueletoJogos';
import type { AutorDoBolao } from '@/lib/bolao';
import type { MeuBolao } from '@/lib/bolao-logado';
import { temCookieDeSessao } from '@/lib/usuario';

// Só quem está logado baixa o formulário: o visitante fica com os cards de `children`.
const carregarFormulario = () => import('@/components/painel/FormPalpites');
// Enquanto o código do formulário baixa, o mesmo esqueleto de logado — sem buraco na tela.
const FormPalpites = dynamic(carregarFormulario, {
  loading: () => <EsqueletoJogos variante="logado" quantidade={3} />,
});
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
 *
 * Enquanto a resposta não vem, quem tem o cookie vê o esqueleto, e não os
 * cards de visitante: as duas versões têm visual diferente, e mostrar uma e
 * trocar pela outra dava uma piscada. A escolha é por CSS (`so-visitante` /
 * `so-logado`, ver globals.css), porque o HTML do servidor aparece antes de o
 * React rodar — só o script do <head> chega a tempo.
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
  quantidade,
  children,
}: {
  /** Uma rodada (/bolao) ou um time (/bolao/time/<slug>). */
  rodada?: number;
  time?: string;
  autores: AutorDoBolao[];
  /** Na lista de um time os jogos são de várias rodadas: cada card diz a sua. */
  mostrarRodada?: boolean;
  /** Quantos cards o esqueleto desenha enquanto carrega. */
  quantidade: number;
  children: React.ReactNode;
}) {
  const filtro = time ? `time=${encodeURIComponent(time)}` : `rodada=${rodada ?? 0}`;
  const router = useRouter();
  const [meu, setMeu] = useState<MeuBolao | null>(null);
  // 'esperando' até saber: com cookie, vira 'logado' (formulário) ou, se a
  // sessão venceu, 'publico'; sem cookie, 'publico' na hora.
  const [estado, setEstado] = useState<'esperando' | 'logado' | 'publico'>('esperando');

  useEffect(() => {
    if (!temCookieDeSessao()) {
      // Saiu do login sem recarregar: a marca do <head> ficou para trás.
      delete document.documentElement.dataset.sessao;
      setEstado('publico');
      return;
    }
    // Trocou de rodada no meio (ou o modo estrito do dev montou duas vezes): cancela a anterior.
    const controle = new AbortController();
    const ler = async () => {
      const resposta = await fetch(`/api/bolao/meu?${filtro}`, { signal: controle.signal, cache: 'no-store' });
      return resposta.ok ? ((await resposta.json()) as MeuBolao) : null;
    };

    // O código do formulário baixa junto com os dados, não depois deles.
    carregarFormulario().catch(() => {});
    ler()
      .then(async (dados) => {
        setMeu(dados);
        setEstado(dados ? 'logado' : 'publico');
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
        if (!controle.signal.aborted) setEstado('publico');
      });

    return () => controle.abort();
  }, [filtro, router]);

  if (estado === 'publico' || (estado === 'logado' && !meu)) return <>{children}</>;

  if (estado === 'esperando' || !meu) {
    return (
      <>
        <div className="so-visitante">{children}</div>
        <div className="so-logado">
          <EsqueletoJogos quantidade={quantidade} variante="logado" />
        </div>
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
