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

  const usouReservaEpisodios = !doCanal?.episodios.length;
  const usouReservaCortes = !doCanal?.cortes.length;

  // A reserva é rede de segurança, não estado normal: se ela entrou, o site
  // parou de se atualizar sozinho e isso precisa aparecer no log.
  if (usouReservaEpisodios || usouReservaCortes) {
    console.warn(
      '[midia] usando lista manual do site.ts para ' +
        [
          usouReservaEpisodios ? 'episódios' : null,
          usouReservaCortes ? 'cortes' : null,
        ]
          .filter(Boolean)
          .join(' e ') +
        '. Vídeo novo no canal NÃO vai aparecer sozinho.',
    );
  }

  const episodios = usouReservaEpisodios ? episodiosManuais : doCanal!.episodios;
  const cortes = usouReservaCortes ? cortesManuais : doCanal!.cortes;

  return <CarrosselMidia episodios={episodios} cortes={cortes} />;
}
