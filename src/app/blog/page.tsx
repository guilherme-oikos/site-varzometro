import type { Metadata } from 'next';
import BlogList from '@/components/BlogList';
import { getAllPosts } from '@/lib/posts';

export const metadata: Metadata = {
  title: 'Blog & Opinião',
  description:
    'Análises escritas e artigos semanais sobre o momento do São Paulo, Corinthians, Palmeiras e Santos — direto da bancada do VARzômetro.',
  alternates: { canonical: '/blog' },
};

export default function BlogPage() {
  const posts = getAllPosts();

  return (
    <section className="relative pb-24 pt-28 sm:pt-36">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-80 bg-fade-primary"
      />

      <div className="container-page relative">
        <h1 className="t-page mt-4 max-w-3xl text-balance text-white">
          Análises escritas sobre os{' '}
          <span className="text-primary">4 grandes de SP</span>
        </h1>

        <p className="t-lead medida-apoio mt-5 text-muted">
          Artigos semanais da bancada sobre o momento de cada clube. Mesma
          resenha do podcast, agora para ler com calma.
        </p>

        <div className="mt-12">
          <BlogList posts={posts} />
        </div>
      </div>
    </section>
  );
}
