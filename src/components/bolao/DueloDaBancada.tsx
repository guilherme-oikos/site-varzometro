'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import AvatarAutor from '@/components/painel/AvatarAutor';
import SeloPontos from '@/components/bolao/SeloPontos';
import {
  duelo,
  placar,
  quandoE,
  slugDoDuelo,
  type AutorDoBolao,
  type Jogo,
  type JogoDoDuelo,
  type Palpite,
} from '@/lib/bolao';
import { seloDoArtigo, type ClubeSigla } from '@/lib/site';

type Autor = AutorDoBolao & { clube?: ClubeSigla };
type Lado = 'a' | 'b';

/**
 * O duelo com o seletor da dupla em cima. Trocar de dupla é instantâneo: a
 * conta (`duelo` em bolao.ts) roda aqui, sobre os jogos encerrados e os
 * palpites que o servidor já mandou — com cinco pessoas, é pouco dado.
 *
 * Dois jeitos de escolher, que funcionam juntos:
 * - clicar num lado do placar (vira o lado "trocando") e depois na pessoa.
 *   O lado fica marcado, então dá para passar a bancada inteira contra a mesma
 *   pessoa só clicando nas fotos;
 * - arrastar a foto até um dos lados (no computador; no celular o arrastar
 *   nativo não existe, e o toque cobre o mesmo caminho).
 * Escolher quem já está do outro lado troca os dois de lugar.
 *
 * O endereço acompanha a escolha (/bolao/duelo/<a>-x-<b>, na ordem da bancada)
 * para dar para mandar o link de um duelo.
 */
export default function DueloDaBancada({
  autores,
  jogos,
  palpites,
  inicial,
}: {
  autores: Autor[];
  /** Só os encerrados: é o que conta no duelo. */
  jogos: Jogo[];
  palpites: Palpite[];
  inicial: [string, string];
}) {
  const [ids, setIds] = useState<Record<Lado, string>>({ a: inicial[0], b: inicial[1] });
  const [trocando, setTrocando] = useState<Lado>('b');
  const [sobre, setSobre] = useState<Lado | null>(null);
  // O endereço só muda depois da primeira escolha: quem abre /bolao/duelo fica nele.
  const escolheu = useRef(false);

  const a = autores.find((autor) => autor.id === ids.a) ?? autores[0];
  const b = autores.find((autor) => autor.id === ids.b) ?? autores[1];
  const d = useMemo(() => duelo(jogos, palpites, a, b), [jogos, palpites, a, b]);
  const lider = d.vitoriasA > d.vitoriasB ? a : d.vitoriasB > d.vitoriasA ? b : null;

  useEffect(() => {
    if (!escolheu.current) return;
    const endereco = `/bolao/duelo/${slugDoDuelo(a, b, autores)}`;
    if (window.location.pathname !== endereco) window.history.replaceState(null, '', endereco);
  }, [a, b, autores]);

  const colocar = (lado: Lado, id: string) => {
    const outro: Lado = lado === 'a' ? 'b' : 'a';
    escolheu.current = true;
    setIds((atual) => {
      if (atual[lado] === id) return atual;
      // Já estava do outro lado: os dois trocam de lugar.
      if (atual[outro] === id) return { ...atual, [lado]: id, [outro]: atual[lado] } as Record<Lado, string>;
      return { ...atual, [lado]: id };
    });
  };

  const alvo = (lado: Lado) => ({
    onClick: () => setTrocando(lado),
    onDragOver: (evento: React.DragEvent) => {
      evento.preventDefault();
      setSobre(lado);
    },
    // Passar por cima da foto ou do nome dentro do lado também dispara o
    // dragleave; só sai de verdade quando o ponteiro deixa o lado.
    onDragLeave: (evento: React.DragEvent) => {
      if (!evento.currentTarget.contains(evento.relatedTarget as Node | null)) setSobre(null);
    },
    onDrop: (evento: React.DragEvent) => {
      evento.preventDefault();
      setSobre(null);
      const id = evento.dataTransfer.getData('text/plain');
      if (autores.some((autor) => autor.id === id)) colocar(lado, id);
    },
  });

  const ladoDe = (id: string): Lado | null => (ids.a === id ? 'a' : ids.b === id ? 'b' : null);

  return (
    <>
      {/* Quem entra no duelo */}
      <div className="mt-8">
        <p className="text-sm text-muted">
          Toque num lado do placar e escolha quem entra. No computador, dá para arrastar a foto.
        </p>
        <ul className="mt-3 flex flex-wrap gap-2" aria-label="Bancada">
          {autores.map((autor) => {
            const lado = ladoDe(autor.id);
            return (
              <li key={autor.id}>
                <button
                  type="button"
                  draggable
                  onDragStart={(evento) => {
                    evento.dataTransfer.setData('text/plain', autor.id);
                    evento.dataTransfer.effectAllowed = 'move';
                  }}
                  onClick={() => colocar(trocando, autor.id)}
                  aria-pressed={lado !== null}
                  aria-label={`${autor.nome}${lado ? ', no duelo' : ''}: colocar no lado ${trocando === 'a' ? 'esquerdo' : 'direito'}`}
                  className={`inline-flex min-h-11 cursor-grab items-center gap-2 rounded-full border py-1 pl-1 pr-3.5 text-sm font-bold transition-colors active:cursor-grabbing ${
                    lado
                      ? 'border-primary bg-primary/10 text-white'
                      : 'border-ink-line bg-ink-surface text-zinc-300 hover:border-primary/50 hover:text-white'
                  }`}
                >
                  <AvatarAutor autor={autor} tamanho="h-9 w-9" />
                  {autor.nome}
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      {/* Placar do duelo: cada lado é alvo do clique e do arrastar. */}
      <div className="card mt-6 p-4 sm:p-8">
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 sm:gap-4">
          <Slot autor={a} ativo={trocando === 'a'} sobre={sobre === 'a'} props={alvo('a')} />
          <div className="text-center">
            <p className="numerico text-4xl font-extrabold text-white sm:text-5xl">
              {d.vitoriasA} <span className="text-zinc-600">x</span> {d.vitoriasB}
            </p>
            <p className="numerico mt-1 text-xs text-muted">
              {d.empates} {d.empates === 1 ? 'empate' : 'empates'} · {d.jogos.length}{' '}
              {d.jogos.length === 1 ? 'jogo' : 'jogos'}
            </p>
          </div>
          <Slot autor={b} ativo={trocando === 'b'} sobre={sobre === 'b'} props={alvo('b')} />
        </div>

        <p className="mt-5 text-center text-sm text-zinc-300">
          {d.jogos.length === 0
            ? 'Ainda não teve jogo encerrado com palpite de um dos dois. O duelo começa no próximo apito final.'
            : lider
              ? `${lider.nome} está levando a melhor no mano a mano.`
              : 'Tudo igual no mano a mano. Ninguém pode tirar onda.'}
        </p>

        {d.jogos.length > 0 ? (
          <dl className="numerico mt-6 grid grid-cols-2 gap-3 border-t border-ink-line pt-5 text-center">
            <Comparacao rotulo="Pontos nesses jogos" a={d.pontosA} b={d.pontosB} />
            <Comparacao rotulo="Placares exatos" a={d.exatosA} b={d.exatosB} />
          </dl>
        ) : null}
      </div>

      {d.goleada ? (
        <section aria-labelledby="goleada" className="mt-8">
          <h2 id="goleada" className="t-title text-white">Maior goleada</h2>
          <div className="card mt-4 border-primary/30 p-4 sm:p-5">
            <LinhaDoDuelo linha={d.goleada} a={a} b={b} />
          </div>
        </section>
      ) : null}

      {d.jogos.length > 0 ? (
        <section aria-labelledby="jogo-a-jogo" className="mt-10">
          <h2 id="jogo-a-jogo" className="t-title text-white">Jogo a jogo</h2>
          <ul className="mt-4 space-y-3">
            {d.jogos.map((linha) => (
              <li key={linha.jogo.id} className="card p-4 sm:p-5">
                <LinhaDoDuelo linha={linha} a={a} b={b} />
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </>
  );
}

/** Um lado do placar. Marcado ("trocando") é para onde vai a próxima pessoa clicada. */
function Slot({
  autor,
  ativo,
  sobre,
  props,
}: {
  autor: Autor;
  ativo: boolean;
  /** Tem foto sendo arrastada por cima. */
  sobre: boolean;
  props: React.ButtonHTMLAttributes<HTMLButtonElement>;
}) {
  const selo = seloDoArtigo(autor.clube);
  return (
    <button
      type="button"
      {...props}
      aria-pressed={ativo}
      aria-label={`Lado de ${autor.nome}: escolher quem entra aqui`}
      className={`flex min-w-0 flex-col items-center gap-2 rounded-2xl border-2 border-dashed p-3 text-center transition-colors ${
        sobre
          ? 'border-primary bg-primary/10'
          : ativo
            ? 'border-primary/60 bg-primary/[0.04]'
            : 'border-transparent hover:border-ink-line'
      }`}
    >
      <AvatarAutor autor={autor} tamanho="h-14 w-14 sm:h-16 sm:w-16" />
      <span className="max-w-full truncate font-bold text-white">{autor.nome}</span>
      {autor.clube ? <span className={`tag-clube ${selo.classe}`}>{selo.sigla}</span> : null}
      <span className={`t-micro uppercase ${ativo ? 'text-primary' : 'text-zinc-600'}`}>
        {ativo ? 'Escolha quem entra' : 'Trocar'}
      </span>
    </button>
  );
}

function Comparacao({ rotulo, a, b }: { rotulo: string; a: number; b: number }) {
  const cor = (x: number, y: number) => (x > y ? 'text-primary' : 'text-white');
  return (
    <div className="col-span-2 grid grid-cols-[1fr_auto_1fr] items-baseline gap-3 sm:col-span-1">
      <dd className={`text-2xl font-extrabold ${cor(a, b)}`}>{a}</dd>
      <dt className="t-micro uppercase text-muted">{rotulo}</dt>
      <dd className={`text-2xl font-extrabold ${cor(b, a)}`}>{b}</dd>
    </div>
  );
}

/** Um jogo do duelo: o jogo com o placar, e embaixo o palpite de cada um, com quem levou em destaque. */
function LinhaDoDuelo({ linha, a, b }: { linha: JogoDoDuelo; a: AutorDoBolao; b: AutorDoBolao }) {
  const { jogo } = linha;
  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
        <p className="font-bold text-white">
          {jogo.mandante} <span className="numerico">{placar(jogo)}</span> {jogo.visitante}
        </p>
        <p className="numerico text-xs capitalize text-muted">
          Rodada {jogo.rodada} · {quandoE(jogo.inicio)}
        </p>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-3">
        <PalpiteDoLado autor={a} palpite={linha.a} venceu={linha.vencedor === 'a'} />
        <PalpiteDoLado autor={b} palpite={linha.b} venceu={linha.vencedor === 'b'} />
      </div>
    </>
  );
}

function PalpiteDoLado({ autor, palpite, venceu }: { autor: AutorDoBolao; palpite: Palpite | null; venceu: boolean }) {
  return (
    <div className={`rounded-xl border p-3 ${venceu ? 'border-primary/50 bg-primary/[0.06]' : 'border-ink-line'}`}>
      <div className="flex items-center gap-2">
        <AvatarAutor autor={autor} tamanho="h-6 w-6" />
        <span className="min-w-0 flex-1 truncate text-sm font-semibold text-zinc-200">{autor.nome}</span>
        {venceu ? <span className="t-micro uppercase text-primary">levou</span> : null}
      </div>
      {palpite ? (
        <div className="mt-2 flex items-center gap-2">
          <span className="numerico text-lg font-extrabold text-white">
            {palpite.gols_mandante} x {palpite.gols_visitante}
          </span>
          {palpite.dobrado ? (
            <span className="t-micro numerico rounded-md bg-primary/15 px-1.5 py-0.5 font-bold text-primary">2x</span>
          ) : null}
          <span className="ml-auto">
            <SeloPontos pontos={palpite.pontos} base={palpite.pontos_base} />
          </span>
        </div>
      ) : (
        <p className="mt-2 text-sm text-zinc-600">sem palpite</p>
      )}
      {palpite?.resenha ? <p className="mt-1.5 text-xs italic text-muted">“{palpite.resenha}”</p> : null}
    </div>
  );
}
