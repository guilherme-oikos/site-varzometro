/**
 * Esqueleto da lista de artigos do painel, enquanto o banco responde a um
 * filtro, busca ou troca de página. Tem a mesma geometria do card de verdade —
 * duas linhas no celular, uma do `sm` para cima — para a lista não pular
 * quando os artigos chegam.
 *
 * `motion-safe`: quem pediu menos movimento no sistema vê os blocos parados.
 */

const bloco = 'rounded-md bg-white/[0.06]';

// Larguras variadas para não parecer uma grade de tijolos iguais.
const larguras = ['w-3/4', 'w-1/2', 'w-2/3', 'w-5/6', 'w-3/5'];

export default function EsqueletoArtigos({ admin }: { admin: boolean }) {
  return (
    <div role="status" aria-label="Carregando artigos" className="motion-safe:animate-pulse">
      <div className={`${bloco} mt-6 h-3 w-24`} />

      <ul className="mt-3 space-y-3" aria-hidden>
        {larguras.map((largura, i) => (
          <li
            key={i}
            className="card flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:gap-4 sm:p-5"
          >
            <div className="flex items-center gap-2 sm:contents">
              <div className={`${bloco} h-6 w-12 shrink-0 sm:order-1 sm:w-16`} />
              <div className="h-6 w-24 shrink-0 rounded-full bg-white/[0.06] sm:order-3 sm:w-28" />
              <div className="ml-auto flex shrink-0 justify-end sm:order-4 sm:ml-0 sm:w-44">
                <div className={`${bloco} h-3 w-24`} />
              </div>
            </div>

            <div className="min-w-0 space-y-2 sm:order-2 sm:flex-1">
              <div className={`${bloco} h-4 ${largura}`} />
              {admin ? <div className="h-5 w-20 rounded-full bg-white/[0.06]" /> : null}
            </div>

            <div className={`${bloco} hidden h-4 w-4 shrink-0 sm:order-5 sm:block`} />
          </li>
        ))}
      </ul>
    </div>
  );
}
