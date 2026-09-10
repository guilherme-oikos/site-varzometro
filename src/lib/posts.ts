import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import type { ClubeSigla } from '@/lib/site';
import { publicFileExists } from '@/lib/media';

const POSTS_DIR = path.join(process.cwd(), 'content', 'posts');

/**
 * Capa de reserva: artigo sem `cover` no cabeçalho recebe esta arte. Serve para
 * o blog nunca ter card sem imagem, sem obrigar quem escreve a arrumar uma
 * imagem para cada texto.
 */
export const CAPA_PADRAO = '/blog/capa-padrao.svg';

/**
 * Imagem de prévia ao compartilhar um artigo sem capa própria.
 *
 * Não é a `CAPA_PADRAO`: ela é SVG, e WhatsApp e Facebook não renderizam SVG em
 * prévia de link — o compartilhamento sairia sem imagem nenhuma. Esta é a arte
 * do site em JPG.
 */
export const OG_PADRAO = '/og.jpg';

export type PostMeta = {
  slug: string;
  title: string;
  excerpt: string;
  date: string;
  dateLabel: string;
  author: string;
  clube: ClubeSigla;
  /** Caminho da capa em /public, já validado (ex.: '/blog/classico.jpg'). */
  cover?: string;
  /** Texto alternativo da capa, para leitores de tela. Cai no título se vazio. */
  coverAlt?: string;
  /**
   * A capa é a arte de reserva, e não uma imagem daquele artigo. Muda duas
   * coisas: a legenda embaixo da capa some (arte genérica não é legenda), e a
   * prévia de compartilhamento usa `OG_PADRAO` em vez do SVG.
   */
  capaPadrao: boolean;
  tags: string[];
  readingTime: string;
};

export type Post = PostMeta & {
  content: string;
};

/** Estima o tempo de leitura em minutos (base de 200 palavras/min). */
function calcReadingTime(content: string): string {
  const words = content.trim().split(/\s+/).filter(Boolean).length;
  const minutes = Math.max(1, Math.ceil(words / 200));
  return `${minutes} min de leitura`;
}

function formatDate(date: string): string {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(date));
}

function readPostFile(fileName: string): Post {
  const slug = fileName.replace(/\.mdx?$/, '');
  const raw = fs.readFileSync(path.join(POSTS_DIR, fileName), 'utf8');
  const { data, content } = matter(raw);

  // A capa só entra se o arquivo existir mesmo em /public. Assim um caminho
  // digitado errado no cabeçalho não vira imagem quebrada no ar — ele cai na
  // arte de reserva, igual a quem não declarou capa nenhuma.
  //
  // A reserva também é verificada: se um dia o SVG sumir de /public, o card
  // volta a aparecer sem capa em vez de pedir uma imagem que não existe.
  const declarada = data.cover ? String(data.cover) : undefined;
  const capaDeclarada = publicFileExists(declarada) ? declarada : undefined;
  const reserva = publicFileExists(CAPA_PADRAO) ? CAPA_PADRAO : undefined;

  const capa = capaDeclarada ?? reserva;
  const capaPadrao = Boolean(capa) && capa === reserva;

  return {
    slug,
    title: String(data.title ?? slug),
    excerpt: String(data.excerpt ?? ''),
    date: String(data.date ?? new Date().toISOString().slice(0, 10)),
    dateLabel: formatDate(String(data.date ?? new Date().toISOString())),
    author: String(data.author ?? 'Bancada VARzômetro'),
    clube: (data.clube ?? 'SPFC') as ClubeSigla,
    cover: capa,
    coverAlt: data.coverAlt ? String(data.coverAlt) : undefined,
    capaPadrao,
    tags: Array.isArray(data.tags) ? data.tags.map(String) : [],
    readingTime: calcReadingTime(content),
    content,
  };
}

/** Lista todos os posts publicados, do mais recente para o mais antigo. */
export function getAllPosts(): Post[] {
  if (!fs.existsSync(POSTS_DIR)) return [];

  return fs
    .readdirSync(POSTS_DIR)
    .filter((file) => /\.mdx?$/.test(file))
    .map(readPostFile)
    .sort((a, b) => (a.date < b.date ? 1 : -1));
}

export function getPostSlugs(): string[] {
  return getAllPosts().map((post) => post.slug);
}

export function getPostBySlug(slug: string): Post | undefined {
  return getAllPosts().find((post) => post.slug === slug);
}

/** Posts relacionados: mesmo clube primeiro, completando com os mais recentes. */
export function getRelatedPosts(slug: string, limit = 3): PostMeta[] {
  const all = getAllPosts();
  const current = all.find((post) => post.slug === slug);
  if (!current) return all.slice(0, limit);

  const sameClub = all.filter(
    (post) => post.slug !== slug && post.clube === current.clube,
  );
  const others = all.filter(
    (post) => post.slug !== slug && post.clube !== current.clube,
  );

  return [...sameClub, ...others].slice(0, limit);
}
