/**
 * Escudos dos times, servidos pelo nosso domínio.
 *
 * Os escudos moram no servidor do football-data.org. Carregar de lá direto
 * faria o navegador de cada visitante falar com um terceiro — e a política de
 * privacidade não cita esse terceiro. Passando por aqui, quem busca é o nosso
 * servidor, uma vez; depois o CDN da Vercel guarda.
 *
 * Não usa `next/image`: boa parte dos escudos é SVG sem a declaração `<?xml`,
 * que o otimizador do Next 14 recusa com 400 (ver CLAUDE.md).
 */

const ARQUIVO = /^\d+\.(png|svg)$/;

export async function GET(_request: Request, { params }: { params: { arquivo: string } }) {
  // Só nome de arquivo do formato que o football-data usa. Sem isso a rota
  // viraria proxy aberto para qualquer caminho daquele servidor.
  if (!ARQUIVO.test(params.arquivo)) return new Response(null, { status: 404 });

  const resposta = await fetch(`https://crests.football-data.org/${params.arquivo}`, {
    next: { revalidate: 60 * 60 * 24 * 30 },
  }).catch(() => null);

  if (!resposta?.ok) return new Response(null, { status: 404 });

  const svg = params.arquivo.endsWith('.svg');

  return new Response(resposta.body, {
    headers: {
      'Content-Type': svg ? 'image/svg+xml' : 'image/png',
      'Cache-Control': 'public, max-age=604800, s-maxage=2592000, stale-while-revalidate=86400',
      // SVG de terceiro servido pelo nosso domínio: aberto direto na aba, não
      // roda script nenhum. Mesma regra do `next.config.mjs` para imagens.
      'Content-Security-Policy': "default-src 'none'; style-src 'unsafe-inline'; sandbox;",
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
