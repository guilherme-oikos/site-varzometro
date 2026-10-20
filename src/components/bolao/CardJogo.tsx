import type { ReactNode } from 'react';
import AvatarAutor from '@/components/painel/AvatarAutor';
import BancadaAcha from '@/components/bolao/BancadaAcha';
import Escudo from '@/components/bolao/Escudo';
import SeloPontos from '@/components/bolao/SeloPontos';
import {
  palpitesAoVivo,
  palpitesVisiveis,
  placar,
  quandoE,
  rotuloStatus,
  type AutorDoBolao,
  type Jogo,
  type Palpite,
} from '@/lib/bolao';

/**
 * Um jogo da rodada com os palpites da bancada.
 *
 * Antes do apito, os palpites dos outros não chegam aqui (a RLS não devolve):
 * o card só diz quantos já palpitaram. Depois do apito, mostra o de cada um e,
 * com o jogo encerrado, os pontos. Rolando, o placar do meio é o de agora e o
 * selo tracejado diz quanto cada palpite faria se o jogo acabasse ali.
 *
 * Sem 'use client' e sem nada de servidor: a página pública usa direto, e o
 * formulário do painel passa os campos do palpite em `centro`.
 */
export default function CardJogo({
  jogo,
  autores,
  palpites,
  quemPalpitou,
  meuId,
  centro,
  rodape,
  agora,
  mostrarRodada = false,
}: {
  jogo: Jogo;
  /** Quem aparece na lista de palpites, na ordem da bancada. */
  autores: AutorDoBolao[];
  palpites: Palpite[];
  quemPalpitou: string[];
  meuId?: string;
  /** Substitui o placar do meio — no painel, os campos do palpite. */
  centro?: ReactNode;
  rodape?: ReactNode;
  agora: number;
  /** Na lista de um time os jogos são de várias rodadas. */
  mostrarRodada?: boolean;
}) {
  const visiveis = palpitesVisiveis(jogo, agora);
  const resultado = placar(jogo);
  const rolando = jogo.status === 'ao_vivo' || (jogo.status === 'agendado' && new Date(jogo.inicio).getTime() <= agora);
  const fora = jogo.status === 'adiado' || jogo.status === 'cancelado';

  const jaPalpitaram = autores.filter((autor) => quemPalpitou.includes(autor.id)).length;
  const previa = palpitesAoVivo([jogo], palpites);

  const status = rolando ? 'Rolando' : jogo.status === 'agendado' ? null : rotuloStatus[jogo.status];

  return (
    <article className="card p-4 sm:p-5">
      <header className="flex items-center justify-between gap-3">
        <p className="numerico text-xs font-semibold capitalize text-muted">
          {mostrarRodada ? <span className="text-zinc-300">Rodada {jogo.rodada} · </span> : null}
          {quandoE(jogo.inicio)}
        </p>
        {status ? (
          <span
            className={`t-micro inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 uppercase ${
              rolando ? 'border-primary/50 text-primary' : fora ? 'border-ink-line text-zinc-500' : 'border-ink-line text-zinc-300'
            }`}
          >
            {rolando ? <span aria-hidden className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary" /> : null}
            {status}
          </span>
        ) : null}
      </header>

      <div className="mt-4 grid grid-cols-[1fr_auto_1fr] items-center gap-3">
        <div className="flex min-w-0 items-center justify-end gap-2.5 text-right">
          <span className="truncate font-bold text-white">{jogo.mandante}</span>
          <Escudo arquivo={jogo.mandante_escudo} sigla={jogo.mandante_sigla || jogo.mandante} />
        </div>

        <div className="flex justify-center">
          {centro ?? (
            <span
              className={`numerico text-xl font-extrabold ${resultado ? (jogo.status === 'ao_vivo' ? 'text-primary' : 'text-white') : 'text-zinc-600'}`}
            >
              {resultado ?? 'x'}
            </span>
          )}
        </div>

        <div className="flex min-w-0 items-center gap-2.5">
          <Escudo arquivo={jogo.visitante_escudo} sigla={jogo.visitante_sigla || jogo.visitante} />
          <span className="truncate font-bold text-white">{jogo.visitante}</span>
        </div>
      </div>

      {/* Placar oficial embaixo quando o meio está ocupado pelos campos do palpite. */}
      {centro && resultado ? (
        <p className="numerico mt-2 text-center text-xs text-muted">
          Placar final: <span className="font-bold text-white">{resultado}</span>
        </p>
      ) : null}

      {autores.length > 0 ? (
        <div className="mt-4 border-t border-ink-line pt-4">
          {visiveis ? (
            <>
            <BancadaAcha jogo={jogo} palpites={palpites} />
            <ul className="grid gap-x-6 gap-y-2.5 sm:grid-cols-2">
              {autores.map((autor) => {
                const palpite = palpites.find((p) => p.autor_id === autor.id);
                const agoraFaria = previa.find((p) => p.autor_id === autor.id);
                const meu = autor.id === meuId;
                return (
                  <li key={autor.id} className="text-sm">
                    <div className="flex items-center gap-2.5">
                      <AvatarAutor autor={autor} tamanho="h-6 w-6" />
                      <span className={`min-w-0 flex-1 truncate ${meu ? 'font-bold text-primary' : 'text-zinc-300'}`}>
                        {meu ? 'Você' : autor.nome}
                      </span>
                      {palpite ? (
                        <>
                          {palpite.dobrado ? (
                            <span
                              title="Zebra da rodada: este palpite vale o dobro"
                              className="t-micro numerico rounded-md bg-primary/15 px-1.5 py-0.5 font-bold text-primary"
                            >
                              2x
                            </span>
                          ) : null}
                          <span className="numerico font-bold text-white">
                            {palpite.gols_mandante} x {palpite.gols_visitante}
                          </span>
                          {agoraFaria ? (
                            <SeloPontos pontos={agoraFaria.pontos} base={agoraFaria.pontos_base} provisorio />
                          ) : (
                            <SeloPontos pontos={palpite.pontos} base={palpite.pontos_base} />
                          )}
                        </>
                      ) : (
                        <span className="text-xs text-zinc-600">sem palpite</span>
                      )}
                    </div>
                    {palpite?.resenha ? (
                      <p className="mt-1 pl-[2.125rem] text-xs italic text-muted">“{palpite.resenha}”</p>
                    ) : null}
                  </li>
                );
              })}
            </ul>
            </>
          ) : (
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-xs text-muted">
              {/* Lado a lado, sem sobrepor: quem não tem foto é só iniciais, e iniciais sobrepostas não se leem. */}
              <div className="flex gap-1" aria-hidden>
                {autores.map((autor) => (
                  <span
                    key={autor.id}
                    title={autor.nome}
                    className={`rounded-full ${quemPalpitou.includes(autor.id) ? '' : 'opacity-25 grayscale'}`}
                  >
                    <AvatarAutor autor={autor} tamanho="h-6 w-6" />
                  </span>
                ))}
              </div>
              <span>
                {fora
                  ? 'Palpites guardados até o jogo ganhar data nova.'
                  : `${jaPalpitaram} de ${autores.length} já ${jaPalpitaram === 1 ? 'palpitou' : 'palpitaram'}. Os palpites aparecem no apito inicial.`}
              </span>
            </div>
          )}
        </div>
      ) : null}

      {rodape}
    </article>
  );
}
