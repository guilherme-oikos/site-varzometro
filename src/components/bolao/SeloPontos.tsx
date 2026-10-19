/** "+5", "+3"... ao lado do palpite. Placar exato ganha o laranja cheio; zero fica apagado. */
export default function SeloPontos({ pontos, compacto = false }: { pontos: number | null; compacto?: boolean }) {
  if (pontos === null) return null;

  const estilo =
    pontos === 5
      ? 'border-primary bg-primary text-ink'
      : pontos >= 2
        ? 'border-primary/50 text-primary'
        : pontos === 1
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
