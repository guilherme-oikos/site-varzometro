import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import type { ClubeSigla } from '@/lib/site';
import { autoresDoBlog } from '@/lib/site';
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
   * Crédito da foto (ex.: 'Juan Mabromata / AFP'). Aparece junto da legenda, na
   * página do artigo. Fica separado do `coverAlt` de propósito: o alternativo
   * descreve a cena para quem não enxerga, e ouvir o nome do fotógrafo no meio
   * da descrição não ajuda ninguém.
   *
   * Crédito não substitui licença. Foto de agência (AFP, Getty, Reuters) exige
   * contrato — ver README.
   */
  coverCredito?: string;
  /**
   * A capa é a arte de reserva, e não uma imagem daquele artigo. Muda duas
   * coisas: a legenda embaixo da capa some (arte genérica não é legenda), e a
   * prévia de compartilhamento usa `OG_PADRAO` em vez do SVG.
   */
  capaPadrao: boolean;
  /**
   * Foto do autor, quando ele está em `autoresDoBlog` e o arquivo existe em
   * /public.
   *
   * Resolvida aqui, e não no componente: `PostCard` é renderizado dentro de
   * `BlogList`, que é 'use client'. Checar existência de arquivo lá dentro
   * puxaria `fs` para o bundle do navegador e quebraria o build.
   */
  autorFoto?: string;
  /** Iniciais para quando não há foto. Vêm do perfil do autor; se ele não tiver
   * perfil cadastrado, são derivadas do nome. */
  autorIniciais: string;
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

/**
 * Normaliza o campo `date` do cabeçalho para texto comparável.
 *
 * Aceita `'2026-09-17'` e também `'2026-09-17 15:00'` — a hora é opcional e
 * serve só para desempatar dois artigos do mesmo dia (ver a ordenação em
 * getAllPosts). Sem aspas no arquivo, o YAML transforma a data em objeto Date;
 * por isso o caso é tratado aqui em vez de virar "Thu Sep 17 2026..." na tela.
 */
function normalizarData(bruto: unknown): string {
  if (bruto instanceof Date) return bruto.toISOString().slice(0, 16).replace('T', ' ');
  return String(bruto ?? new Date().toISOString().slice(0, 10)).trim();
}

/** Só a parte da data importa na tela: a hora nunca é exibida. */
function formatDate(date: string): string {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(date.slice(0, 10)));
}

/**
 * Iniciais de quem não tem perfil cadastrado (autor de fora, ou nome digitado
 * diferente no cabeçalho). Duas palavras viram duas iniciais; uma palavra vira
 * as duas primeiras letras.
 *
 * O separador é `\s+`, espaço. Já esteve escrito `/s+/`, que divide o nome pela
 * letra "s": "José Santos" saía como "Jé".
 */
function iniciaisDoNome(nome: string): string {
  const partes = nome.trim().split(/\s+/).filter(Boolean);
  if (partes.length >= 2) {
    return (partes[0][0] + partes[1][0]).toUpperCase();
  }
  return nome.trim().slice(0, 2).toUpperCase();
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

  const autor = String(data.author ?? 'Bancada VARzômetro');
  // Procura na bancada e nos convidados: quem escreve no blog não é
  // necessariamente integrante do programa.
  const perfil = autoresDoBlog.find((pessoa) => pessoa.nome === autor);

  const capa = capaDeclarada ?? reserva;
  const capaPadrao = Boolean(capa) && capa === reserva;

  return {
    slug,
    title: String(data.title ?? slug),
    excerpt: String(data.excerpt ?? ''),
    date: normalizarData(data.date),
    dateLabel: formatDate(normalizarData(data.date)),
    author: autor,
    clube: (data.clube ?? 'SPFC') as ClubeSigla,
    cover: capa,
    coverAlt: data.coverAlt ? String(data.coverAlt) : undefined,
    coverCredito: data.coverCredito ? String(data.coverCredito) : undefined,
    capaPadrao,
    autorFoto: publicFileExists(perfil?.foto) ? perfil?.foto : undefined,
    autorIniciais: perfil?.iniciais ?? iniciaisDoNome(autor),
    tags: Array.isArray(data.tags) ? data.tags.map(String) : [],
    readingTime: calcReadingTime(content),
    content,
  };
}

/**
 * Lista todos os posts publicados, do mais recente para o mais antigo.
 *
 * A comparação é de texto, não de Date: `'2026-09-17 15:00'` vem depois de
 * `'2026-09-17'` porque é mais longo com o mesmo começo — ou seja, artigo sem
 * hora conta como início do dia. Isso evita converter fuso horário só para
 * ordenar, que é onde a data de um artigo muda de dia sozinha.
 *
 * O desempate final pelo slug existe para o resultado não depender do algoritmo
 * de ordenação do Node. A versão anterior nunca devolvia 0 para datas iguais, e
 * dois artigos do mesmo dia saíam em ordem imprevisível.
 */
export function getAllPosts(): Post[] {
  if (!fs.existsSync(POSTS_DIR)) return [];

  return fs
    .readdirSync(POSTS_DIR)
    .filter((file) => /\.mdx?$/.test(file))
    .map(readPostFile)
    .sort((a, b) => b.date.localeCompare(a.date) || a.slug.localeCompare(b.slug));
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
