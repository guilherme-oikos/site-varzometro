'use client';

import { createContext, useContext, useId, type CSSProperties, type ReactNode } from 'react';
import * as Recharts from 'recharts';

/**
 * Peças de gráfico no padrão do shadcn/ui (`components/ui/chart.tsx` de lá),
 * sobre o Recharts. Mesma API — `ChartConfig`, `ChartContainer`,
 * `ChartTooltip`/`ChartTooltipContent`, `ChartLegend`/`ChartLegendContent` —,
 * mas com os tokens deste site (`ink-line`, `muted`) no lugar das variáveis
 * do shadcn, que o projeto não tem. Só modo escuro, como o site.
 *
 * Cada chave do `config` vira `--color-<chave>` no container, e as séries usam
 * `var(--color-<chave>)`: a cor mora num lugar só.
 */

export type ChartConfig = Record<string, { label: ReactNode; color: string }>;

const ChartContext = createContext<ChartConfig | null>(null);

function useChart(): ChartConfig {
  const config = useContext(ChartContext);
  if (!config) throw new Error('useChart precisa estar dentro de <ChartContainer>.');
  return config;
}

export function ChartContainer({
  config,
  className = '',
  children,
}: {
  config: ChartConfig;
  className?: string;
  children: React.ComponentProps<typeof Recharts.ResponsiveContainer>['children'];
}) {
  const id = useId();
  const cores = Object.fromEntries(
    Object.entries(config).map(([chave, item]) => [`--color-${chave}`, item.color]),
  ) as CSSProperties;

  return (
    <ChartContext.Provider value={config}>
      <div
        data-chart={id}
        style={cores}
        className={[
          'flex justify-center text-xs',
          // Os mesmos ajustes do shadcn sobre o CSS padrão do Recharts.
          '[&_.recharts-cartesian-axis-tick_text]:fill-zinc-500',
          '[&_.recharts-cartesian-grid_line]:stroke-ink-line',
          '[&_.recharts-curve.recharts-tooltip-cursor]:stroke-zinc-600',
          '[&_.recharts-layer]:outline-none [&_.recharts-surface]:outline-none',
          className,
        ].join(' ')}
      >
        <Recharts.ResponsiveContainer>{children}</Recharts.ResponsiveContainer>
      </div>
    </ChartContext.Provider>
  );
}

export const ChartTooltip = Recharts.Tooltip;
export const ChartLegend = Recharts.Legend;

type ItemDoTooltip = { dataKey?: string | number; name?: string | number; value?: number | string; color?: string };

/** Caixa do tooltip: rótulo em cima, uma linha por série com a chave de cor. */
export function ChartTooltipContent({
  active,
  payload,
  label,
  formatarRotulo,
  ordenar = false,
  destaque,
  indicador = 'dot',
}: {
  active?: boolean;
  payload?: ItemDoTooltip[];
  label?: ReactNode;
  formatarRotulo?: (rotulo: ReactNode) => ReactNode;
  /** Maior valor em cima — num ranking, é o que se quer ler primeiro. */
  ordenar?: boolean;
  /** Série em foco: as outras ficam apagadas também no tooltip. */
  destaque?: string | null;
  /** Marcador de cada linha, como no shadcn: quadradinho, traço ou tracejado. */
  indicador?: 'dot' | 'line' | 'dashed';
}) {
  const config = useChart();
  if (!active || !payload?.length) return null;

  const itens = ordenar ? [...payload].sort((a, b) => Number(b.value) - Number(a.value)) : payload;

  return (
    <div className="grid min-w-[8rem] gap-1.5 rounded-lg border border-ink-line/80 bg-ink px-2.5 py-1.5 text-xs shadow-xl">
      <p className="font-medium text-zinc-100">{formatarRotulo ? formatarRotulo(label) : label}</p>
      <ul className="grid gap-1">
        {itens.map((item) => {
          const chave = String(item.dataKey);
          const apagado = destaque && destaque !== chave;
          return (
            <li key={chave} className={`flex items-center gap-2 ${apagado ? 'opacity-40' : ''}`}>
              <span
                className={`shrink-0 rounded-[2px] ${
                  indicador === 'dot' ? 'h-2.5 w-2.5' : indicador === 'line' ? 'h-2.5 w-1' : 'h-2.5 w-0 border-[1.5px] border-dashed bg-transparent'
                }`}
                style={
                  indicador === 'dashed'
                    ? { borderColor: `var(--color-${chave})` }
                    : { background: `var(--color-${chave})` }
                }
              />
              <span className="flex-1 text-muted">{config[chave]?.label ?? item.name}</span>
              <span className="numerico font-medium tabular-nums text-zinc-100">{item.value}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/**
 * Legenda clicável: tocar num nome põe a linha dele em foco (as outras
 * apagam); tocar de novo solta. Botão de verdade, então funciona no teclado.
 *
 * Recebe o `config` direto porque pode ficar fora do `ChartContainer` (aqui,
 * ao lado do alternador, em cima do gráfico). As cores vêm do próprio config.
 */
export function ChartLegendContent({
  config,
  chaves,
  destaque,
  aoDestacar,
}: {
  config: ChartConfig;
  chaves: string[];
  destaque: string | null;
  aoDestacar: (chave: string | null) => void;
}) {
  return (
    <ul className="flex flex-wrap items-center justify-center gap-x-1 gap-y-1 pt-3">
      {chaves.map((chave) => {
        const ativo = destaque === chave;
        const apagado = destaque !== null && !ativo;
        return (
          <li key={chave}>
            <button
              type="button"
              aria-pressed={ativo}
              onClick={() => aoDestacar(ativo ? null : chave)}
              className={`flex items-center gap-1.5 rounded-md px-2 py-1 text-xs transition-opacity hover:bg-white/[0.04] ${
                apagado ? 'opacity-40' : ''
              } ${ativo ? 'text-white' : 'text-zinc-300'}`}
            >
              <span className="h-2 w-2 shrink-0 rounded-[2px]" style={{ background: config[chave]?.color }} />
              {config[chave]?.label}
            </button>
          </li>
        );
      })}
    </ul>
  );
}
