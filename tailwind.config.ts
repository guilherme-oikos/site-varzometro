import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    // src/lib precisa estar aqui: as classes das tags de clube moram em
    // site.ts. Sem esta linha o Tailwind não as encontra e elas nunca são
    // geradas — a classe fica no elemento e não existe regra nenhuma no CSS.
    './src/lib/**/*.{js,ts}',
    './content/**/*.{md,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#E07C0A',
          50: '#FEF4E7',
          100: '#FBE3C2',
          300: '#F0A94A',
          400: '#EA9427',
          500: '#E07C0A',
          600: '#C46A05',
          700: '#9A5304',
          900: '#4A2802',
        },
        ink: {
          DEFAULT: '#0F0F12',
          deep: '#0A0A0C',
          surface: '#16161B',
          elevated: '#1C1C23',
          line: '#26262E',
        },
        muted: '#A1A1AA',
        clube: {
          spfc: '#E30613',
          sccp: '#F5F5F5',
          sep: '#006437',
          sfc: '#E5E5E5',
        },
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
        display: ['var(--font-display)', 'var(--font-sans)', 'sans-serif'],
      },
      maxWidth: {
        content: '1200px',
      },
      boxShadow: {
        glow: '0 0 0 1px rgba(224,124,10,0.28), 0 12px 40px -12px rgba(224,124,10,0.35)',
        'glow-soft': '0 10px 40px -18px rgba(224,124,10,0.55)',
        card: '0 1px 0 0 rgba(255,255,255,0.04) inset',
      },
      backgroundImage: {
        'grid-dots':
          'radial-gradient(rgba(224,124,10,0.14) 1px, transparent 1px)',
        'fade-primary':
          'linear-gradient(180deg, rgba(224,124,10,0.12) 0%, rgba(15,15,18,0) 60%)',
        /*
         * Véu de legibilidade do topo. Um risco de luz passando exatamente por
         * trás do texto de apoio o derruba para ~2,8:1; o véu escurece o miolo,
         * onde mora a copy, e deixa os riscos inteiros nas laterais e embaixo.
         *
         * 60% e não 86%: com os feixes largos de antes, 86% era o necessário.
         * Com riscos finos, 60% já entrega 5,4:1 no pior caso e deixa os riscos
         * atravessarem o centro em vez de morrerem nele.
         */
        'veu-hero':
          'radial-gradient(ellipse 74% 58% at 50% 40%, rgba(15,15,18,0.6) 0%, rgba(15,15,18,0.34) 55%, rgba(15,15,18,0) 80%)',
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(14px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.6s ease-out both',
      },
      transitionTimingFunction: {
        smooth: 'cubic-bezier(0.22, 1, 0.36, 1)',
      },
    },
  },
  plugins: [],
};

export default config;
