import type { Metadata, Viewport } from 'next';
import { Plus_Jakarta_Sans } from 'next/font/google';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import FloatingCTA from '@/components/FloatingCTA';
import { site, socials } from '@/lib/site';
import './globals.css';

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  display: 'swap',
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-sans',
});

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: `${site.name} | O hub do futebol paulista sem filtro`,
    template: `%s | ${site.name}`,
  },
  description: site.description,
  keywords: [
    'futebol paulista',
    'podcast de futebol',
    'São Paulo FC',
    'Corinthians',
    'Palmeiras',
    'Santos',
    'Paulistão',
    'análise da rodada',
    'VARzômetro',
  ],
  authors: [{ name: site.name }],
  creator: site.name,
  openGraph: {
    type: 'website',
    locale: 'pt_BR',
    url: site.url,
    siteName: site.name,
    title: `${site.name} | O hub do futebol paulista sem filtro`,
    description: site.description,
    images: [{ url: '/og.jpg', width: 1200, height: 630, alt: site.name }],
  },
  twitter: {
    card: 'summary_large_image',
    title: `${site.name} | O hub do futebol paulista sem filtro`,
    description: site.description,
    images: ['/og.jpg'],
  },
  icons: {
    icon: site.icone,
    apple: site.icone,
  },
  alternates: { canonical: '/' },
};

export const viewport: Viewport = {
  themeColor: '#0F0F12',
  width: 'device-width',
  initialScale: 1,
  // Sem isto, o env(safe-area-inset-*) que a barra fixa usa resolve como 0
  // e ela fica embaixo da barra de gestos do iPhone.
  viewportFit: 'cover',
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'PodcastSeries',
  name: site.name,
  description: site.description,
  url: site.url,
  inLanguage: 'pt-BR',
  genre: ['Esportes', 'Futebol'],
  sameAs: [socials.youtube, socials.spotify, socials.tiktok, socials.instagram],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" className={jakarta.variable}>
      <body className="min-h-screen bg-ink font-sans">
        <a
          href="#conteudo"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:font-bold focus:text-white"
        >
          Pular para o conteúdo
        </a>

        <Header />
        <main id="conteudo">{children}</main>
        <Footer />
        <FloatingCTA />

        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </body>
    </html>
  );
}
