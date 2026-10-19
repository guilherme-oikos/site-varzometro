import AvatarAutor from '@/components/painel/AvatarAutor';
import type { PlacarDaRodada } from '@/lib/bolao';

/**
 * Rei e lanterna da rodada, em cima dos jogos. Aparece a partir do primeiro
 * jogo encerrado; enquanto faltar jogo, avisa que é parcial ("até agora"),
 * porque a rodada ainda pode virar.
 *
 * Empate divide a coroa (e a lanterna): todo mundo que fez a mesma pontuação
 * aparece. Sem 'use client' e sem servidor, como o `CardJogo`.
 */
export default function CampeaoRodada({ placar }: { placar: PlacarDaRodada }) {
  const { linhas, encerrados, total } = placar;
  if (encerrados === 0 || linhas.length === 0) return null;

  const fechada = encerrados >= total;
  const maximo = linhas[0].pontos;
  const minimo = linhas[linhas.length - 1].pontos;
  const reis = linhas.filter((l) => l.pontos === maximo);
  const lanternas = linhas.filter((l) => l.pontos === minimo);
  const empateGeral = maximo === minimo;

  const nomes = (lista: typeof linhas) => lista.map((l) => l.autor.nome).join(' e ');

  const destaque = (titulo: string, lista: typeof linhas, rei: boolean) => (
    <div className="min-w-0 flex-1">
      <p className={`t-label ${rei ? 'text-primary' : 'text-zinc-400'}`}>{titulo}</p>
      <div className="mt-2 flex items-center gap-2.5">
        <div className="flex shrink-0 -space-x-2">
          {lista.map((l) => (
            <span key={l.autor.id} className="rounded-full ring-2 ring-ink-elevated">
              <AvatarAutor autor={l.autor} tamanho="h-9 w-9" />
            </span>
          ))}
        </div>
        <div className="min-w-0">
          <p className="truncate font-bold text-white">{nomes(lista)}</p>
          <p className="numerico text-xs text-muted">
            {lista[0].pontos} {lista[0].pontos === 1 ? 'ponto' : 'pontos'}
          </p>
        </div>
      </div>
    </div>
  );

  return (
    <section aria-label="Campeão da rodada" className="card mb-5 p-4 sm:p-5">
      <div className="flex items-center justify-between gap-3">
        <h3 className="t-title text-white">{fechada ? 'Fechou a rodada' : 'Até agora na rodada'}</h3>
        {!fechada ? (
          <span className="t-micro numerico rounded-full border border-ink-line px-2.5 py-1 uppercase text-zinc-300">
            {encerrados} de {total} jogos
          </span>
        ) : null}
      </div>

      {empateGeral ? (
        <p className="mt-3 text-sm text-zinc-300">
          Tudo empatado: a bancada inteira com {maximo} {maximo === 1 ? 'ponto' : 'pontos'}. Ninguém pode tirar onda.
        </p>
      ) : (
        <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:gap-6">
          {destaque(reis.length > 1 ? 'Dividiram a coroa' : 'Rei da rodada', reis, true)}
          <div aria-hidden className="hidden w-px self-stretch bg-ink-line sm:block" />
          {destaque('Lanterna', lanternas, false)}
        </div>
      )}

      <ol className="mt-4 flex flex-wrap gap-x-4 gap-y-1.5 border-t border-ink-line pt-3 text-xs text-muted">
        {linhas.map((l) => (
          <li key={l.autor.id}>
            {l.autor.nome} <span className="numerico font-bold text-zinc-200">{l.pontos}</span>
          </li>
        ))}
      </ol>
    </section>
  );
}
