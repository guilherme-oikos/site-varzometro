'use client';

import { useEffect, useMemo, useState } from 'react';
import { Bar, BarChart, CartesianGrid, Line, LineChart, XAxis } from 'recharts';
import { TrendingUpIcon } from '@/components/Icons';
import {
  ChartContainer,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';
import type { Evolucao } from '@/lib/bolao';

/**
 * Evolução da bancada no bolão, montada como os exemplos de gráfico do
 * shadcn/ui: card com título, descrição e rodapé; "Line Chart – Multiple" no
 * acumulado e "Bar Chart – Multiple" por rodada. Carregado por
 * `GraficoEvolucao`, só no navegador.
 *
 * Minimalista como lá: grade só horizontal, sem eixo Y e sem bolinha na
 * linha — o valor exato está no tooltip e na tabela.
 *
 * Cores: a paleta de gráfico do shadcn (modo escuro), com o verde e o laranja
 * escurecidos para passar na validação de daltonismo sobre o card (#16161B) —
 * o laranja também deixa de brigar com o da marca. A cor segue a pessoa, na
 * ordem da bancada, nunca a posição.
 */

const CORES = ['#2662d9', '#29a37a', '#cf7317', '#af57db', '#e23670'];

/** Barras demais viram pente: o "por rodada" mostra só as últimas. */
const RODADAS_NAS_BARRAS = 6;

type Modo = 'acumulado' | 'rodada';

const MODOS: { valor: Modo; rotulo: string }[] = [
  { valor: 'acumulado', rotulo: 'Acumulado' },
  { valor: 'rodada', rotulo: 'Por rodada' },
];

function useMenosMovimento(): boolean {
  const [reduz, setReduz] = useState(false);
  useEffect(() => {
    const consulta = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduz(consulta.matches);
    const mudou = () => setReduz(consulta.matches);
    consulta.addEventListener('change', mudou);
    return () => consulta.removeEventListener('change', mudou);
  }, []);
  return reduz;
}

export default function GraficoEvolucaoRecharts({ dados }: { dados: Evolucao }) {
  const [modo, setModo] = useState<Modo>('acumulado');
  const [destaque, setDestaque] = useState<string | null>(null);
  const semAnimacao = useMenosMovimento();

  const { rodadas, series } = dados;
  // Chave curta e estável (p0, p1...) em vez do id: vira nome de variável CSS.
  const chaves = useMemo(() => series.map((_, i) => `p${i}`), [series]);

  const config = useMemo<ChartConfig>(
    () =>
      Object.fromEntries(
        series.map((s, i) => [chaves[i], { label: s.autor.nome, color: CORES[i % CORES.length] }]),
      ),
    [series, chaves],
  );

  const daRodada = (acumulado: number[], j: number) => acumulado[j] - (j > 0 ? acumulado[j - 1] : 0);

  const acumulado = rodadas.map((rodada, j) => ({
    rodada,
    ...Object.fromEntries(series.map((s, i) => [chaves[i], s.acumulado[j]])),
  }));
  const porRodada = rodadas
    .map((rodada, j) => ({
      rodada,
      ...Object.fromEntries(series.map((s, i) => [chaves[i], daRodada(s.acumulado, j)])),
    }))
    .slice(-RODADAS_NAS_BARRAS);

  // Rodapé, como o CardFooter dos exemplos: uma frase de destaque e uma de apoio.
  const ultima = rodadas.length - 1;
  const melhores = (valores: number[]) => {
    const maximo = Math.max(...valores);
    return { nomes: series.filter((_, i) => valores[i] === maximo).map((s) => s.autor.nome), maximo };
  };
  const lider = melhores(series.map((s) => s.acumulado[ultima]));
  const reiDaUltima = melhores(series.map((s) => daRodada(s.acumulado, ultima)));

  const primeira = modo === 'acumulado' ? rodadas[0] : porRodada[0].rodada;
  const descricao =
    modo === 'acumulado'
      ? `Pontos somados da rodada ${primeira} à ${rodadas[ultima]}`
      : `Pontos feitos em cada rodada, da ${primeira} à ${rodadas[ultima]}`;

  const apagado = (chave: string) => destaque !== null && destaque !== chave;
  const animacao = { isAnimationActive: !semAnimacao, animationDuration: 500 };

  const eixoX = (
    // Rótulo curto (R31), como os "Jan, Feb" dos exemplos: "Rodada 31" não cabe no celular.
    <XAxis
      dataKey="rodada"
      tickLine={false}
      axisLine={false}
      tickMargin={8}
      interval="preserveStartEnd"
      tickFormatter={(r: number) => `R${r}`}
    />
  );

  return (
    <div className="card overflow-hidden">
      {/* CardHeader */}
      <div className="flex flex-col gap-4 border-b border-ink-line p-5 sm:flex-row sm:items-start sm:justify-between sm:p-6">
        <div className="grid gap-1">
          <h2 id="evolucao" className="font-semibold leading-none tracking-tight text-white">
            Evolução do bolão
          </h2>
          <p className="text-sm text-muted">{descricao}</p>
        </div>
        {/* Alternador no estilo das Tabs do shadcn. */}
        <div role="tablist" aria-label="Leitura do gráfico" className="inline-flex shrink-0 self-start rounded-lg bg-white/[0.05] p-1">
          {MODOS.map((m) => (
            <button
              key={m.valor}
              type="button"
              role="tab"
              aria-selected={modo === m.valor}
              onClick={() => setModo(m.valor)}
              className={`rounded-md px-3 py-1 text-sm font-medium transition-all ${
                modo === m.valor ? 'bg-ink-surface text-white shadow-sm' : 'text-muted hover:text-zinc-200'
              }`}
            >
              {m.rotulo}
            </button>
          ))}
        </div>
      </div>

      {/* CardContent */}
      <div className="px-2 pt-6 sm:px-6">
        <ChartContainer config={config} className="h-[240px] w-full sm:h-[280px]">
          {modo === 'acumulado' ? (
            <LineChart data={acumulado} margin={{ left: 12, right: 12, top: 4 }} accessibilityLayer>
              <CartesianGrid vertical={false} />
              {eixoX}
              <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent ordenar destaque={destaque} formatarRotulo={(r) => `Até a rodada ${r}`} />}
              />
              {chaves.map((chave) => (
                <Line
                  key={chave}
                  dataKey={chave}
                  type="natural"
                  stroke={`var(--color-${chave})`}
                  strokeWidth={destaque === chave ? 3 : 2}
                  strokeOpacity={apagado(chave) ? 0.15 : 1}
                  dot={false}
                  activeDot={apagado(chave) ? false : { r: 4, strokeWidth: 0 }}
                  {...animacao}
                />
              ))}
            </LineChart>
          ) : (
            <BarChart data={porRodada} margin={{ top: 4 }} barGap={2} accessibilityLayer>
              <CartesianGrid vertical={false} />
              {eixoX}
              <ChartTooltip
                cursor={false}
                content={
                  <ChartTooltipContent indicador="dashed" ordenar destaque={destaque} formatarRotulo={(r) => `Na rodada ${r}`} />
                }
              />
              {chaves.map((chave) => (
                <Bar
                  key={chave}
                  dataKey={chave}
                  fill={`var(--color-${chave})`}
                  fillOpacity={apagado(chave) ? 0.15 : 1}
                  radius={4}
                  maxBarSize={24}
                  {...animacao}
                />
              ))}
            </BarChart>
          )}
        </ChartContainer>
        <ChartLegendContent config={config} chaves={chaves} destaque={destaque} aoDestacar={setDestaque} />
      </div>

      {/* CardFooter */}
      <div className="flex flex-col items-start gap-2 p-5 pt-4 text-sm sm:p-6 sm:pt-4">
        <p className="flex items-center gap-2 font-medium leading-none text-white">
          {lider.nomes.join(' e ')} {lider.nomes.length > 1 ? 'dividem a ponta' : 'lidera'} com {lider.maximo}{' '}
          {lider.maximo === 1 ? 'ponto' : 'pontos'}
          <TrendingUpIcon className="h-4 w-4 text-zinc-400" />
        </p>
        <p className="leading-none text-muted">
          Na rodada {rodadas[ultima]}, quem mais pontuou: {reiDaUltima.nomes.join(' e ')} ({reiDaUltima.maximo})
        </p>

        <details className="mt-2 w-full text-sm">
          <summary className="cursor-pointer text-xs font-medium text-muted hover:text-zinc-300">Ver em tabela</summary>
          <div className="mt-3 overflow-x-auto">
            <table className="numerico w-full text-left text-xs">
              <caption className="sr-only">Pontos acumulados por rodada</caption>
              <thead className="text-muted">
                <tr>
                  <th scope="col" className="py-1.5 pr-3 font-medium">Quem</th>
                  {rodadas.map((r) => (
                    <th key={r} scope="col" className="px-2 py-1.5 text-right font-medium">R{r}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-line text-zinc-300">
                {series.map((s) => (
                  <tr key={s.autor.id}>
                    <th scope="row" className="py-1.5 pr-3 font-medium text-white">{s.autor.nome}</th>
                    {s.acumulado.map((v, j) => (
                      <td key={j} className="px-2 py-1.5 text-right">{v}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      </div>
    </div>
  );
}
