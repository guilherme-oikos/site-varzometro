import 'server-only';
import type { Corte, Episodio } from '@/lib/site';

/**
 * Busca os vídeos do canal automaticamente, para o site se atualizar sozinho
 * conforme sobem episódios novos no YouTube.
 *
 * Dois caminhos, nessa ordem:
 *
 *  1. API oficial (se existir YOUTUBE_API_KEY) — traz duração e visualizações
 *     reais. Custa 2 unidades por atualização, com cota diária de 10.000.
 *  2. Páginas públicas do canal (sem chave nenhuma) — traz título e capa.
 *     Menos preciso, mas funciona sem configuração.
 *
 * Se os dois falharem, retorna null e a seção cai na lista manual do site.ts,
 * de modo que o site nunca fica sem conteúdo.
 */

const CANAL_ID = process.env.YOUTUBE_CHANNEL_ID ?? 'UCq6n9H-_wGp-W8NZ_KTklhA';
const CHAVE_API = process.env.YOUTUBE_API_KEY;

/** De quanto em quanto tempo o site procura vídeos novos (em segundos). */
const REVALIDAR = 3600;

/** Vídeos com até 3 minutos entram na aba de cortes. */
const LIMITE_CORTE_SEGUNDOS = 180;

const MAX_EPISODIOS = 6;
const MAX_CORTES = 8;

export type ConteudoYoutube = {
  episodios: Episodio[];
  cortes: Corte[];
  fonte: 'api' | 'paginas';
};

/* --------------------------------- Helpers -------------------------------- */

/** "MEMPHIS VOLTA - VARZÔMETRO #16" -> { numero: 'EP #16', titulo: 'Memphis volta' } */
function limparTitulo(bruto: string): { numero: string; titulo: string } {
  const semHashtags = bruto.replace(/#[\wÀ-ÿ]+/g, '').trim();
  const numero = bruto.match(/#(\d{1,3})\b/)?.[1];

  // A capitalização é mantida como está no YouTube: mexer nela quebraria
  // nomes próprios ("São Paulo" virava "são paulo").
  const titulo = semHashtags
    .replace(/[-–|]\s*VARZ[ÔO]METRO.*$/i, '')
    .replace(/VARZ[ÔO]METRO\s*[-–|]\s*/i, '')
    .replace(/\s{2,}/g, ' ')
    .replace(/[\s\-–|]+$/, '')
    .trim();

  return {
    numero: numero ? `EP #${numero}` : 'Episódio',
    titulo: titulo || bruto,
  };
}

/** Primeira frase da descrição do YouTube, sem links nem hashtags. */
function limparDescricao(bruto: string): string {
  const primeiraLinha = bruto
    .split('\n')
    .map((l) => l.trim())
    .find((l) => l.length > 25 && !l.startsWith('http'));

  if (!primeiraLinha) return '';

  const limpa = primeiraLinha.replace(/#[\wÀ-ÿ]+/g, '').replace(/\s{2,}/g, ' ').trim();
  return limpa.length > 180 ? `${limpa.slice(0, 177)}...` : limpa;
}

/** PT1H12M30S -> { segundos, rotulo: '1h 12min' } */
function converterDuracao(iso: string): { segundos: number; rotulo: string } {
  const m = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  const h = Number(m?.[1] ?? 0);
  const min = Number(m?.[2] ?? 0);
  const s = Number(m?.[3] ?? 0);
  const segundos = h * 3600 + min * 60 + s;

  const rotulo = h > 0 ? `${h}h ${String(min).padStart(2, '0')}min` : `${min}min`;
  return { segundos, rotulo };
}

/** 45900 -> '45,9 mil' */
function formatarViews(bruto: string): string {
  const n = Number(bruto);
  if (!Number.isFinite(n)) return '';
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace('.', ',')} mi`;
  if (n >= 1000) return `${(n / 1000).toFixed(1).replace('.', ',')} mil`;
  return String(n);
}

/* ------------------------------ Caminho 1: API ----------------------------- */

async function viaApi(): Promise<ConteudoYoutube | null> {
  // A playlist de uploads do canal é o próprio ID com "UC" trocado por "UU".
  const playlistUploads = `UU${CANAL_ID.slice(2)}`;

  const lista = await fetch(
    `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&maxResults=25&playlistId=${playlistUploads}&key=${CHAVE_API}`,
    { next: { revalidate: REVALIDAR } },
  );
  if (!lista.ok) return null;

  const dadosLista = await lista.json();
  const ids: string[] = (dadosLista.items ?? [])
    .map((item: any) => item.snippet?.resourceId?.videoId)
    .filter(Boolean);
  if (ids.length === 0) return null;

  const detalhes = await fetch(
    `https://www.googleapis.com/youtube/v3/videos?part=contentDetails,statistics,snippet&id=${ids.join(',')}&key=${CHAVE_API}`,
    { next: { revalidate: REVALIDAR } },
  );
  if (!detalhes.ok) return null;

  const dadosDetalhes = await detalhes.json();
  const episodios: Episodio[] = [];
  const cortes: Corte[] = [];

  for (const video of dadosDetalhes.items ?? []) {
    const { segundos, rotulo } = converterDuracao(
      video.contentDetails?.duration ?? '',
    );
    const tituloBruto: string = video.snippet?.title ?? '';

    if (segundos > 0 && segundos <= LIMITE_CORTE_SEGUNDOS) {
      if (cortes.length < MAX_CORTES) {
        cortes.push({
          titulo: tituloBruto.replace(/#[\wÀ-ÿ]+/g, '').replace(/\s{2,}/g, ' ').trim(),
          youtubeId: video.id,
          views: formatarViews(video.statistics?.viewCount ?? ''),
        });
      }
      continue;
    }

    if (episodios.length < MAX_EPISODIOS) {
      const { numero, titulo } = limparTitulo(tituloBruto);
      episodios.push({
        numero,
        titulo,
        descricao: limparDescricao(video.snippet?.description ?? ''),
        youtubeId: video.id,
        duracao: rotulo,
      });
    }
  }

  if (episodios.length === 0 && cortes.length === 0) return null;
  return { episodios, cortes, fonte: 'api' };
}

/* ------------------- Caminho 2: páginas públicas do canal ------------------ */

const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36';

/** Extrai os IDs de vídeo, na ordem em que aparecem na página do canal. */
async function idsDaPagina(caminho: 'videos' | 'shorts'): Promise<string[]> {
  const resposta = await fetch(
    `https://www.youtube.com/channel/${CANAL_ID}/${caminho}`,
    {
      headers: { 'User-Agent': UA, 'Accept-Language': 'pt-BR' },
      next: { revalidate: REVALIDAR },
    },
  );
  if (!resposta.ok) {
    console.warn(
      `[youtube] página /${caminho} respondeu HTTP ${resposta.status}`,
    );
    return [];
  }

  const html = await resposta.text();
  const encontrados = html.match(/"videoId":"[A-Za-z0-9_-]{11}"/g) ?? [];
  const ids = encontrados.map((t) => t.slice(11, -1));

  /*
   * HTTP 200 sem nenhum ID é o sintoma de bloqueio: o YouTube devolve página de
   * consentimento ou de verificação em vez da listagem. Acontece com IP de
   * datacenter (Vercel) e não acontece com IP residencial — foi assim que a
   * busca passou despercebida como quebrada em produção.
   */
  if (ids.length === 0) {
    console.warn(
      `[youtube] página /${caminho} veio sem nenhum vídeo (${Math.round(html.length / 1024)}KB). ` +
        'Provável bloqueio de IP. Configure YOUTUBE_API_KEY.',
    );
  }

  return [...new Set(ids)];
}

/** Título do vídeo pelo oEmbed público (não precisa de chave). */
async function tituloPorOembed(id: string): Promise<string | null> {
  const resposta = await fetch(
    `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${id}&format=json`,
    { next: { revalidate: REVALIDAR } },
  );
  if (!resposta.ok) return null;

  const dados = await resposta.json();
  return typeof dados.title === 'string' ? dados.title : null;
}

async function viaPaginasPublicas(): Promise<ConteudoYoutube | null> {
  const [idsVideos, idsShorts] = await Promise.all([
    idsDaPagina('videos'),
    idsDaPagina('shorts'),
  ]);

  const shorts = new Set(idsShorts);
  // A página de vídeos às vezes mistura shorts; tira os repetidos.
  const somenteEpisodios = idsVideos
    .filter((id) => !shorts.has(id))
    .slice(0, MAX_EPISODIOS);
  const somenteCortes = idsShorts.slice(0, MAX_CORTES);

  const [titulosEpisodios, titulosCortes] = await Promise.all([
    Promise.all(somenteEpisodios.map(tituloPorOembed)),
    Promise.all(somenteCortes.map(tituloPorOembed)),
  ]);

  const episodios: Episodio[] = somenteEpisodios
    .map((id, i) => ({ id, tituloBruto: titulosEpisodios[i] }))
    .filter((v): v is { id: string; tituloBruto: string } => Boolean(v.tituloBruto))
    .map(({ id, tituloBruto }) => {
      const { numero, titulo } = limparTitulo(tituloBruto);
      return { numero, titulo, descricao: '', youtubeId: id };
    });

  const cortes: Corte[] = somenteCortes
    .map((id, i) => ({ id, tituloBruto: titulosCortes[i] }))
    .filter((v): v is { id: string; tituloBruto: string } => Boolean(v.tituloBruto))
    .map(({ id, tituloBruto }) => ({
      titulo: tituloBruto.replace(/#[\wÀ-ÿ]+/g, '').replace(/\s{2,}/g, ' ').trim(),
      youtubeId: id,
    }));

  if (episodios.length === 0 && cortes.length === 0) return null;
  return { episodios, cortes, fonte: 'paginas' };
}

/* ---------------------------------- Público -------------------------------- */

/*
 * Qualquer que seja o caminho, o resultado é registrado no log do servidor.
 *
 * Isso existe por causa de um incidente real: a busca sem chave parou de
 * funcionar em produção (bloqueio de IP de datacenter), o site caiu na lista
 * manual do site.ts e **ninguém percebeu** — porque a queda era silenciosa. O
 * cliente só notou dias depois, quando um vídeo novo não apareceu.
 *
 * Falhar é aceitável; falhar sem deixar rastro não é.
 */
export async function buscarConteudoYoutube(): Promise<ConteudoYoutube | null> {
  try {
    if (CHAVE_API) {
      const viaChave = await viaApi();
      if (viaChave) {
        console.log(
          `[youtube] ok pela API: ${viaChave.episodios.length} episódios, ${viaChave.cortes.length} cortes`,
        );
        return viaChave;
      }
      console.warn('[youtube] API com chave falhou; tentando páginas públicas');
    } else {
      console.warn(
        '[youtube] sem YOUTUBE_API_KEY. O caminho sem chave é bloqueado por IP ' +
          'de datacenter e tende a falhar em produção.',
      );
    }

    const viaPaginas = await viaPaginasPublicas();
    if (viaPaginas) {
      console.log(
        `[youtube] ok pelas páginas públicas: ${viaPaginas.episodios.length} episódios, ${viaPaginas.cortes.length} cortes`,
      );
      return viaPaginas;
    }

    console.error(
      '[youtube] nenhum caminho funcionou. O site vai mostrar as listas ' +
        'manuais do site.ts, que não se atualizam sozinhas.',
    );
    return null;
  } catch (erro) {
    console.error('[youtube] falha ao buscar vídeos do canal:', erro);
    return null;
  }
}
