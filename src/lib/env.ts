/**
 * Tira lixo de colagem de painel: espaço, quebra de linha e aspas em volta.
 *
 * Não é paranoia — foi bug real em produção. O `YOUTUBE_CHANNEL_ID` colado na
 * Vercel veio com caractere invisível grudado, o ID da playlist saiu malformado
 * e o Google respondeu `HTTP 400 invalid — Invalid Value`. Custou uma tarde,
 * porque 400 parece erro de chave e não é: chave recusada devolve 403.
 *
 * Toda variável nova passa por aqui. Puro, sem `fs`: pode ser importado por
 * componente 'use client'.
 */
export function limparVariavel(bruto: string | undefined): string | undefined {
  const limpo = bruto?.trim().replace(/^["']|["']$/g, '').trim();
  return limpo || undefined;
}
