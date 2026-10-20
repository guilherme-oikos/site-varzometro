import Link from 'next/link';
import { notFound } from 'next/navigation';
import CampeaoRodada from '@/components/bolao/CampeaoRodada';
import { ArrowRightIcon } from '@/components/Icons';
import CardJogo from '@/components/bolao/CardJogo';
import FiltroTimes from '@/components/bolao/FiltroTimes';
import LembretePalpite from '@/components/bolao/LembretePalpite';
import GraficoEvolucao from '@/components/bolao/GraficoEvolucao';
import PalpitesDoLogado from '@/components/bolao/PalpitesDoLogado';
import ProprioTime from '@/components/bolao/ProprioTime';
import RegrasBolao from '@/components/bolao/RegrasBolao';
import SeletorRodada from '@/components/bolao/SeletorRodada';
import TabelaRanking from '@/components/bolao/TabelaRanking';
import {
  autoresDoRanking,
  desempenhoNoProprioTime,
  evolucao,
  placarDaRodada,
  rodadaAtual,
  timesDoBolao,
} from '@/lib/bolao';
import { getBolaoPublico, getHistoricoPublico, getRodadaPublica } from '@/lib/bolao-dados';
import { siglaDeClube } from '@/lib/site';

/**
 * Corpo de /bolao e /bolao/rodada/N. Página estática, sem cookie: lê com o
 * cliente anônimo, então só aparece palpite de jogo que já começou.
 */
export default async function PaginaBolao({ rodada }: { rodada?: number }) {
  const bolao = await getBolaoPublico();
  const rodadas = bolao ? Array.from(new Set(bolao.jogos.map((jogo) => jogo.rodada))).sort((a, b) => a - b) : [];
  const escolhida = rodada ?? (bolao ? rodadaAtual(bolao.jogos) : null);

  if (rodada !== undefined && !rodadas.includes(rodada)) notFound();

  const dados = escolhida !== null ? await getRodadaPublica(escolhida) : null;
  const jogos = bolao?.jogos.filter((jogo) => jogo.rodada === escolhida) ?? [];
  const autores = bolao ? autoresDoRanking(bolao.ranking) : [];
  const agora = Date.now();

  const historico = bolao ? await getHistoricoPublico() : [];
  const placar = placarDaRodada(jogos, dados?.palpites ?? [], autores);
  const grafico = bolao ? evolucao(bolao.jogos, historico, autores) : null;
  const clubeDe = new Map(bolao?.ranking.map((linha) => [linha.autor_id, siglaDeClube(linha.clube)]) ?? []);
  const noTime = bolao
    ? desempenhoNoProprioTime(
        bolao.jogos,
        historico,
        autores.map((autor) => ({ ...autor, clube: clubeDe.get(autor.id) })),
      )
    : [];

  return (
    <section className="relative pb-24 pt-28 sm:pt-36">
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-80 bg-fade-primary" />

      <div className="container-page relative">
        {bolao ? <p className="t-label mt-4 text-primary">Brasileirão {bolao.temporada}</p> : null}
        <h1 className={`t-page max-w-3xl text-balance text-white ${bolao ? 'mt-2' : 'mt-4'}`}>
          Bolão da <span className="text-primary">bancada</span>
        </h1>
        <p className="t-lead medida-apoio mt-5 text-muted">
          A bancada crava o placar de cada jogo do Brasileirão. Aqui dá para ver quem está mandando bem
          e quem só fala bonito no microfone.
        </p>
        {/* Campeonatos que já viraram: cada um tem o seu arquivo, com o ranking final. */}
        {bolao && bolao.temporadas.length > 1 ? (
          <p className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted">
            Temporadas anteriores:
            {bolao.temporadas
              .filter((ano) => ano !== bolao.temporada)
              .map((ano) => (
                <Link key={ano} href={`/bolao/temporada/${ano}`} className="toque-linha font-semibold text-primary hover:underline">
                  {ano}
                </Link>
              ))}
          </p>
        ) : null}

        {!bolao || rodadas.length === 0 ? (
          <div className="mt-12">
            <PalpitesDoLogado rodada={0} autores={autores} quantidade={1}>
              <p className="card p-6 text-sm text-muted">
                O bolão ainda não começou. Os jogos aparecem aqui assim que a próxima rodada for carregada.
              </p>
            </PalpitesDoLogado>
          </div>
        ) : (
          <>
          <LembretePalpite />
          <div className="mt-10">
            <FiltroTimes times={timesDoBolao(bolao.jogos)} />
          </div>
          <div className="mt-8 grid gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,24rem)] lg:items-start">
            <div>
              <SeletorRodada
                rodadas={rodadas}
                atual={escolhida!}
                prefixo="/bolao/rodada/"
                quantidade={jogos.length}
              >
                <CampeaoRodada placar={placar} />
                <PalpitesDoLogado key={escolhida} rodada={escolhida!} autores={autores} quantidade={jogos.length}>
                  <ul className="space-y-3">
                    {jogos.map((jogo) => (
                      <li key={jogo.id}>
                        <CardJogo
                          jogo={jogo}
                          autores={autores}
                          palpites={dados?.palpites.filter((p) => p.jogo_id === jogo.id) ?? []}
                          quemPalpitou={dados?.quemPalpitou.filter((q) => q.jogo_id === jogo.id).map((q) => q.autor_id) ?? []}
                          agora={agora}
                        />
                      </li>
                    ))}
                  </ul>
                </PalpitesDoLogado>
              </SeletorRodada>
              {/* "Como pontua" no celular: depois dos jogos, para não empurrá-los com o ranking. */}
              <RegrasBolao className="mt-8 lg:hidden" />
            </div>

            {/* No celular o ranking vem antes dos jogos; do `lg` para cima volta para a lateral. */}
            <aside className="order-first lg:sticky lg:top-28 lg:order-none">
              <h2 className="t-title text-white">Ranking</h2>
              <div className="mt-4">
                <TabelaRanking ranking={bolao.ranking} />
              </div>
              <Link
                href="/bolao/duelo"
                className="toque-linha mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
              >
                Duelo: um contra um da bancada
                <ArrowRightIcon className="h-4 w-4" />
              </Link>
              <RegrasBolao className="mt-6 hidden lg:block" />
            </aside>
          </div>
          </>
        )}

        {grafico && grafico.rodadas.length > 0 ? (
          <div className="mt-16 grid min-w-0 gap-12">
            <section aria-labelledby="evolucao" className="min-w-0">
              {grafico.rodadas.length > 1 ? (
                <GraficoEvolucao dados={grafico} />
              ) : (
                <div className="card p-5 sm:p-6">
                  <h2 id="evolucao" className="font-semibold leading-none tracking-tight text-white">
                    Evolução do bolão
                  </h2>
                  <p className="mt-2 text-sm text-muted">O gráfico aparece quando a segunda rodada tiver jogo encerrado.</p>
                </div>
              )}
            </section>

            <section aria-labelledby="proprio-time">
              <h2 id="proprio-time" className="t-title text-white">Quem entende do próprio time</h2>
              <p className="mt-1 text-sm text-muted">
                Palpitando no próprio clube, o torcedor acerta mais ou deixa o coração falar? Acerto é cravar o
                vencedor ou o empate.
              </p>
              <div className="mt-4">
                <ProprioTime linhas={noTime} />
              </div>
            </section>
          </div>
        ) : null}
      </div>
    </section>
  );
}
