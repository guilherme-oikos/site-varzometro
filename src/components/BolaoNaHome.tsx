import Link from 'next/link';
import AvatarAutor from '@/components/painel/AvatarAutor';
import Escudo from '@/components/bolao/Escudo';
import SectionHeading from '@/components/SectionHeading';
import { ArrowRightIcon, BallIcon } from '@/components/Icons';
import { autoresDoRanking, paraSlug, placar, posicoes, proximoJogo, quandoE } from '@/lib/bolao';
import { getBolaoPublico } from '@/lib/bolao-dados';

/**
 * O bolão na home: quem lidera e o próximo jogo, levando para o /bolao — sem
 * isso, a página só é achada por quem já sabe que ela existe. Lê o mesmo
 * cache do bolão (tag `bolao`), então a sincronização refaz a home junto.
 *
 * Sem Supabase (dev sem conta) o bolão não existe, e o bloco some.
 */
export default async function BolaoNaHome() {
  const bolao = await getBolaoPublico();
  if (!bolao) return null;

  const agora = Date.now();
  const jogo = proximoJogo(bolao.jogos, agora);
  const lugares = posicoes(bolao.ranking);
  const autores = autoresDoRanking(bolao.ranking);
  // Empate na ponta divide a liderança; com todo mundo zerado, ninguém lidera.
  const lideres = bolao.ranking.filter((linha, i) => lugares[i] === 1 && linha.pontos > 0);
  const podio = bolao.ranking.slice(0, 3);
  const fotoDe = (id: string) => autores.find((a) => a.id === id)!;
  const rolando = jogo?.status === 'ao_vivo';

  return (
    <section id="bolao" className="relative scroll-mt-24 py-20 sm:py-28">
      <div className="container-page">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <SectionHeading
            align="left"
            title={
              <>
                Bolão da <span className="text-primary">bancada</span>
              </>
            }
            description={`A bancada crava o placar de cada jogo do Brasileirão ${bolao.temporada}. Vem ver quem manja e quem só fala bonito no microfone.`}
          />
          <Link href="/bolao" className="btn-ghost shrink-0 self-start !py-3 sm:self-auto">
            Ver o bolão
            <ArrowRightIcon className="h-4 w-4" />
          </Link>
        </div>

        <div className="revelar mt-12 grid gap-5 md:grid-cols-2">
          <Link href="/bolao" className="card card-hover group flex flex-col p-5 sm:p-6">
            <p className="t-label text-primary">{lideres.length > 1 ? 'Dividem a ponta' : 'Lidera o bolão'}</p>
            {lideres.length > 0 ? (
              <>
                <div className="mt-4 flex items-center gap-3">
                  <div className="flex shrink-0 -space-x-3">
                    {lideres.map((linha) => (
                      <span key={linha.autor_id} className="rounded-full ring-2 ring-ink-surface">
                        <AvatarAutor autor={fotoDe(linha.autor_id)} tamanho="h-14 w-14" />
                      </span>
                    ))}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-xl font-extrabold text-white">
                      {lideres.map((linha) => linha.nome).join(' e ')}
                    </p>
                    <p className="numerico text-sm text-muted">
                      {lideres[0].pontos} {lideres[0].pontos === 1 ? 'ponto' : 'pontos'}
                    </p>
                  </div>
                </div>
                <ol className="mt-5 flex flex-wrap gap-x-4 gap-y-1.5 border-t border-ink-line pt-4 text-sm text-muted">
                  {podio.map((linha, i) => (
                    <li key={linha.autor_id}>
                      <span className="numerico font-bold text-zinc-400">{lugares[i]}º</span> {linha.nome}{' '}
                      <span className="numerico font-bold text-zinc-200">{linha.pontos}</span>
                    </li>
                  ))}
                </ol>
              </>
            ) : (
              <p className="mt-4 text-sm text-muted">
                Ninguém pontuou ainda. O ranking abre no primeiro jogo encerrado.
              </p>
            )}
          </Link>

          <Link
            href={jogo ? `/bolao/rodada/${jogo.rodada}` : '/bolao'}
            className="card card-hover group flex flex-col p-5 sm:p-6"
          >
            <div className="flex items-center justify-between gap-3">
              <p className="t-label text-primary">{rolando ? 'Rolando agora' : 'Próximo jogo'}</p>
              {jogo ? <span className="numerico text-xs text-muted">Rodada {jogo.rodada}</span> : null}
            </div>
            {jogo ? (
              <>
                <div className="mt-5 grid grid-cols-[1fr_auto_1fr] items-center gap-3">
                  <div className="flex min-w-0 flex-col items-center gap-2 text-center">
                    <Escudo arquivo={jogo.mandante_escudo} sigla={jogo.mandante_sigla || jogo.mandante} tamanho="h-10 w-10" />
                    <span className="w-full truncate text-sm font-bold text-white">{jogo.mandante}</span>
                  </div>
                  <span className={`numerico text-xl font-extrabold ${rolando ? 'text-primary' : 'text-zinc-600'}`}>
                    {rolando ? (placar(jogo) ?? '0 x 0') : 'x'}
                  </span>
                  <div className="flex min-w-0 flex-col items-center gap-2 text-center">
                    <Escudo arquivo={jogo.visitante_escudo} sigla={jogo.visitante_sigla || jogo.visitante} tamanho="h-10 w-10" />
                    <span className="w-full truncate text-sm font-bold text-white">{jogo.visitante}</span>
                  </div>
                </div>
                <p className={`numerico mt-5 border-t border-ink-line pt-4 text-sm text-muted ${rolando ? '' : 'capitalize'}`}>
                  {rolando ? 'Os palpites da bancada já estão à mostra' : quandoE(jogo.inicio)}
                </p>
              </>
            ) : (
              <p className="mt-4 flex items-center gap-2 text-sm text-muted">
                <BallIcon className="h-5 w-5 text-primary" />
                Sem jogo marcado agora. A próxima rodada aparece aqui assim que sair a tabela.
              </p>
            )}
          </Link>
        </div>

        {autores.length > 0 ? (
          <p className="mt-6 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted">
            Palpites de cada um:
            {autores.map((autor) => (
              <Link
                key={autor.id}
                href={`/bolao/palpiteiro/${paraSlug(autor.nome)}`}
                className="toque-linha font-semibold text-primary hover:underline"
              >
                {autor.nome}
              </Link>
            ))}
          </p>
        ) : null}
      </div>
    </section>
  );
}
