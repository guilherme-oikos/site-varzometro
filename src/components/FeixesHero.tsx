'use client';

import { useEffect, useRef } from 'react';

/*
 * Feixes de luz atrás do topo.
 *
 * Adaptado de "Beams Background", de Dorian Baffier (kokonutui.com, MIT).
 * O desenho é o mesmo; o que mudou foi tudo que custava caro ou não servia
 * a este site:
 *
 * - Sem `motion/react`. As duas animações do original (uma opacidade pulsando
 *   e a entrada de um <h1> de demonstração) não justificavam uma biblioteca
 *   de animação num projeto que não tem nenhuma.
 * - Sem `ctx.filter = blur()`. No original ele roda por feixe, por quadro —
 *   30 desfoques a cada frame. Aqui é um só, em CSS, na camada inteira.
 * - Sem `backdrop-filter`. Era a coisa mais cara do arquivo e desfocava um
 *   canvas que já estava desfocado.
 * - Buffer a 55% do tamanho em CSS, e não a `devicePixelRatio`. Com tudo
 *   borrado, resolução cheia não aparece na tela — só na conta.
 * - Coordenadas em pixels de CSS. O original posicionava os feixes com
 *   `canvas.width` (pixels de dispositivo) sobre um contexto já escalado por
 *   dpr: em tela 3x, a maioria nascia fora do enquadramento.
 * - Sem detecção de tema claro. Este site é escuro, ponto.
 * - O laço para: fora da tela e com a aba em segundo plano.
 */

/*
 * Fator do buffer em relação ao tamanho em CSS.
 *
 * Sobe para 0,8 na versão de riscos finos: com feixes de 10 a 40px e desfoque
 * de 10px, buffer baixo apareceria como serrilhado na borda. E mesmo assim sai
 * mais barato que a versão de manchas — a largura somada dos feixes caiu de
 * ~4060px para ~275px, e a área pintada é o que custa.
 */
const RESOLUCAO = 0.8;

/*
 * Teto de 60fps. Na versão de manchas o laço rodava a 30, porque cada quadro
 * pintava ~4060px de largura de feixe; agora pinta ~275px, cerca de um oitavo
 * do custo, e risco fino é justamente o que denuncia judder — vale gastar os
 * quadros aqui. O teto continua existindo para monitor de 144Hz não pintar
 * mais do que precisa.
 *
 * Tudo aqui anda em unidade por SEGUNDO, nunca por quadro. A primeira versão
 * usava incremento por quadro com o laço já a 30fps: metade dos quadros virou
 * metade da velocidade, os feixes levavam quase um minuto para atravessar o
 * topo e o efeito parecia desligado. Com o tempo real na conta, mudar a taxa
 * não muda mais a velocidade de nada.
 */
const INTERVALO_MS = 1000 / 60;

/** Teto do passo de tempo: protege contra um salto ao voltar de uma pausa. */
const PASSO_MAXIMO_MS = 100;

/* Matiz em volta do laranja da casa: #E07C0A é hsl(32, 91%, 46%). */
const MATIZ_BASE = 22;
const MATIZ_FAIXA = 22;
const SATURACAO = 88;
const LUMINOSIDADE = 60;

type Feixe = {
  x: number;
  y: number;
  largura: number;
  comprimento: number;
  angulo: number;
  /** Pixels por segundo. */
  velocidade: number;
  opacidade: number;
  matiz: number;
  pulso: number;
  /** Radianos por segundo. */
  pulsoVelocidade: number;
};

/** Pixels por segundo: um feixe atravessa o topo em ~10 a 22 segundos. */
const VELOCIDADE_MIN = 42;
const VELOCIDADE_FAIXA = 52;

/** Radianos por segundo: cada feixe respira uma vez a cada 2,6 a 6 segundos. */
const PULSO_MIN = 1;
const PULSO_FAIXA = 1.4;

function criarFeixe(
  largura: number,
  altura: number,
  indice: number,
  total: number,
): Feixe {
  return {
    x: Math.random() * largura * 1.4 - largura * 0.2,
    y: Math.random() * altura * 1.6 - altura * 0.3,
    largura: 10 + Math.random() * 30,
    comprimento: altura * 2.4,
    angulo: -32 + Math.random() * 12,
    velocidade: VELOCIDADE_MIN + Math.random() * VELOCIDADE_FAIXA,
    opacidade: 0.28 + Math.random() * 0.3,
    matiz: MATIZ_BASE + (indice * MATIZ_FAIXA) / total,
    pulso: Math.random() * Math.PI * 2,
    pulsoVelocidade: PULSO_MIN + Math.random() * PULSO_FAIXA,
  };
}

/*
 * Botão de calibragem, como no original (`intensity`). Está aqui para dar para
 * ajustar a presença dos feixes do `Hero` sem abrir o canvas:
 *
 *   <FeixesHero intensidade="media" />
 */
const INTENSIDADES = { sutil: 0.65, media: 0.82, forte: 1 } as const;

type Intensidade = keyof typeof INTENSIDADES;

export default function FeixesHero({
  intensidade = 'forte',
}: {
  intensidade?: Intensidade;
}) {
  const hospedeiroRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const fator = INTENSIDADES[intensidade];

    const hospedeiro = hospedeiroRef.current;
    const canvas = canvasRef.current;
    if (!hospedeiro || !canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const semMovimento = window.matchMedia('(prefers-reduced-motion: reduce)');

    let feixes: Feixe[] = [];
    let largura = 0;
    let altura = 0;
    let quadro: number | null = null;
    let ultimo = 0;
    let naTela = true;

    function desenharFeixe(feixe: Feixe) {
      if (!ctx) return;

      ctx.save();
      ctx.translate(feixe.x, feixe.y);
      ctx.rotate((feixe.angulo * Math.PI) / 180);

      const opacidade =
        feixe.opacidade * (0.8 + Math.sin(feixe.pulso) * 0.2) * fator;
      const gradiente = ctx.createLinearGradient(0, 0, 0, feixe.comprimento);
      const cor = `${feixe.matiz}, ${SATURACAO}%, ${LUMINOSIDADE}%`;

      // As pontas nascem e morrem transparentes: é o que dá o corpo suave sem
      // precisar de desfoque por feixe.
      gradiente.addColorStop(0, `hsla(${cor}, 0)`);
      gradiente.addColorStop(0.12, `hsla(${cor}, ${opacidade * 0.5})`);
      gradiente.addColorStop(0.42, `hsla(${cor}, ${opacidade})`);
      gradiente.addColorStop(0.58, `hsla(${cor}, ${opacidade})`);
      gradiente.addColorStop(0.88, `hsla(${cor}, ${opacidade * 0.5})`);
      gradiente.addColorStop(1, `hsla(${cor}, 0)`);

      ctx.fillStyle = gradiente;
      ctx.fillRect(-feixe.largura / 2, 0, feixe.largura, feixe.comprimento);
      ctx.restore();
    }

    function pintar() {
      if (!ctx) return;
      ctx.clearRect(0, 0, largura, altura);
      for (const feixe of feixes) desenharFeixe(feixe);
    }

    function reposicionar(feixe: Feixe, indice: number, total: number) {
      const coluna = indice % 3;
      const vao = largura / 3;

      feixe.y = altura + feixe.comprimento * 0.1;
      feixe.x = coluna * vao + vao / 2 + (Math.random() - 0.5) * vao * 0.6;
      feixe.largura = 10 + Math.random() * 30;
      feixe.velocidade = VELOCIDADE_MIN + Math.random() * VELOCIDADE_FAIXA;
      feixe.matiz = MATIZ_BASE + (indice * MATIZ_FAIXA) / total;
      feixe.opacidade = 0.3 + Math.random() * 0.28;
    }

    function animar(agora: number) {
      quadro = requestAnimationFrame(animar);

      // Primeiro quadro depois de ligar: só acerta o relógio. Sem isto o passo
      // de tempo seria o instante do carregamento da página inteiro.
      if (ultimo === 0) {
        ultimo = agora;
        return;
      }

      const decorrido = agora - ultimo;
      if (decorrido < INTERVALO_MS) return;
      ultimo = agora;

      // Em segundos, com teto: quem volta de uma aba em segundo plano continua
      // de onde parou em vez de ver os feixes saltarem a tela toda de uma vez.
      const passo = Math.min(decorrido, PASSO_MAXIMO_MS) / 1000;

      const total = feixes.length;
      feixes.forEach((feixe, indice) => {
        feixe.y -= feixe.velocidade * passo;
        feixe.pulso += feixe.pulsoVelocidade * passo;
        if (feixe.y + feixe.comprimento < -40) {
          reposicionar(feixe, indice, total);
        }
      });

      pintar();
    }

    function ligar() {
      if (quadro !== null || semMovimento.matches || !naTela) return;
      if (document.hidden) return;
      ultimo = 0;
      quadro = requestAnimationFrame(animar);
    }

    function desligar() {
      if (quadro === null) return;
      cancelAnimationFrame(quadro);
      quadro = null;
    }

    function dimensionar() {
      const area = hospedeiro!.getBoundingClientRect();
      if (area.width === 0 || area.height === 0) return;

      largura = area.width;
      altura = area.height;

      canvas!.width = Math.round(largura * RESOLUCAO);
      canvas!.height = Math.round(altura * RESOLUCAO);

      // Definir `width` zera o estado do contexto — a escala vem depois dele.
      // Com isso todo o resto do arquivo desenha em pixels de CSS.
      ctx!.setTransform(RESOLUCAO, 0, 0, RESOLUCAO, 0, 0);

      const total = largura < 640 ? 7 : 11;
      feixes = Array.from({ length: total }, (_, i) =>
        criarFeixe(largura, altura, i, total),
      );

      // Um quadro imediato: em movimento reduzido é o único, e nos demais
      // evita o vazio de um frame até o laço começar.
      pintar();
    }

    dimensionar();

    const observadorTamanho = new ResizeObserver(dimensionar);
    observadorTamanho.observe(hospedeiro);

    // Fora da tela o fundo não existe para ninguém: não há por que pintá-lo.
    const observadorVisao = new IntersectionObserver(
      ([entrada]) => {
        naTela = entrada.isIntersecting;
        if (naTela) ligar();
        else desligar();
      },
      { rootMargin: '120px' },
    );
    observadorVisao.observe(hospedeiro);

    const aoTrocarAba = () => (document.hidden ? desligar() : ligar());
    document.addEventListener('visibilitychange', aoTrocarAba);

    const aoTrocarPreferencia = () => {
      if (semMovimento.matches) {
        desligar();
        pintar();
      } else {
        ligar();
      }
    };
    semMovimento.addEventListener('change', aoTrocarPreferencia);

    ligar();

    return () => {
      desligar();
      observadorTamanho.disconnect();
      observadorVisao.disconnect();
      document.removeEventListener('visibilitychange', aoTrocarAba);
      semMovimento.removeEventListener('change', aoTrocarPreferencia);
    };
  }, [intensidade]);

  return (
    <div
      ref={hospedeiroRef}
      aria-hidden
      className="pointer-events-none absolute inset-0 overflow-hidden [contain:paint]"
    >
      {/*
        O desfoque mora aqui: uma passada só, na camada inteira, em vez de um
        por feixe a cada quadro. É também o que permite o buffer reduzido —
        borrado, ninguém vê a diferença de resolução.
      */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 h-full w-full"
        style={{ filter: 'blur(10px)' }}
      />
    </div>
  );
}
