import { bancadaAcha, type Jogo, type Palpite } from '@/lib/bolao';

/**
 * "A bancada acha": o jogo inteiro numa olhada, depois do apito. Para onde a
 * bancada foi (barra com mandante, empate e visitante) e o placar mais
 * apostado. Antes do apito não tem o que resumir: a RLS não devolve os
 * palpites dos outros. Sem 'use client' e sem servidor, como o `CardJogo`.
 *
 * O texto evita artigo antes do nome do time ("vitória do"/"da"): o nome vem
 * do football-data, e não dá para saber se é "o" ou "a".
 */
export default function BancadaAcha({ jogo, palpites }: { jogo: Jogo; palpites: Palpite[] }) {
  const resumo = bancadaAcha(palpites);
  if (!resumo) return null;

  const { total, mandante, empate, visitante, placarMaisApostado } = resumo;
  const opcoes = [
    { chave: 'mandante', vezes: mandante, frase: `${jogo.mandante} vence`, rotulo: jogo.mandante, cor: 'bg-primary' },
    { chave: 'empate', vezes: empate, frase: 'Empate', rotulo: 'Empate', cor: 'bg-zinc-500' },
    { chave: 'visitante', vezes: visitante, frase: `${jogo.visitante} vence`, rotulo: jogo.visitante, cor: 'bg-primary/40' },
  ];
  const maximo = Math.max(mandante, empate, visitante);
  const lideres = opcoes.filter((o) => o.vezes === maximo);

  const manchete =
    lideres.length > 1
      ? `Bancada rachada: ${lideres.map((o) => o.rotulo).join(' ou ')}`
      : maximo === total
        ? `Unânime: ${lideres[0].frase}`
        : `${lideres[0].frase} para ${maximo} de ${total}`;

  return (
    <div className="mb-4 rounded-xl border border-ink-line bg-ink/40 p-3">
      <p className="t-micro uppercase text-primary">A bancada acha</p>
      <p className="mt-1 text-sm font-semibold text-white">{manchete}</p>

      <div className="mt-2.5 flex h-1.5 gap-0.5 overflow-hidden rounded-full" aria-hidden>
        {opcoes
          .filter((o) => o.vezes > 0)
          .map((o) => (
            <span key={o.chave} className={o.cor} style={{ width: `${(o.vezes / total) * 100}%` }} />
          ))}
      </div>

      <p className="numerico mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted">
        {opcoes.map((o) => (
          <span key={o.chave} className={o.vezes === 0 ? 'text-zinc-600' : undefined}>
            {o.rotulo} <span className="font-bold text-zinc-200">{o.vezes}</span>
          </span>
        ))}
        {placarMaisApostado ? (
          <span>
            · Placar mais apostado: <span className="font-bold text-zinc-200">{placarMaisApostado.placar}</span> (
            {placarMaisApostado.vezes}x)
          </span>
        ) : null}
      </p>
    </div>
  );
}
