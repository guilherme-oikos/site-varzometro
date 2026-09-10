'use client';

import { useMemo, useState } from 'react';
import PostCard from '@/components/PostCard';
import { clubes, type ClubeSigla } from '@/lib/site';
import type { PostMeta } from '@/lib/posts';

type Filtro = ClubeSigla | 'TODOS';

const ordem: Filtro[] = ['TODOS', 'SPFC', 'SCCP', 'SEP', 'SFC'];

export default function BlogList({ posts }: { posts: PostMeta[] }) {
  const [filtro, setFiltro] = useState<Filtro>('TODOS');

  const visiveis = useMemo(
    () => (filtro === 'TODOS' ? posts : posts.filter((p) => p.clube === filtro)),
    [filtro, posts],
  );

  return (
    <>
      <div
        role="group"
        aria-label="Filtrar artigos por clube"
        className="no-scrollbar -mx-5 flex gap-2 overflow-x-auto px-5 sm:mx-0 sm:flex-wrap sm:px-0"
      >
        {ordem.map((item) => {
          const ativo = filtro === item;
          const total =
            item === 'TODOS'
              ? posts.length
              : posts.filter((post) => post.clube === item).length;

          return (
            <button
              key={item}
              type="button"
              onClick={() => setFiltro(item)}
              aria-pressed={ativo}
              className={`toque inline-flex shrink-0 items-center rounded-xl border px-4 py-2.5 text-xs font-bold transition-all duration-200 ease-smooth ${
                ativo
                  ? 'border-primary bg-primary text-ink'
                  : 'border-ink-line bg-ink-surface text-muted hover:border-primary/40 hover:text-white'
              }`}
            >
              {item === 'TODOS' ? 'Todos' : clubes[item].nome}
              <span
                className={`numerico ml-1.5 ${ativo ? 'text-ink/70' : 'text-muted'}`}
              >
                {total}
              </span>
            </button>
          );
        })}
      </div>

      {visiveis.length > 0 ? (
        <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {visiveis.map((post) => (
            <PostCard key={post.slug} post={post} />
          ))}
        </div>
      ) : (
        <p className="card mt-10 p-12 text-center text-sm text-muted">
          Ainda não temos artigos publicados sobre esse clube. Em breve tem.
        </p>
      )}
    </>
  );
}
