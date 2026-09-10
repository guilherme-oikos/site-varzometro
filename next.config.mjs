/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    // Necessário para os placeholders locais em SVG (logo, capas provisórias).
    // Seguro aqui: o otimizador só aceita imagens locais e os domínios abaixo,
    // e serve o SVG isolado em sandbox, sem execução de script.
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    remotePatterns: [
      { protocol: 'https', hostname: 'i.ytimg.com' },
      { protocol: 'https', hostname: 'img.youtube.com' },
    ],
  },
};

export default nextConfig;
