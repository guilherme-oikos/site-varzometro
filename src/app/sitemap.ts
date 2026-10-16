import type { MetadataRoute } from 'next';
import { dataIso, getAllPosts } from '@/lib/posts';
import { site } from '@/lib/site';

/**
 * Gerado a cada build a partir de `content/posts/`: artigo novo entra aqui
 * sozinho, sem ninguém mexer neste arquivo.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const todos = getAllPosts();

  const posts = todos.map((post) => ({
    url: `${site.url}/blog/${post.slug}`,
    lastModified: dataIso(post.date),
    changeFrequency: 'monthly' as const,
    priority: 0.7,
  }));

  // A listagem do blog só muda quando sai artigo novo, então a data dela é a
  // do artigo mais recente. Sem artigo nenhum, vale a data do build.
  const ultimoArtigo = todos[0] ? dataIso(todos[0].date) : new Date();

  return [
    {
      // A home é regerada de hora em hora com os vídeos do canal.
      url: site.url,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${site.url}/blog`,
      lastModified: ultimoArtigo,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${site.url}/politica-de-privacidade`,
      changeFrequency: 'yearly',
      priority: 0.2,
    },
    ...posts,
  ];
}
