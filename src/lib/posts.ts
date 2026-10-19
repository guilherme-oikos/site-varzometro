import 'server-only';
import fs from 'fs';
import path from 'path';
import { cache } from 'react';
import matter from 'gray-matter';
import type { ClubeSigla, Convidado } from '@/lib/site';
import { autoresDoBlog, siglaDeClube } from '@/lib/site';
import { publicFileExists } from '@/lib/media';
import { supabaseConfigurado } from '@/lib/supabase/config';
import { supabasePublico } from '@/lib/supabase/publico';

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
  /** Clube do artigo. Ausente quando o texto é sobre o futebol como um todo. */
  clube?: ClubeSigla;
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

/**
 * Data do artigo em ISO 8601 com o fuso de Brasília, para quem lê máquina:
 * sitemap, `article:published_time` e o JSON-LD.
 *
 * O campo `date` aceita `'2026-09-17'` ou `'2026-09-17 15:00'`, que não são
 * ISO. Passar isso cru para `new Date()` deixa o fuso por conta do servidor —
 * na Vercel é UTC, e um artigo das 22h sairia datado do dia seguinte. Sem hora,
 * vale meio-dia: longe o bastante da meia-noite para nenhum fuso virar o dia.
 */
export function dataIso(date: string): string {
  const [dia, hora = '12:00'] = date.split(' ');
  return `${dia}T${hora}:00-03:00`;
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

/** O que cada fonte (arquivo ou banco) entrega antes de virar `Post`. */
type Bruto = {
  slug: string;
  title: string;
  excerpt: string;
  date: string;
  author: string;
  perfil?: Pick<Convidado, 'foto' | 'fotoBlog' | 'iniciais'>;
  clube?: ClubeSigla;
  cover?: string;
  coverAlt?: string;
  coverCredito?: string;
  tags: string[];
  content: string;
};

function montarPost(bruto: Bruto): Post {
  // A capa só entra se o arquivo existir mesmo em /public. Assim um caminho
  // digitado errado no cabeçalho não vira imagem quebrada no ar — ele cai na
  // arte de reserva, igual a quem não declarou capa nenhuma. URL do Storage do
  // Supabase passa direto (ver `publicFileExists`).
  //
  // A reserva também é verificada: se um dia o SVG sumir de /public, o card
  // volta a aparecer sem capa em vez de pedir uma imagem que não existe.
  const capaDeclarada = publicFileExists(bruto.cover) ? bruto.cover : undefined;
  const reserva = publicFileExists(CAPA_PADRAO) ? CAPA_PADRAO : undefined;

  const capa = capaDeclarada ?? reserva;
  const capaPadrao = Boolean(capa) && capa === reserva;
  const { perfil } = bruto;

  return {
    slug: bruto.slug,
    title: bruto.title || bruto.slug,
    excerpt: bruto.excerpt,
    date: bruto.date,
    dateLabel: formatDate(bruto.date),
    author: bruto.author,
    clube: bruto.clube,
    cover: capa,
    coverAlt: bruto.coverAlt || undefined,
    coverCredito: bruto.coverCredito || undefined,
    capaPadrao,
    autorFoto: [perfil?.fotoBlog, perfil?.foto].find((foto) => publicFileExists(foto)),
    autorIniciais: perfil?.iniciais ?? iniciaisDoNome(bruto.author),
    tags: bruto.tags,
    readingTime: calcReadingTime(bruto.content),
    content: bruto.content,
  };
}

/* ------------------------------------------------- Fonte 1: content/posts -- */

/*
 * Reserva para desenvolvimento sem Supabase configurado. Em produção os artigos
 * vêm do banco; estes arquivos foram copiados para lá pelo
 * `scripts/migrar-para-supabase.ts`.
 */
function readPostFile(fileName: string): Post {
  const slug = fileName.replace(/\.mdx?$/, '');
  const raw = fs.readFileSync(path.join(POSTS_DIR, fileName), 'utf8');
  const { data, content } = matter(raw);

  const autor = String(data.author ?? 'Bancada VARzômetro');

  return montarPost({
    slug,
    title: String(data.title ?? slug),
    excerpt: String(data.excerpt ?? ''),
    date: normalizarData(data.date),
    author: autor,
    // Procura na bancada e nos convidados: quem escreve no blog não é
    // necessariamente integrante do programa.
    perfil: autoresDoBlog.find((pessoa) => pessoa.nome === autor),
    clube: siglaDeClube(data.clube),
    cover: data.cover ? String(data.cover) : undefined,
    coverAlt: data.coverAlt ? String(data.coverAlt) : undefined,
    coverCredito: data.coverCredito ? String(data.coverCredito) : undefined,
    tags: Array.isArray(data.tags) ? data.tags.map(String) : [],
    content,
  });
}

function postsDosArquivos(): Post[] {
  if (!fs.existsSync(POSTS_DIR)) return [];

  return fs
    .readdirSync(POSTS_DIR)
    .filter((file) => /\.mdx?$/.test(file))
    .map(readPostFile);
}

/* ------------------------------------------------------ Fonte 2: Supabase -- */

/**
 * `publicado_em` vem em UTC; o resto do arquivo trabalha com o texto
 * `'AAAA-MM-DD HH:MM'` no horário de Brasília (ver `normalizarData`). O sueco
 * (`sv-SE`) é o único locale que já formata nesse desenho.
 */
const horarioDeBrasilia = new Intl.DateTimeFormat('sv-SE', {
  timeZone: 'America/Sao_Paulo',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
});

type LinhaArtigo = {
  slug: string;
  titulo: string;
  resumo: string;
  conteudo: string;
  clube: string | null;
  capa_url: string | null;
  capa_alt: string | null;
  capa_credito: string | null;
  tags: string[] | null;
  publicado_em: string;
  autor: {
    nome: string;
    iniciais: string;
    foto_url: string | null;
    foto_blog_url: string | null;
  } | null;
};

async function postsDoBanco(): Promise<Post[]> {
  const { data, error } = await supabasePublico()
    .from('artigos')
    .select(
      'slug, titulo, resumo, conteudo, clube, capa_url, capa_alt, capa_credito, tags, publicado_em, ' +
        'autor:perfis!artigos_autor_id_fkey (nome, iniciais, foto_url, foto_blog_url)',
    )
    .eq('status', 'publicado')
    .not('slug', 'is', null)
    .returns<LinhaArtigo[]>();

  /*
   * Erro sobe em vez de virar lista vazia. Na revalidação, o Next mantém no ar
   * a última versão boa da página; no build, o deploy falha e o anterior
   * continua servindo. Lista vazia publicaria um blog sem artigo nenhum.
   */
  if (error) {
    console.error(`[posts] Supabase recusou a consulta: ${error.message}`);
    throw new Error(`[posts] falha ao ler artigos do Supabase: ${error.message}`);
  }

  console.info(`[posts] ${data.length} artigos lidos do Supabase.`);

  return data.map((linha) =>
    montarPost({
      slug: linha.slug,
      title: linha.titulo,
      excerpt: linha.resumo,
      date: horarioDeBrasilia.format(new Date(linha.publicado_em)),
      author: linha.autor?.nome ?? 'Bancada VARzômetro',
      perfil: linha.autor
        ? {
            iniciais: linha.autor.iniciais,
            foto: linha.autor.foto_url ?? undefined,
            fotoBlog: linha.autor.foto_blog_url ?? undefined,
          }
        : undefined,
      clube: siglaDeClube(linha.clube),
      cover: linha.capa_url ?? undefined,
      coverAlt: linha.capa_alt ?? undefined,
      coverCredito: linha.capa_credito ?? undefined,
      tags: linha.tags ?? [],
      content: linha.conteudo,
    }),
  );
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
export const getAllPosts = cache(async (): Promise<Post[]> => {
  const posts = supabaseConfigurado ? await postsDoBanco() : postsDosArquivos();
  return posts.sort((a, b) => b.date.localeCompare(a.date) || a.slug.localeCompare(b.slug));
});

export async function getPostSlugs(): Promise<string[]> {
  return (await getAllPosts()).map((post) => post.slug);
}

export async function getPostBySlug(slug: string): Promise<Post | undefined> {
  return (await getAllPosts()).find((post) => post.slug === slug);
}

/** Posts relacionados: mesmo clube primeiro, completando com os mais recentes. */
export async function getRelatedPosts(slug: string, limit = 3): Promise<PostMeta[]> {
  const all = await getAllPosts();
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
