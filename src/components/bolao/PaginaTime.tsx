import Link from 'next/link';
import { notFound } from 'next/navigation';
import AvatarAutor from '@/components/painel/AvatarAutor';
import CardJogo from '@/components/bolao/CardJogo';
import Escudo from '@/components/bolao/Escudo';
import FiltroTimes from '@/components/bolao/FiltroTimes';
import LembretePalpite from '@/components/bolao/LembretePalpite';
import PalpitesDoLogado from '@/components/bolao/PalpitesDoLogado';
import RegrasBolao from '@/components/bolao/RegrasBolao';
import { ArrowLeftIcon } from '@/components/Icons';
import { autoresDoRanking, rankingNoTime, timesDoBolao } from '@/lib/bolao';
import { getTimePublico } from '@/lib/bolao-dados';

/**
 * Corpo de /bolao/time/<slug>: todos os jogos de um time no bolão, de todas as
 * rodadas, e quem mais acerta os jogos dele. Estática como o resto do bolão;
 * quem está logado palpita aqui também (`PalpitesDoLogado`).
 */
export default async function PaginaTime({ slug }: { slug: string }) {
  const dadosDoTime = await getTimePublico(slug);
  if (!dadosDoTime) notFound();

  const { bolao, time, jogos, dados } = dadosDoTime;
  const autores = autoresDoRanking(bolao.ranking);
  const encerrados = jogos.filter((jogo) => jogo.status === 'encerrado').length;
  const ranking = rankingNoTime(jogos, dados.palpites, autores);
  const agora = Date.now();

  return (
    <section className="relative pb-24 pt-28 sm:pt-36">
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-80 bg-fade-primary" />

      <div className="container-page relative">
        <Link href="/bolao" className="toque-linha inline-flex items-center gap-1.5 text-sm font-semibold text-muted hover:text-white">
          <ArrowLeftIcon className="h-4 w-4" />
          Bolão da bancada
        </Link>

        <div className="mt-4 flex items-center gap-4">
          <Escudo arquivo={time.escudo} sigla={time.sigla || time.nome} tamanho="h-12 w-12 sm:h-14 sm:w-14" />
          <h1 className="t-page text-balance text-white">{time.nome}</h1>
        </div>
        <p className="t-lead medida-apoio mt-4 text-muted">
          Todos os jogos do {time.nome} no bolão, com o palpite da bancada em cada um.
        </p>

        <LembretePalpite />

        <div className="mt-10">
          <FiltroTimes times={timesDoBolao(bolao.jogos)} atual={time.slug} />
        </div>

        <div className="mt-8 grid gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,24rem)] lg:items-start">
          <div className="min-w-0">
            <p className="numerico text-sm text-muted">
              {jogos.length} {jogos.length === 1 ? 'jogo' : 'jogos'} no bolão · {encerrados}{' '}
              {encerrados === 1 ? 'encerrado' : 'encerrados'}
            </p>
            <div className="mt-4">
              <PalpitesDoLogado time={time.slug} autores={autores} mostrarRodada quantidade={jogos.length}>
                <ul className="space-y-3">
                  {jogos.map((jogo) => (
                    <li key={jogo.id}>
                      <CardJogo
                        jogo={jogo}
                        autores={autores}
                        palpites={dados.palpites.filter((p) => p.jogo_id === jogo.id)}
                        quemPalpitou={dados.quemPalpitou.filter((q) => q.jogo_id === jogo.id).map((q) => q.autor_id)}
                        agora={agora}
                        mostrarRodada
                      />
                    </li>
                  ))}
                </ul>
              </PalpitesDoLogado>
            </div>
            {/* "Como pontua" no celular: depois dos jogos, para não empurrá-los com o ranking. */}
            <RegrasBolao className="mt-8 lg:hidden" />
          </div>

          {/* No celular o ranking vem antes dos jogos; do `lg` para cima volta para a lateral. */}
          <aside className="order-first lg:sticky lg:top-28 lg:order-none">
            <h2 className="t-title text-white">Quem mais acerta o {time.nome}</h2>
            {encerrados === 0 ? (
              <p className="card mt-4 p-5 text-sm text-muted">
                Ainda não teve jogo do {time.nome} encerrado. Aqui aparece quem manja e quem só chuta.
              </p>
            ) : (
              <ol className="card mt-4 divide-y divide-ink-line">
                {ranking.map((linha, i) => (
                  <li key={linha.autor.id} className="flex items-center gap-3 px-4 py-3 sm:px-5">
                    <span className={`numerico w-6 font-extrabold ${i === 0 && linha.pontos > 0 ? 'text-primary' : 'text-zinc-400'}`}>
                      {i + 1}º
                    </span>
                    <AvatarAutor autor={linha.autor} tamanho="h-8 w-8" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-bold text-white">{linha.autor.nome}</p>
                      <p className="numerico text-xs text-muted">
                        acertou {linha.acertos} de {linha.jogos} {linha.jogos === 1 ? 'resultado' : 'resultados'}
                      </p>
                    </div>
                    <span className="numerico text-lg font-extrabold text-white">{linha.pontos}</span>
                  </li>
                ))}
              </ol>
            )}
            <RegrasBolao className="mt-6 hidden lg:block" />
          </aside>
        </div>
      </div>
    </section>
  );
}
