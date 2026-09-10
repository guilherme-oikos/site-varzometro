import Link from 'next/link';
import PostCard from '@/components/PostCard';
import SectionHeading from '@/components/SectionHeading';
import { ArrowRightIcon, PenIcon } from '@/components/Icons';
import { getAllPosts } from '@/lib/posts';

export default function BlogSection() {
  const posts = getAllPosts().slice(0, 3);

  return (
    <section id="blog" className="relative scroll-mt-24 py-20 sm:py-28">
      <div className="container-page">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <SectionHeading
            align="left"
            title={
              <>
                Blog do <span className="text-primary">VARzômetro</span>
              </>
            }
            description="Artigos semanais sobre o momento dos 4 grandes de São Paulo, para ler a qualquer hora."
          />

          <Link
            href="/blog"
            className="btn-ghost shrink-0 self-start !py-3 sm:self-auto"
          >
            Ver todos os artigos
            <ArrowRightIcon className="h-4 w-4" />
          </Link>
        </div>

        {posts.length > 0 ? (
          <div className="revelar mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {posts.map((post) => (
              <PostCard key={post.slug} post={post} />
            ))}
          </div>
        ) : (
          <div className="card mt-12 flex flex-col items-center gap-3 p-12 text-center">
            <PenIcon className="h-8 w-8 text-primary" />
            <p className="text-base font-bold text-white">
              Nenhum artigo publicado ainda.
            </p>
            <p className="max-w-sm text-sm text-muted">
              Adicione um arquivo <code className="text-primary">.md</code> em{' '}
              <code className="text-primary">/content/posts</code> e ele aparece
              aqui automaticamente.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
