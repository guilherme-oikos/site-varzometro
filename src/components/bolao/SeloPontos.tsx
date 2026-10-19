/** "+5", "+3"... ao lado do palpite. Placar exato ganha o laranja cheio; zero fica apagado. */
export default function SeloPontos({
  pontos,
  base,
  compacto = false,
}: {
  pontos: number | null;
  /** Faixa sem a zebra. A cor segue a faixa: um +10 de zebra é um placar exato (+5) dobrado. */
  base?: number | null;
  compacto?: boolean;
}) {
  if (pontos === null) return null;

  const faixa = base ?? pontos;
  const estilo =
    faixa === 5
      ? 'border-primary bg-primary text-ink'
      : faixa >= 2
        ? 'border-primary/50 text-primary'
        : faixa === 1
          ? 'border-ink-line text-zinc-300'
          : 'border-ink-line text-zinc-600';

  return (
    // `compacto`: cabeçalho do ranking, onde quatro selos dividem a largura do card.
    <span
      className={`t-micro numerico inline-flex justify-center rounded-full border py-0.5 ${
        compacto ? 'min-w-[1.875rem] px-1' : 'min-w-[2.25rem] px-2'
      } ${estilo}`}
    >
      {pontos > 0 ? `+${pontos}` : '0'}
    </span>
  );
}
