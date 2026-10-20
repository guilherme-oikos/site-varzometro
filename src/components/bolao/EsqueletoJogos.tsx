/**
 * Esqueleto dos jogos da rodada, enquanto carrega. Duas versões, com a mesma
 * geometria do card que vai chegar — para a lista não pular nem trocar de
 * cara quando os jogos aparecem:
 *
 * - `publico`: o `CardJogo` de visitante — data, os dois times com o "x" no
 *   meio e a faixa de quem já palpitou.
 * - `logado`: o card do `FormPalpites` — os dois campos do placar no meio, a
 *   linha da resenha com o botão de zebra e o prazo embaixo.
 *
 * Quem decide qual aparece, quando o servidor não sabe se há login, é o CSS
 * (`so-visitante` / `so-logado`, ver globals.css): use `EsqueletoDosDois`.
 *
 * `motion-safe`: quem pediu menos movimento no sistema vê os blocos parados.
 */

const bloco = 'rounded-md bg-white/[0.06]';
const circulo = 'shrink-0 rounded-full bg-white/[0.06]';

// Larguras variadas para os nomes dos times não parecerem tijolos iguais.
const larguras = ['w-24', 'w-16', 'w-20', 'w-28', 'w-14', 'w-24', 'w-20', 'w-16', 'w-28', 'w-20'];

export type VarianteEsqueleto = 'publico' | 'logado';

export default function EsqueletoJogos({
  quantidade = 10,
  variante = 'publico',
}: {
  quantidade?: number;
  variante?: VarianteEsqueleto;
}) {
  const logado = variante === 'logado';

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
              {logado ? (
                // Os dois campos do placar, do tamanho dos de verdade.
                <div className="flex items-center gap-2">
                  <div className="h-[3.25rem] w-14 rounded-xl border border-ink-line bg-white/[0.03]" />
                  <div className={`${bloco} h-2 w-2`} />
                  <div className="h-[3.25rem] w-14 rounded-xl border border-ink-line bg-white/[0.03]" />
                </div>
              ) : (
                <div className={`${bloco} h-5 w-8`} />
              )}
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

            {logado ? (
              <>
                {/* Resenha + zebra */}
                <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center">
                  <div className="h-10 min-w-0 flex-1 rounded-xl border border-ink-line bg-white/[0.03]" />
                  <div className="h-11 w-full rounded-lg border border-ink-line sm:w-24" />
                </div>
                {/* "Palpite vale até o apito..." */}
                <div className={`${bloco} mx-auto mt-3 h-3 w-56 max-w-full`} />
              </>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * Os dois esqueletos, e o CSS mostra o certo: quem tem o cookie de sessão vê o
 * do logado, o visitante vê o público. Para quando quem renderiza não sabe se
 * há login (a troca de rodada, por exemplo).
 */
export function EsqueletoDosDois({ quantidade }: { quantidade?: number }) {
  return (
    <>
      <div className="so-visitante">
        <EsqueletoJogos quantidade={quantidade} variante="publico" />
      </div>
      <div className="so-logado">
        <EsqueletoJogos quantidade={quantidade} variante="logado" />
      </div>
    </>
  );
}
