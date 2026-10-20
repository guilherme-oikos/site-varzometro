import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import AvatarAutor from '@/components/painel/AvatarAutor';
import GraficoEvolucao from '@/components/bolao/GraficoEvolucao';
import TabelaRanking from '@/components/bolao/TabelaRanking';
import { ArrowLeftIcon } from '@/components/Icons';
import { autoresDoRanking, evolucao, posicoes } from '@/lib/bolao';
import { getBolaoPublico, getHistoricoPublico } from '@/lib/bolao-dados';

/**
 * /bolao/temporada/<ano>: o arquivo de um campeonato que já virou — pódio,
 * classificação final e a evolução rodada a rodada. Só leitura: palpite é na
 * temporada atual, em /bolao.
 *
 * A temporada atual não tem arquivo; o endereço dela leva para /bolao.
 */
export default async function PaginaTemporada({ ano }: { ano: number }) {
  const atual = await getBolaoPublico();
  if (!atual || !atual.temporadas.includes(ano)) notFound();
  if (ano === atual.temporada) redirect('/bolao');

  const bolao = await getBolaoPublico(ano);
  if (!bolao) notFound();
  const historico = await getHistoricoPublico(ano);
  const autores = autoresDoRanking(bolao.ranking);
  const grafico = evolucao(bolao.jogos, historico, autores);
  const lugares = posicoes(bolao.ranking);
  const podio = bolao.ranking.filter((_, i) => lugares[i] <= 3 && bolao.ranking[i].pontos > 0);

  return (
    <section className="relative pb-24 pt-28 sm:pt-36">
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-80 bg-fade-primary" />

      <div className="container-page relative">
        <Link href="/bolao" className="toque-linha inline-flex items-center gap-1.5 text-sm font-semibold text-muted hover:text-white">
          <ArrowLeftIcon className="h-4 w-4" />
          Bolão de {atual.temporada}
        </Link>
        <h1 className="t-page mt-4 text-balance text-white">
          Bolão <span className="text-primary">{ano}</span>
        </h1>
        <p className="t-lead medida-apoio mt-4 text-muted">
          Como terminou o bolão da bancada no Brasileirão {ano}.
        </p>

        {podio.length > 0 ? (
          <ol className="mt-10 grid gap-3 sm:grid-cols-3">
            {podio.map((linha) => {
              const lugar = lugares[bolao.ranking.indexOf(linha)];
              return (
                <li
                  key={linha.autor_id}
                  className={`card flex items-center gap-4 p-5 ${lugar === 1 ? 'border-primary/50 bg-primary/[0.06]' : ''}`}
                >
                  <span className={`numerico text-2xl font-extrabold ${lugar === 1 ? 'text-primary' : 'text-zinc-400'}`}>
                    {lugar}º
                  </span>
                  <AvatarAutor
                    autor={{ iniciais: linha.iniciais, foto: linha.foto_blog_url ?? linha.foto_url }}
                    tamanho="h-12 w-12"
                  />
                  <div className="min-w-0">
                    <p className="truncate font-bold text-white">{linha.nome}</p>
                    <p className="numerico text-sm text-muted">
                      {linha.pontos} pontos · {linha.exatos} {linha.exatos === 1 ? 'exato' : 'exatos'}
                    </p>
                  </div>
                </li>
              );
            })}
          </ol>
        ) : null}

        <div className="mt-12 grid gap-12 lg:grid-cols-[minmax(0,24rem)_minmax(0,1fr)] lg:items-start">
          <section aria-labelledby="classificacao">
            <h2 id="classificacao" className="t-title text-white">Classificação final</h2>
            <div className="mt-4">
              <TabelaRanking ranking={bolao.ranking} />
            </div>
          </section>

          {grafico.rodadas.length > 1 ? (
            <section aria-labelledby="evolucao" className="min-w-0">
              <GraficoEvolucao dados={grafico} />
            </section>
          ) : null}
        </div>
      </div>
    </section>
  );
}
