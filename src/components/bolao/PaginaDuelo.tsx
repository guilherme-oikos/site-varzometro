import Link from 'next/link';
import { notFound, permanentRedirect } from 'next/navigation';
import DueloDaBancada from '@/components/bolao/DueloDaBancada';
import { ArrowLeftIcon } from '@/components/Icons';
import { autoresDoRanking, paraSlug, slugDoDuelo } from '@/lib/bolao';
import { getBolaoPublico, getHistoricoPublico } from '@/lib/bolao-dados';
import { siglaDeClube } from '@/lib/site';

/**
 * /bolao/duelo e /bolao/duelo/<a>-x-<b>: a mesma página, com o seletor da
 * dupla em cima (`DueloDaBancada`). Sem dupla no endereço, abre no líder
 * contra o vice do ranking — o duelo do momento. Estáticas como o resto do
 * bolão, com os palpites dos jogos encerrados, que todo mundo já pode ver.
 *
 * O endereço segue a ordem da bancada ("gj-x-marti"); a ordem invertida
 * redireciona, para o mesmo duelo não ter dois endereços.
 */
export default async function PaginaDuelo({ dupla }: { dupla?: string }) {
  const bolao = await getBolaoPublico();
  if (!bolao) notFound();
  const historico = await getHistoricoPublico();
  const autores = autoresDoRanking(bolao.ranking);
  const clubeDe = new Map(bolao.ranking.map((linha) => [linha.autor_id, siglaDeClube(linha.clube)]));

  let inicial: [string, string] | null = null;
  if (dupla) {
    const [slugA, slugB] = dupla.split('-x-');
    const a = autores.find((autor) => paraSlug(autor.nome) === slugA);
    const b = autores.find((autor) => paraSlug(autor.nome) === slugB);
    if (!a || !b || a === b) notFound();
    const canonico = slugDoDuelo(a, b, autores);
    if (canonico !== dupla) permanentRedirect(`/bolao/duelo/${canonico}`);
    inicial = [a.id, b.id];
  } else if (bolao.ranking.length >= 2) {
    // Na ordem da bancada, como o endereço.
    const [x, y] = [bolao.ranking[0].autor_id, bolao.ranking[1].autor_id];
    const ordem = (id: string) => autores.findIndex((autor) => autor.id === id);
    inicial = ordem(x) <= ordem(y) ? [x, y] : [y, x];
  }

  return (
    <section className="relative pb-24 pt-28 sm:pt-36">
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-80 bg-fade-primary" />
      <div className="container-page relative">
        <Link href="/bolao" className="toque-linha inline-flex items-center gap-1.5 text-sm font-semibold text-muted hover:text-white">
          <ArrowLeftIcon className="h-4 w-4" />
          Bolão da bancada
        </Link>
        <h1 className="t-page mt-4 text-balance text-white">
          Duelo da <span className="text-primary">bancada</span>
        </h1>
        <p className="t-lead medida-apoio mt-4 text-muted">
          Um contra um: em cada jogo encerrado, quem fez mais pontos leva.
        </p>

        {inicial ? (
          <DueloDaBancada
            autores={autores.map((autor) => ({ ...autor, clube: clubeDe.get(autor.id) }))}
            jogos={bolao.jogos.filter((jogo) => jogo.status === 'encerrado')}
            palpites={historico}
            inicial={inicial}
          />
        ) : (
          <p className="card mt-10 p-6 text-sm text-muted">O duelo precisa de pelo menos duas pessoas no bolão.</p>
        )}
      </div>
    </section>
  );
}
