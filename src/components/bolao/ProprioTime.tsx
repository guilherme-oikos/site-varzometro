import AvatarAutor from '@/components/painel/AvatarAutor';
import type { DesempenhoNoTime } from '@/lib/bolao';
import { seloDoArtigo } from '@/lib/site';

/**
 * Quanto cada um acerta nos jogos do próprio time, comparado com os outros
 * jogos. Um card por pessoa, na ordem da bancada — nunca ordenado por quem
 * acerta mais, para nenhum clube ganhar o topo da seção (regra de equilíbrio
 * dos quatro grandes).
 *
 * "Acerto" é cravar o resultado (vencedor ou empate), a mesma conta do
 * desempate do ranking.
 */

const porcento = (parte: number, todo: number) => (todo > 0 ? Math.round((parte / todo) * 100) : null);

export default function ProprioTime({ linhas }: { linhas: DesempenhoNoTime[] }) {
  if (linhas.length === 0) return null;

  return (
    <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {linhas.map((linha) => {
        const selo = seloDoArtigo(linha.clube);
        const noTime = porcento(linha.acertos, linha.jogos);
        const nosOutros = porcento(linha.outrosAcertos, linha.outrosJogos);
        const diferenca = noTime !== null && nosOutros !== null ? noTime - nosOutros : null;

        return (
          <li key={linha.autor.id} className="card flex flex-col p-4 sm:p-5">
            <div className="flex items-center gap-2.5">
              <AvatarAutor autor={linha.autor} tamanho="h-8 w-8" />
              <span className="min-w-0 flex-1 truncate font-bold text-white">{linha.autor.nome}</span>
              <span className={`tag-clube ${selo.classe} shrink-0`}>{selo.sigla}</span>
            </div>

            {linha.jogos === 0 ? (
              <p className="mt-4 text-sm text-muted">
                Ainda não teve jogo do {linha.time} encerrado com palpite. Por enquanto, só discurso.
              </p>
            ) : (
              <>
                <p className="mt-4 flex items-baseline gap-2">
                  <span className="numerico text-3xl font-extrabold text-white">{noTime}%</span>
                  <span className="text-sm text-zinc-300">de acerto nos jogos do {linha.time}</span>
                </p>
                <p className="mt-1 text-xs text-muted">
                  {nosOutros === null ? (
                    'Sem outros jogos para comparar ainda.'
                  ) : (
                    <>
                      Nos outros jogos: <span className="numerico font-semibold text-zinc-200">{nosOutros}%</span>
                      {diferenca !== null && diferenca !== 0 ? (
                        <span className={diferenca > 0 ? 'text-primary' : 'text-zinc-400'}>
                          {' '}
                          · {diferenca > 0 ? 'entende mais do próprio time' : 'o coração atrapalha'}
                        </span>
                      ) : null}
                    </>
                  )}
                </p>

                <dl className="numerico mt-4 grid grid-cols-3 gap-2 border-t border-ink-line pt-3 text-center">
                  <div>
                    <dt className="t-micro uppercase text-muted">Jogos</dt>
                    <dd className="mt-0.5 font-bold text-white">{linha.jogos}</dd>
                  </div>
                  <div>
                    <dt className="t-micro uppercase text-muted">Pontos</dt>
                    <dd className="mt-0.5 font-bold text-white">{linha.pontos}</dd>
                  </div>
                  <div>
                    <dt className="t-micro uppercase text-muted" title="Vezes que apostou na vitória do próprio time">
                      Botou fé
                    </dt>
                    <dd className="mt-0.5 font-bold text-white">
                      {linha.fe}
                      <span className="font-normal text-muted">/{linha.jogos}</span>
                    </dd>
                  </div>
                </dl>
              </>
            )}
          </li>
        );
      })}
    </ul>
  );
}
