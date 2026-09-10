import CarrosselMidia from '@/components/CarrosselMidia';
import { buscarConteudoYoutube } from '@/lib/youtube-feed';
import { cortes as cortesManuais, episodios as episodiosManuais } from '@/lib/site';

/**
 * Busca os vídeos do canal no servidor e entrega prontos para as abas.
 *
 * A página é regerada de hora em hora (ver REVALIDAR em youtube-feed.ts),
 * então episódio novo no YouTube aparece aqui sozinho — sem republicar o site.
 * Se a busca falhar, entram as listas manuais de src/lib/site.ts.
 */
export default async function SecaoMidia() {
  const doCanal = await buscarConteudoYoutube();

  const episodios = doCanal?.episodios.length
    ? doCanal.episodios
    : episodiosManuais;
  const cortes = doCanal?.cortes.length ? doCanal.cortes : cortesManuais;

  return <CarrosselMidia episodios={episodios} cortes={cortes} />;
}
