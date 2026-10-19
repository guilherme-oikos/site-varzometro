import Link from 'next/link';
import Escudo from '@/components/bolao/Escudo';
import type { TimeDoBolao } from '@/lib/bolao';

/**
 * Faixa de escudos para ver os jogos de um time só (/bolao/time/<slug>).
 * Endereço próprio, e não `?time=`: ler a busca deixaria o /bolao dinâmico,
 * e ele é estático de propósito.
 *
 * Só o escudo, com o nome no `aria-label` e no `title`: as siglas do
 * football-data confundem (o São Paulo vem "PAU"; Corinthians e Coritiba vêm
 * os dois "COR"). Os quatro grandes de SP primeiro, separados do resto por um
 * traço — a ordem entre eles é alfabética (ver `timesDoBolao`).
 *
 * No celular a faixa rola de lado; a página não.
 */
export default function FiltroTimes({ times, atual }: { times: TimeDoBolao[]; atual?: string }) {
  if (times.length === 0) return null;

  const item = (ativo: boolean) =>
    `toque grid h-11 w-11 shrink-0 place-items-center rounded-full border transition-colors ${
      ativo ? 'border-primary bg-primary/10' : 'border-ink-line bg-ink-surface hover:border-zinc-600'
    }`;

  const ultimoGrande = times.filter((t) => t.grande).length - 1;

  return (
    <nav aria-label="Filtrar por time" className="min-w-0">
      <p className="t-label text-zinc-400">Jogos de um time</p>
      <ul className="-mx-4 mt-3 flex items-center gap-2 overflow-x-auto px-4 pb-2 [scrollbar-width:none] sm:mx-0 sm:px-0 [&::-webkit-scrollbar]:hidden">
        <li className="shrink-0">
          <Link
            href="/bolao"
            aria-current={atual ? undefined : 'page'}
            className={`toque flex h-11 items-center rounded-full border px-4 text-sm font-semibold transition-colors ${
              atual ? 'border-ink-line bg-ink-surface text-zinc-300 hover:border-zinc-600' : 'border-primary bg-primary/10 text-white'
            }`}
          >
            Todos
          </Link>
        </li>
        {times.map((time, i) => (
          <li key={time.slug} className="flex shrink-0 items-center gap-2">
            <Link
              href={`/bolao/time/${time.slug}`}
              aria-label={time.nome}
              title={time.nome}
              aria-current={atual === time.slug ? 'page' : undefined}
              className={item(atual === time.slug)}
            >
              <Escudo arquivo={time.escudo} sigla={time.sigla || time.nome} tamanho="h-6 w-6" />
            </Link>
            {i === ultimoGrande && i < times.length - 1 ? (
              <span aria-hidden className="mx-1 h-6 w-px bg-ink-line" />
            ) : null}
          </li>
        ))}
      </ul>
    </nav>
  );
}
