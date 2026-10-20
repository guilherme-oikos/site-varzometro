'use client';

import { useEffect, useRef, useState } from 'react';
import { EyeIcon } from '@/components/Icons';

const numero = new Intl.NumberFormat('pt-BR');

/** "1 visualização", "1.234 visualizações". Sem número (contador fora do ar), nada. */
export function SeloVisualizacoes({ total, className = '' }: { total: number | null | undefined; className?: string }) {
  if (total === null || total === undefined) return null;
  return (
    <span className={`numerico inline-flex items-center gap-1.5 ${className}`}>
      <EyeIcon className="h-3.5 w-3.5" />
      {numero.format(total)}
      <span className="sr-only">{total === 1 ? ' visualização' : ' visualizações'}</span>
    </span>
  );
}

/**
 * Na página do artigo: conta esta abertura e mostra o total já com ela. Cada
 * carregamento soma 1, recarregar inclusive. Quem não roda JavaScript (robô de
 * busca, prévia de link) não conta — é o que deixa o número perto de gente
 * de verdade.
 */
export function ContadorDoArtigo({ slug }: { slug: string }) {
  const [total, setTotal] = useState<number | null>(null);
  // No dev, o modo estrito roda o efeito duas vezes: sem a trava, contaria em dobro.
  const contou = useRef(false);

  useEffect(() => {
    if (contou.current) return;
    contou.current = true;
    fetch('/api/visualizacoes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slug }),
      keepalive: true,
    })
      .then((resposta) => (resposta.ok ? (resposta.json() as Promise<{ total: number | null }>) : null))
      .then((dados) => setTotal(dados?.total ?? null))
      // Contador fora do ar não pode atrapalhar a leitura: o selo só não aparece.
      .catch(() => {});
  }, [slug]);

  return <SeloVisualizacoes total={total} />;
}

/** Os totais de uma lista de artigos, para os cards do /blog. Vazio até chegar (ou se falhar). */
export function useVisualizacoes(slugs: string[]): Record<string, number> {
  const [totais, setTotais] = useState<Record<string, number>>({});
  const chave = slugs.join(',');

  useEffect(() => {
    if (!chave) return;
    const controle = new AbortController();
    fetch(`/api/visualizacoes?slugs=${encodeURIComponent(chave)}`, { signal: controle.signal })
      .then((resposta) => (resposta.ok ? (resposta.json() as Promise<Record<string, number>>) : {}))
      .then(setTotais)
      .catch(() => {});
    return () => controle.abort();
  }, [chave]);

  return totais;
}
