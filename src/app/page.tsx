import Hero from '@/components/Hero';
import Pilares from '@/components/Pilares';
import Manifesto from '@/components/Manifesto';
import Bancada from '@/components/Bancada';
import SecaoMidia from '@/components/SecaoMidia';
import BlogSection from '@/components/BlogSection';

/**
 * A home é regerada de hora em hora para trazer os vídeos novos do canal
 * sem precisar republicar o site.
 */
export const revalidate = 3600;

export default function HomePage() {
  return (
    <>
      <Hero />
      <Pilares />
      <Manifesto />
      <Bancada />
      <SecaoMidia />
      <BlogSection />
    </>
  );
}
