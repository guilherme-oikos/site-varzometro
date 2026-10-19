import Link from 'next/link';
import { notFound, permanentRedirect } from 'next/navigation';
import AvatarAutor from '@/components/painel/AvatarAutor';
import SeloPontos from '@/components/bolao/SeloPontos';
import { ArrowLeftIcon } from '@/components/Icons';
import {
  autoresDoRanking,
  duelo,
  duplas,
  paraSlug,
  placar,
  quandoE,
  slugDoDuelo,
  type AutorDoBolao,
  type JogoDoDuelo,
  type Palpite,
} from '@/lib/bolao';
import { getBolaoPublico, getHistoricoPublico } from '@/lib/bolao-dados';
import { seloDoArtigo, siglaDeClube } from '@/lib/site';

/**
 * /bolao/duelo (as dez duplas da bancada, cada uma com o placar) e
 * /bolao/duelo/<a>-x-<b> (o confronto direto). Estáticas como o resto do
 * bolão, com os palpites dos jogos encerrados — que todo mundo já pode ver.
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

  if (!dupla) {
    return (
      <Moldura titulo="Duelo da bancada" voltar={{ href: '/bolao', texto: 'Bolão da bancada' }}>
        <p className="t-lead medida-apoio mt-4 text-muted">
          Um contra um: em cada jogo encerrado, quem fez mais pontos leva. Escolha a dupla.
        </p>
        <ul className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {duplas(autores).map(([a, b]) => {
            const d = duelo(bolao.jogos, historico, a, b);
            return (
              <li key={`${a.id}-${b.id}`}>
                <Link
                  href={`/bolao/duelo/${slugDoDuelo(a, b, autores)}`}
                  className="card group flex items-center gap-3 p-4 transition-colors hover:border-zinc-600 sm:p-5"
                >
                  <Lado autor={a} />
                  <span className="numerico mx-auto shrink-0 text-xl font-extrabold text-white">
                    {d.vitoriasA} <span className="text-zinc-600">x</span> {d.vitoriasB}
                  </span>
                  <Lado autor={b} invertido />
                </Link>
              </li>
            );
          })}
        </ul>
      </Moldura>
    );
  }

  const [slugA, slugB] = dupla.split('-x-');
  const a = autores.find((autor) => paraSlug(autor.nome) === slugA);
  const b = autores.find((autor) => paraSlug(autor.nome) === slugB);
  if (!a || !b || a === b) notFound();
  const canonico = slugDoDuelo(a, b, autores);
  if (canonico !== dupla) permanentRedirect(`/bolao/duelo/${canonico}`);

  const d = duelo(bolao.jogos, historico, a, b);
  const lider = d.vitoriasA > d.vitoriasB ? a : d.vitoriasB > d.vitoriasA ? b : null;

  return (
    <Moldura titulo={`${a.nome} x ${b.nome}`} voltar={{ href: '/bolao/duelo', texto: 'Todos os duelos' }}>
      {/* Placar do duelo */}
      <div className="card mt-8 p-5 sm:p-8">
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4">
          <Perfil autor={a} clube={clubeDe.get(a.id)} />
          <div className="text-center">
            <p className="numerico text-4xl font-extrabold text-white sm:text-5xl">
              {d.vitoriasA} <span className="text-zinc-600">x</span> {d.vitoriasB}
            </p>
            <p className="numerico mt-1 text-xs text-muted">
              {d.empates} {d.empates === 1 ? 'empate' : 'empates'} · {d.jogos.length}{' '}
              {d.jogos.length === 1 ? 'jogo' : 'jogos'}
            </p>
          </div>
          <Perfil autor={b} clube={clubeDe.get(b.id)} />
        </div>

        <p className="mt-5 text-center text-sm text-zinc-300">
          {d.jogos.length === 0
            ? 'Ainda não teve jogo encerrado com palpite de um dos dois. O duelo começa no próximo apito final.'
            : lider
              ? `${lider.nome} está levando a melhor no mano a mano.`
              : 'Tudo igual no mano a mano. Ninguém pode tirar onda.'}
        </p>

        {d.jogos.length > 0 ? (
          <dl className="numerico mt-6 grid grid-cols-2 gap-3 border-t border-ink-line pt-5 text-center">
            <Comparacao rotulo="Pontos nesses jogos" a={d.pontosA} b={d.pontosB} />
            <Comparacao rotulo="Placares exatos" a={d.exatosA} b={d.exatosB} />
          </dl>
        ) : null}
      </div>

      {d.goleada ? (
        <section aria-labelledby="goleada" className="mt-8">
          <h2 id="goleada" className="t-title text-white">Maior goleada</h2>
          <div className="card mt-4 border-primary/30 p-4 sm:p-5">
            <LinhaDoDuelo linha={d.goleada} a={a} b={b} />
          </div>
        </section>
      ) : null}

      {d.jogos.length > 0 ? (
        <section aria-labelledby="jogo-a-jogo" className="mt-10">
          <h2 id="jogo-a-jogo" className="t-title text-white">Jogo a jogo</h2>
          <ul className="mt-4 space-y-3">
            {d.jogos.map((linha) => (
              <li key={linha.jogo.id} className="card p-4 sm:p-5">
                <LinhaDoDuelo linha={linha} a={a} b={b} />
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </Moldura>
  );
}

function Moldura({
  titulo,
  voltar,
  children,
}: {
  titulo: string;
  voltar: { href: string; texto: string };
  children: React.ReactNode;
}) {
  return (
    <section className="relative pb-24 pt-28 sm:pt-36">
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-80 bg-fade-primary" />
      <div className="container-page relative">
        <Link href={voltar.href} className="toque-linha inline-flex items-center gap-1.5 text-sm font-semibold text-muted hover:text-white">
          <ArrowLeftIcon className="h-4 w-4" />
          {voltar.texto}
        </Link>
        <h1 className="t-page mt-4 text-balance text-white">{titulo}</h1>
        {children}
      </div>
    </section>
  );
}

function Lado({ autor, invertido = false }: { autor: AutorDoBolao; invertido?: boolean }) {
  return (
    <span className={`flex min-w-0 items-center gap-2.5 ${invertido ? 'flex-row-reverse text-right' : ''}`}>
      <AvatarAutor autor={autor} tamanho="h-9 w-9" />
      <span className="truncate font-bold text-white">{autor.nome}</span>
    </span>
  );
}

function Perfil({ autor, clube }: { autor: AutorDoBolao; clube?: ReturnType<typeof siglaDeClube> }) {
  const selo = seloDoArtigo(clube);
  return (
    <div className="flex min-w-0 flex-col items-center gap-2 text-center">
      <AvatarAutor autor={autor} tamanho="h-14 w-14 sm:h-16 sm:w-16" />
      <p className="max-w-full truncate font-bold text-white">{autor.nome}</p>
      {clube ? <span className={`tag-clube ${selo.classe}`}>{selo.sigla}</span> : null}
    </div>
  );
}

function Comparacao({ rotulo, a, b }: { rotulo: string; a: number; b: number }) {
  const cor = (x: number, y: number) => (x > y ? 'text-primary' : 'text-white');
  return (
    <div className="col-span-2 grid grid-cols-[1fr_auto_1fr] items-baseline gap-3 sm:col-span-1">
      <dd className={`text-2xl font-extrabold ${cor(a, b)}`}>{a}</dd>
      <dt className="t-micro uppercase text-muted">{rotulo}</dt>
      <dd className={`text-2xl font-extrabold ${cor(b, a)}`}>{b}</dd>
    </div>
  );
}

/** Um jogo do duelo: o jogo com o placar, e embaixo o palpite de cada um, com quem levou em destaque. */
function LinhaDoDuelo({ linha, a, b }: { linha: JogoDoDuelo; a: AutorDoBolao; b: AutorDoBolao }) {
  const { jogo } = linha;
  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
        <p className="font-bold text-white">
          {jogo.mandante} <span className="numerico">{placar(jogo)}</span> {jogo.visitante}
        </p>
        <p className="numerico text-xs capitalize text-muted">
          Rodada {jogo.rodada} · {quandoE(jogo.inicio)}
        </p>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-3">
        <PalpiteDoLado autor={a} palpite={linha.a} venceu={linha.vencedor === 'a'} />
        <PalpiteDoLado autor={b} palpite={linha.b} venceu={linha.vencedor === 'b'} />
      </div>
    </>
  );
}

function PalpiteDoLado({ autor, palpite, venceu }: { autor: AutorDoBolao; palpite: Palpite | null; venceu: boolean }) {
  return (
    <div className={`rounded-xl border p-3 ${venceu ? 'border-primary/50 bg-primary/[0.06]' : 'border-ink-line'}`}>
      <div className="flex items-center gap-2">
        <AvatarAutor autor={autor} tamanho="h-6 w-6" />
        <span className="min-w-0 flex-1 truncate text-sm font-semibold text-zinc-200">{autor.nome}</span>
        {venceu ? <span className="t-micro uppercase text-primary">levou</span> : null}
      </div>
      {palpite ? (
        <div className="mt-2 flex items-center gap-2">
          <span className="numerico text-lg font-extrabold text-white">
            {palpite.gols_mandante} x {palpite.gols_visitante}
          </span>
          {palpite.dobrado ? (
            <span className="t-micro numerico rounded-md bg-primary/15 px-1.5 py-0.5 font-bold text-primary">2x</span>
          ) : null}
          <span className="ml-auto">
            <SeloPontos pontos={palpite.pontos} base={palpite.pontos_base} />
          </span>
        </div>
      ) : (
        <p className="mt-2 text-sm text-zinc-600">sem palpite</p>
      )}
      {palpite?.resenha ? <p className="mt-1.5 text-xs italic text-muted">“{palpite.resenha}”</p> : null}
    </div>
  );
}
