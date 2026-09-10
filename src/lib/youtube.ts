/**
 * Helpers do YouTube — a partir do ID do vídeo o site monta sozinho
 * o link e a capa. Nada de copiar URL de thumbnail na mão.
 *
 * O ID é o pedaço final da URL:
 *   https://www.youtube.com/watch?v=ja37DHDfGAA  ->  ja37DHDfGAA
 *   https://www.youtube.com/shorts/kYa5kVgwk7I   ->  kYa5kVgwk7I
 */

/** Página do episódio no YouTube. */
export function ytWatch(id: string): string {
  return `https://www.youtube.com/watch?v=${id}`;
}

/** Página do corte (formato Shorts). */
export function ytShort(id: string): string {
  return `https://www.youtube.com/shorts/${id}`;
}

/** Capa horizontal 16:9 do episódio, servida pelo CDN do YouTube. */
export function ytCapa(id: string): string {
  return `https://i.ytimg.com/vi/${id}/maxresdefault.jpg`;
}

/** Capa vertical 9:16 do Short (1080x1920, no enquadramento original). */
export function ytCapaVertical(id: string): string {
  return `https://i.ytimg.com/vi/${id}/oar2.jpg`;
}
