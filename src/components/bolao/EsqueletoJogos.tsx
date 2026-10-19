/**
 * Esqueleto dos jogos da rodada, enquanto a próxima rodada carrega. Mesma
 * geometria do `CardJogo` — data, os dois times com escudo e a faixa dos
 * palpites embaixo — para a lista não pular quando os jogos chegam.
 *
 * `motion-safe`: quem pediu menos movimento no sistema vê os blocos parados.
 */

const bloco = 'rounded-md bg-white/[0.06]';
const circulo = 'shrink-0 rounded-full bg-white/[0.06]';

// Larguras variadas para os nomes dos times não parecerem tijolos iguais.
const larguras = ['w-24', 'w-16', 'w-20', 'w-28', 'w-14', 'w-24', 'w-20', 'w-16', 'w-28', 'w-20'];

export default function EsqueletoJogos({ quantidade = 10 }: { quantidade?: number }) {
  return (
    <div role="status" aria-label="Carregando jogos da rodada" className="motion-safe:animate-pulse">
      <ul className="space-y-3" aria-hidden>
        {Array.from({ length: Math.max(quantidade, 1) }, (_, i) => (
          <li key={i} className="card p-4 sm:p-5">
            <div className={`${bloco} h-3 w-28`} />

            <div className="mt-4 grid grid-cols-[1fr_auto_1fr] items-center gap-3">
              <div className="flex min-w-0 items-center justify-end gap-2.5">
                <div className={`${bloco} h-4 ${larguras[i % larguras.length]} max-w-full`} />
                <div className={`${circulo} h-8 w-8`} />
              </div>
              <div className={`${bloco} h-5 w-8`} />
              <div className="flex min-w-0 items-center gap-2.5">
                <div className={`${circulo} h-8 w-8`} />
                <div className={`${bloco} h-4 ${larguras[(i + 3) % larguras.length]} max-w-full`} />
              </div>
            </div>

            <div className="mt-4 flex items-center gap-3 border-t border-ink-line pt-4">
              <div className="flex gap-1">
                {Array.from({ length: 5 }, (_, j) => (
                  <div key={j} className={`${circulo} h-6 w-6`} />
                ))}
              </div>
              <div className={`${bloco} h-3 w-40`} />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
