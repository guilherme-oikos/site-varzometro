import Link from 'next/link';
import { notFound } from 'next/navigation';
import AvatarAutor from '@/components/painel/AvatarAutor';
import Escudo from '@/components/bolao/Escudo';
import SeloPontos from '@/components/bolao/SeloPontos';
import { ArrowLeftIcon, ArrowRightIcon } from '@/components/Icons';
import { autoresDoRanking, palpiteiro, paraSlug, posicoes, quandoE, slugDoDuelo, type TimeDoPalpiteiro } from '@/lib/bolao';
import { getBolaoPublico, getHistoricoPublico } from '@/lib/bolao-dados';
import { seloDoArtigo, siglaDeClube } from '@/lib/site';

/**
 * Corpo de /bolao/palpiteiro/<slug>: um da bancada sozinho. Números do
 * ranking, melhor e pior rodada, o time que mais acerta e a freguesia, e todo
 * o histórico de palpites dos jogos encerrados — que todo mundo já pode ver.
 * Estática como o resto do bolão.
 */
export default async function PaginaPalpiteiro({ slug }: { slug: string }) {
  const bolao = await getBolaoPublico();
  if (!bolao) notFound();
  const autores = autoresDoRanking(bolao.ranking);
  const autor = autores.find((a) => paraSlug(a.nome) === slug);
  if (!autor) notFound();

  const historico = await getHistoricoPublico();
  const indice = bolao.ranking.findIndex((linha) => linha.autor_id === autor.id);
  const linha = bolao.ranking[indice];
  const lugar = posicoes(bolao.ranking)[indice];
  const selo = seloDoArtigo(siglaDeClube(linha.clube));
  const dados = palpiteiro(bolao.jogos, historico, autor.id);
  const aproveitamento = linha.jogos_pontuados > 0 ? Math.round((linha.resultados / linha.jogos_pontuados) * 100) : null;

  const numeros = [
    { rotulo: 'Pontos', valor: String(linha.pontos) },
    { rotulo: 'No ranking', valor: `${lugar}º` },
    { rotulo: 'Placares exatos', valor: String(linha.exatos) },
    { rotulo: 'Acertou o resultado', valor: aproveitamento === null ? '—' : `${aproveitamento}%` },
  ];

  const sobreTime = (t: TimeDoPalpiteiro, conta: 'acertos' | 'erros') =>
    `${conta === 'acertos' ? 'Acertou' : 'Errou'} ${t[conta]} de ${t.jogos} jogos`;

  const destaques = [
    dados.melhor && {
      rotulo: 'Melhor rodada',
      valor: `Rodada ${dados.melhor.rodada}`,
      detalhe: `${dados.melhor.pontos} ${dados.melhor.pontos === 1 ? 'ponto' : 'pontos'}`,
      href: `/bolao/rodada/${dados.melhor.rodada}`,
      quente: true,
    },
    dados.pior && {
      rotulo: 'Pior rodada',
      valor: `Rodada ${dados.pior.rodada}`,
      detalhe: `${dados.pior.pontos} ${dados.pior.pontos === 1 ? 'ponto' : 'pontos'}`,
      href: `/bolao/rodada/${dados.pior.rodada}`,
      quente: false,
    },
    dados.manja && {
      rotulo: 'Onde manja',
      valor: dados.manja.time,
      detalhe: sobreTime(dados.manja, 'acertos'),
      href: `/bolao/time/${paraSlug(dados.manja.time)}`,
      quente: true,
    },
    dados.freguesia && {
      rotulo: 'Freguesia',
      valor: dados.freguesia.time,
      detalhe: sobreTime(dados.freguesia, 'erros'),
      href: `/bolao/time/${paraSlug(dados.freguesia.time)}`,
      quente: false,
    },
  ].filter((d): d is NonNullable<typeof d> => Boolean(d));

  return (
    <section className="relative pb-24 pt-28 sm:pt-36">
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-80 bg-fade-primary" />

      <div className="container-page relative">
        <Link href="/bolao" className="toque-linha inline-flex items-center gap-1.5 text-sm font-semibold text-muted hover:text-white">
          <ArrowLeftIcon className="h-4 w-4" />
          Bolão da bancada
        </Link>

        {/* Os outros da bancada, para pular de um para o outro. */}
        <nav aria-label="Palpiteiros" className="mt-6 flex flex-wrap gap-2">
          {autores.map((a) => {
            const atual = a.id === autor.id;
            return (
              <Link
                key={a.id}
                href={`/bolao/palpiteiro/${paraSlug(a.nome)}`}
                aria-current={atual ? 'page' : undefined}
                className={`inline-flex items-center gap-2 rounded-full border py-1 pl-1 pr-3 text-sm font-semibold transition-colors ${
                  atual ? 'border-primary/60 bg-primary/10 text-white' : 'border-ink-line text-muted hover:text-white'
                }`}
              >
                <AvatarAutor autor={a} tamanho="h-6 w-6" />
                {a.nome}
              </Link>
            );
          })}
        </nav>

        <div className="mt-8 flex items-center gap-4">
          <AvatarAutor autor={autor} tamanho="h-16 w-16 sm:h-20 sm:w-20" />
          <div className="min-w-0">
            <p className="t-label text-primary">Brasileirão {bolao.temporada}</p>
            <h1 className="t-page mt-1 text-balance text-white">{autor.nome}</h1>
            <span className={`tag-clube ${selo.classe} mt-2`}>{selo.sigla}</span>
          </div>
        </div>

        <dl className="mt-10 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {numeros.map((n) => (
            <div key={n.rotulo} className="card p-4 sm:p-5">
              <dt className="text-xs text-muted">{n.rotulo}</dt>
              <dd className="numerico mt-1 text-2xl font-extrabold text-white sm:text-3xl">{n.valor}</dd>
            </div>
          ))}
        </dl>

        {destaques.length > 0 ? (
          <ul className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {destaques.map((d) => (
              <li key={d.rotulo}>
                <Link href={d.href} className="card card-hover group flex h-full flex-col p-4 sm:p-5">
                  <span className={`t-label ${d.quente ? 'text-primary' : 'text-zinc-400'}`}>{d.rotulo}</span>
                  <span className="mt-2 font-bold text-white">{d.valor}</span>
                  <span className="numerico mt-0.5 text-sm text-muted">{d.detalhe}</span>
                </Link>
              </li>
            ))}
          </ul>
        ) : null}

        <div className="mt-14 grid gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,20rem)] lg:items-start">
          <section aria-labelledby="historico" className="min-w-0">
            <h2 id="historico" className="t-title text-white">Histórico de palpites</h2>
            {dados.historico.length === 0 ? (
              <p className="card mt-4 p-5 text-sm text-muted">
                Nenhum jogo com palpite de {autor.nome} terminou ainda. O histórico aparece aqui no primeiro apito final.
              </p>
            ) : (
              <ul className="card mt-4 divide-y divide-ink-line">
                {dados.historico.map(({ jogo, palpite }) => (
                  <li key={jogo.id} className="px-4 py-3 sm:px-5">
                    <p className="numerico text-xs capitalize text-muted">
                      <span className="text-zinc-300">Rodada {jogo.rodada} · </span>
                      {quandoE(jogo.inicio)}
                    </p>
                    <div className="mt-2 flex items-center gap-3">
                      <div className="flex min-w-0 flex-1 items-center gap-2 text-sm">
                        <Escudo arquivo={jogo.mandante_escudo} sigla={jogo.mandante_sigla || jogo.mandante} tamanho="h-5 w-5" />
                        {/* No celular, a sigla: o nome inteiro dos dois times não cabe ao lado do palpite. */}
<span className="hidden truncate font-semibold text-white sm:inline">{jogo.mandante}</span>
                        <span className="font-semibold text-white sm:hidden">{jogo.mandante_sigla || jogo.mandante.slice(0, 3)}</span>
                        <span className="numerico shrink-0 font-extrabold text-white">
                          {jogo.gols_mandante} x {jogo.gols_visitante}
                        </span>
                        <span className="hidden truncate font-semibold text-white sm:inline">{jogo.visitante}</span>
                        <span className="font-semibold text-white sm:hidden">{jogo.visitante_sigla || jogo.visitante.slice(0, 3)}</span>
                        <Escudo arquivo={jogo.visitante_escudo} sigla={jogo.visitante_sigla || jogo.visitante} tamanho="h-5 w-5" />
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        {palpite.dobrado ? (
                          <span
                            title="Dobro de pontos: este palpite vale o dobro"
                            className="t-micro numerico rounded-md bg-primary/15 px-1.5 py-0.5 font-bold text-primary"
                          >
                            2x
                          </span>
                        ) : null}
                        <span className="numerico text-sm text-zinc-300">
                          <span className="text-xs text-muted">palpite </span>
                          {palpite.gols_mandante} x {palpite.gols_visitante}
                        </span>
                        <SeloPontos pontos={palpite.pontos} base={palpite.pontos_base} />
                      </div>
                    </div>
                    {palpite.resenha ? <p className="mt-1.5 text-xs italic text-muted">“{palpite.resenha}”</p> : null}
                  </li>
                ))}
              </ul>
            )}
          </section>

          <aside className="lg:sticky lg:top-28">
            <h2 className="t-title text-white">Duelos de {autor.nome}</h2>
            <ul className="mt-4 space-y-2">
              {autores
                .filter((a) => a.id !== autor.id)
                .map((a) => (
                  <li key={a.id}>
                    <Link
                      href={`/bolao/duelo/${slugDoDuelo(autor, a, autores)}`}
                      className="card card-hover group flex items-center gap-3 p-3"
                    >
                      <AvatarAutor autor={a} tamanho="h-8 w-8" />
                      <span className="min-w-0 flex-1 truncate text-sm font-semibold text-white">
                        {autor.nome} x {a.nome}
                      </span>
                      <ArrowRightIcon className="h-4 w-4 shrink-0 text-primary transition-transform group-hover:translate-x-0.5" />
                    </Link>
                  </li>
                ))}
            </ul>
          </aside>
        </div>
      </div>
    </section>
  );
}
