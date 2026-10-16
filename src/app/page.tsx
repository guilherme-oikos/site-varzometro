import Hero from '@/components/Hero';
import Pilares from '@/components/Pilares';
import Manifesto from '@/components/Manifesto';
import Bancada from '@/components/Bancada';
import SecaoMidia from '@/components/SecaoMidia';
import BlogSection from '@/components/BlogSection';
import { site, socials } from '@/lib/site';

/**
 * A home é regerada de hora em hora para trazer os vídeos novos do canal
 * sem precisar republicar o site.
 */
export const revalidate = 3600;

/*
 * Dados estruturados do podcast. Ficam só na home: no layout, saíam também em
 * cada artigo do blog, e a página do artigo passava a dizer ao Google que era
 * duas coisas ao mesmo tempo.
 */
const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'PodcastSeries',
  name: `${site.name} Podcast`,
  alternateName: site.name,
  description: site.description,
  url: site.url,
  image: `${site.url}/og.jpg`,
  inLanguage: 'pt-BR',
  genre: ['Esportes', 'Futebol'],
  sameAs: [socials.youtube, socials.spotify, socials.instagram, socials.tiktok],
};

export default function HomePage() {
  return (
    <>
      <Hero />
      <Pilares />
      <Manifesto />
      <Bancada />
      <SecaoMidia />
      <BlogSection />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </>
  );
}
