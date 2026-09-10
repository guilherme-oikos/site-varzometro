---
name: VARzômetro
description: Placar noturno — futebol paulista em grafite e laranja, sem terno e sem gravata.
colors:
  primary: "#E07C0A"
  primary-hover: "#C46A05"
  primary-soft: "#F0A94A"
  primary-wash: "#FEF4E7"
  ink: "#0F0F12"
  ink-deep: "#0A0A0C"
  ink-surface: "#16161B"
  ink-elevated: "#1C1C23"
  ink-line: "#26262E"
  muted: "#A1A1AA"
  white: "#FFFFFF"
  clube-spfc: "#E30613"
  clube-sccp: "#FFFFFF"
  clube-sep: "#00A868"
  clube-sfc: "#D4D4D8"
  clube-sep-manto: "#006437"
  clube-preto: "#0B0B0B"
typography:
  display:
    fontFamily: "Plus Jakarta Sans, system-ui, sans-serif"
    fontSize: "clamp(1.75rem, 8.5vw, 3.875rem)"
    fontWeight: 800
    lineHeight: 1.04
    letterSpacing: "-0.03em"
  page:
    fontFamily: "Plus Jakarta Sans, system-ui, sans-serif"
    fontSize: "clamp(1.75rem, 1.1rem + 3vw, 2.875rem)"
    fontWeight: 800
    lineHeight: 1.08
    letterSpacing: "-0.027em"
  headline:
    fontFamily: "Plus Jakarta Sans, system-ui, sans-serif"
    fontSize: "clamp(1.625rem, 1.25rem + 1.9vw, 2.375rem)"
    fontWeight: 800
    lineHeight: 1.14
    letterSpacing: "-0.022em"
  title:
    fontFamily: "Plus Jakarta Sans, system-ui, sans-serif"
    fontSize: "clamp(1.0625rem, 1rem + 0.25vw, 1.1875rem)"
    fontWeight: 700
    lineHeight: 1.32
    letterSpacing: "-0.012em"
  lead:
    fontFamily: "Plus Jakarta Sans, system-ui, sans-serif"
    fontSize: "clamp(1rem, 0.95rem + 0.25vw, 1.125rem)"
    fontWeight: 400
    lineHeight: 1.62
    letterSpacing: "0.004em"
  body:
    fontFamily: "Plus Jakarta Sans, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.62
    letterSpacing: "0.004em"
  body-sm:
    fontFamily: "Plus Jakarta Sans, system-ui, sans-serif"
    fontSize: "0.9375rem"
    fontWeight: 400
    lineHeight: 1.6
    letterSpacing: "0.006em"
  subhead:
    fontFamily: "Plus Jakarta Sans, system-ui, sans-serif"
    fontSize: "clamp(1.625rem, 1.4rem + 1vw, 1.875rem)"
    fontWeight: 800
    lineHeight: 1.18
    letterSpacing: "-0.022em"
  compact:
    fontFamily: "Plus Jakarta Sans, system-ui, sans-serif"
    fontSize: "0.8125rem"
    fontWeight: 400
    lineHeight: 1.45
    letterSpacing: "0.006em"
  label:
    fontFamily: "Plus Jakarta Sans, system-ui, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "0.14em"
  micro:
    fontFamily: "Plus Jakarta Sans, system-ui, sans-serif"
    fontSize: "0.6875rem"
    fontWeight: 800
    lineHeight: 1.25
    letterSpacing: "0.06em"
rounded:
  sm: "6px"
  md: "12px"
  lg: "16px"
  xl: "24px"
  full: "9999px"
spacing:
  xs: "8px"
  sm: "12px"
  md: "20px"
  lg: "28px"
  gutter: "20px"
  section: "80px"
  section-lg: "112px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: "14px 24px"
    typography: "{typography.title}"
  button-primary-hover:
    backgroundColor: "{colors.primary-hover}"
  button-ghost:
    backgroundColor: "{colors.ink-surface}"
    textColor: "#E4E4E7"
    rounded: "{rounded.md}"
    padding: "14px 24px"
  card:
    backgroundColor: "{colors.ink-surface}"
    textColor: "{colors.white}"
    rounded: "{rounded.lg}"
    padding: "24px"
  tag-clube:
    backgroundColor: "{colors.ink-elevated}"
    textColor: "{colors.white}"
    rounded: "{rounded.sm}"
    padding: "4px 10px"
  nav-link:
    textColor: "{colors.muted}"
    rounded: "{rounded.sm}"
    padding: "8px 14px"
---

# Design System: VARzômetro

## Overview

**Creative North Star: "O Placar Noturno"**

O painel de um estádio à noite: fundo quase preto, informação em laranja, nada
sobrando. A tela não tenta ser acolhedora — ela é direta, do jeito que um placar
é direto. O torcedor chega do TikTok no meio da noite, no celular, e o site tem
poucos segundos para dizer o que é e mandar ele para o episódio.

A densidade é baixa e o contraste é alto. O fundo grafite `#0F0F12` domina, os
cartões sobem meio tom para `#16161B`, e uma única cor quente carrega toda a
energia. Não há ilustração, não há foto de banco de imagem, não há degradê
colorido: a única textura é uma malha de pontos laranja a 14% de opacidade sobre
o topo da página, que funciona como o granulado de um telão visto de perto.

A identidade se sustenta por três coisas: o laranja usado com avareza, a
tipografia pesada em 800 e a cor de cada clube aparecendo apenas onde aquele
clube é o assunto. O anti-referência confirmado pelo cliente é **rede social
genérica** — cartões idênticos, sem ponto de vista, que poderiam ser de qualquer
nicho. Se uma tela pode ser recolorida e virar de outro assunto sem parecer
estranha, ela falhou.

**Key Characteristics:**
- Escuro por padrão, sem tema claro
- Um único acento quente; cor de clube não é decoração
- Tipografia pesada (800) fazendo o trabalho de hierarquia
- Profundidade por borda fina e brilho, não por sombra difusa
- Mobile é o cenário principal, não a adaptação

## Colors

Uma paleta de dois personagens: uma escada de grafites frios que quase não se
distinguem entre si, e um laranja que é o único calor da tela.

### Primary
- **Laranja de Cal Aérea** (`{colors.primary}`): o acento único. Aparece em CTA,
  eyebrow de seção, ícones de destaque, números e no ponto da marca. É o sinal de
  "aqui você age ou aqui você olha".
- **Laranja Queimado** (`{colors.primary-hover}`): estado hover do botão sólido.
  Escurece em vez de clarear — o botão afunda, não brilha.
- **Laranja Claro** (`{colors.primary-soft}`): links dentro do texto de artigo em
  hover, onde o laranja cheio brigaria com o corpo do texto.

### Neutral
- **Grafite de Fundo** (`{colors.ink}`): o fundo de tudo. Não é preto — tem um
  toque de azul que impede o aspecto de "tela desligada".
- **Grafite Profundo** (`{colors.ink-deep}`): rodapé e sobreposições, o único
  tom mais escuro que o fundo.
- **Superfície** (`{colors.ink-surface}`): cartões, campos e faixas de seção
  alternadas. É o degrau que separa conteúdo de fundo.
- **Superfície Elevada** (`{colors.ink-elevated}`): imagem carregando, fundo de
  miniatura, código embutido.
- **Linha** (`{colors.ink-line}`): toda borda e todo divisor. Uma linha de 1px
  nesse tom é o que constrói a profundidade do sistema inteiro.
- **Cinza de Apoio** (`{colors.muted}`): texto secundário, descrições, legendas.
  Nunca para texto principal.

### Cores de Clube
Quatro acentos que só existem para identificar de quem se está falando.

- **Vermelho São Paulo** (`{colors.clube-spfc}`) · **Branco Corinthians**
  (`{colors.clube-sccp}`) · **Verde Palmeiras** (`{colors.clube-sep}`) ·
  **Cinza Santos** (`{colors.clube-sfc}`).

O verde do card é uma versão clareada do verde do manto
(`{colors.clube-sep-manto}`), porque o verde original não tem contraste
suficiente sobre grafite. As faixas no topo dos cards do herói usam as cores do
manto — verde escuro, preto (`{colors.clube-preto}`), branco — e são o que
distingue Corinthians de Santos, já que os dois são preto e branco: a ordem das
faixas é invertida entre eles.

### Named Rules

**A Regra do Laranja Escasso.** O laranja marca ação ou hierarquia, nunca
preenche área. Se mais de 10% de uma tela está laranja, ele deixou de ser sinal e
virou fundo.

**A Regra das Quatro Torcidas.** Cor de clube só aparece onde aquele clube é o
assunto — selo, faixa, tag de artigo. Nunca como cor de interface. E nunca uma
sozinha: as quatro têm o mesmo peso visual em qualquer tela onde apareçam.

## Typography

**Display Font:** Plus Jakarta Sans (fallback `system-ui, sans-serif`)
**Body Font:** Plus Jakarta Sans — a mesma família em toda a interface
**Label Font:** Plus Jakarta Sans em 12px, caixa alta, `0.14em` de entreletra

**Character:** uma grotesca geométrica com terminações levemente abertas e um
"a" de dois andares — moderna sem ser fria, sem a rigidez de uma Helvetica nem a
neutralidade de uma Inter. Em 800 ela fica compacta e encorpada, que é onde o
sistema tira sua voz. Carregada por `next/font`, sem requisição externa.

Os papéis vivem como classes em `globals.css` (`.t-display`, `.t-page`,
`.t-headline`, `.t-title`, `.t-lead`, `.t-body`, `.t-body-sm`, `.t-label`,
`.t-micro`), não como pilhas de utilitários reescritas em cada componente. Há um
motivo mecânico: no Tailwind, um utilitário de tamanho responsivo (`sm:text-4xl`)
carrega a própria `line-height` e sobrescreve um `leading-*` sem prefixo — foi
assim que os títulos de seção acabaram com 42px de texto dentro de 40px de linha.

### Hierarquia
- **Display** (800, fluido de 28px a 62px, `1.04`, `-0.03em`): título do herói.
  Um por página. O tamanho é fluido em `vw` porque a linha "vive a arquibancada"
  não pode quebrar — a sublinha depende disso — e em degraus fixos ela estourava
  a coluna em telas de 320px.
- **Page** (800, 28px a 46px, `1.08`, `-0.027em`): título das páginas internas —
  blog, artigo, política. Fica entre o display do herói e o título de seção.
- **Headline** (800, 26px a 38px, `1.14`, `-0.022em`): títulos de seção.
- **Title** (700, 17px a 19px, `1.32`, `-0.012em`): título de card, de episódio e de artigo.
  título de episódio.
- **Lead** (400, 16px a 18px, `1.62`): texto de apoio de seção e linha fina de artigo, com a medida travada em 25em (~53 caracteres).
- **Body** (400, 16px, `1.62`) e **Body-sm** (400, 15px, `1.6`): texto corrido e texto de cartão. No artigo o corpo sobe para 18px a partir de 640px e a coluna trava em 32em (~68 caracteres).
- **Subhead** (800, 26px a 30px, `1.18`): subtítulo dentro do artigo. Fica abaixo do headline de seção para não competir com ele.
- **Compact** (400, 13px, `1.45`): rótulo de botão compacto, título de corte, bio curta.
- **Label** (700, 12px, `0.14em`, caixa alta): eyebrow de seção, papel do
  integrante. Sempre laranja ou cinza — nunca branco.
- **Micro** (800, 11px, `0.06em`, quase sempre caixa alta): selo de
  clube, número do episódio, duração, contagem de visualizações, título de corte.
  É o degrau de sinalização, nunca de leitura — nenhuma frase mora aqui.

### Named Rules

**A Regra do Peso, Não da Cor.** Hierarquia se resolve por tamanho e peso.
Colorir um título para dar destaque é sinal de que o tamanho está errado. A
exceção é a palavra-chave laranja dentro de um título — no máximo uma por
título.

**A Regra do Texto Branco.** Texto principal é branco puro; apoio é
`{colors.muted}`. Não existe um terceiro cinza intermediário no sistema.

## Layout

Coluna central de `1200px` (`.container-page`) com respiro lateral de `20px` no
celular, `24px` a partir de `640px` e `32px` a partir de `1024px`. O corpo do
artigo é mais estreito, `768px`, para segurar a medida de leitura.

O ritmo vertical é constante: seções respiram `80px` no celular e `112px` a
partir de `640px`. Seções alternam entre fundo puro e `{colors.ink-surface}` a
40% com borda superior e inferior — é o que cria a cadência da página sem
precisar de divisor desenhado.

Grades: os quatro cards de clube ficam 2 a 2 no celular e passam a ocupar uma
única linha a partir de `768px` — ver as quatro lado a lado é o que comunica que
nenhuma torcida tem mais peso. Bancada e pilares vão a 2 colunas em `640px` e 4
em `1024px`; artigos, 2 em `768px` e 3 em `1024px`.

O header é fixo com `72px` de altura, e `scroll-padding-top: 92px` compensa a
âncora ao navegar. A navegação completa aparece a partir de `768px`: o tablet
tem espaço para os cinco links (`634px` de `720px` disponíveis) e não deve
receber o menu sanduíche, que fica restrito ao celular.

Breakpoints são os padrões do Tailwind: `640px`, `768px`, `1024px`. A coluna
respeita `env(safe-area-inset-left/right)` porque a página roda com
`viewport-fit=cover` — sem isso a barra fixa inferior ficaria por baixo da barra
de gestos do iPhone.

### Named Rules

**A Regra dos 44 Pixels.** Em telas sem mouse (`pointer: coarse`), nenhum
controle tem menos de `44px` de altura. A regra vale por consulta de ponteiro, não
por largura de tela: um notebook com touch também recebe o alvo maior, e o
desktop mantém a densidade original. Links de texto dentro de parágrafo são a
única exceção — ali a área cresceria por cima da linha vizinha.

### Named Rules

**A Regra do Polegar.** O público chega de vídeo vertical, no celular. Toda
faixa horizontal (episódios, cortes, filtros do blog) rola com o dedo e faz
`snap`; as setas de navegação são um extra de desktop, nunca o único caminho. A
barra fixa inferior com YouTube e Spotify existe só no celular, aparecendo
depois de `520px` de rolagem.

## Elevation & Depth

O sistema é **plano por padrão**. Não existe sombra de repouso: um card em
descanso é uma superfície `{colors.ink-surface}` com uma borda de 1px em
`{colors.ink-line}`. A profundidade vem da diferença de dois tons de grafite e
de uma linha — não de desfoque.

A sombra só entra como resposta: no hover do card, no botão primário e no cartão
que precisa se destacar do resto da página. E quando entra, ela é laranja, não
preta — funciona como halo de luz, não como peso projetado.

### Shadow Vocabulary
- **Halo Suave** (`0 10px 40px -18px rgba(224,124,10,0.55)`): botão primário e
  hover de card. Luz difusa por baixo, sem contorno.
- **Halo Marcado** (`0 0 0 1px rgba(224,124,10,0.28), 0 12px 40px -12px rgba(224,124,10,0.35)`):
  o cartão-citação e o botão fixo de desktop. Combina um anel de 1px com a luz.
- **Realce Interno** (`inset 0 1px 0 0 rgba(255,255,255,0.04)`): fio de luz no
  topo de superfícies, usado com moderação.

### Named Rules

**A Regra da Luz, Não do Peso.** Sombra neste sistema é iluminação laranja vinda
de trás do elemento. Sombra preta difusa é proibida — é o vocabulário de
Material Design e faz o site parecer template.

## Shapes

Escala de raio curta e consistente: `6px` para selos e tags, `12px` para botões,
campos e ícones-botão, `16px` para cards, `24px` para blocos grandes (capa de
artigo, cartão-citação, painel de contato). Nada é totalmente reto e nada é
totalmente pílula, exceto o badge do herói e os avatares, que são círculo ou
`9999px`.

A geometria dominante é o retângulo de canto suave com borda de 1px. A única
forma que quebra isso é a faixa de cores do clube no topo dos cards do herói: um
retângulo de `6px` de altura dividido em duas ou três faixas verticais, sem
raio, encostado na borda superior — a citação mais direta à camisa.

Ícones são SVG inline com traço de `1.8px`, cantos e junções arredondados,
`viewBox` de 24. Nenhuma biblioteca de ícones é carregada.

## Components

### Buttons
Caráter: sólido e direto, sem ornamento.

- **Shape:** canto suave (`{rounded.md}` / 12px)
- **Primary:** fundo `{colors.primary}`, texto branco, `14px 24px` de padding,
  peso 700 em 14px, com Halo Suave. Hover escurece para
  `{colors.primary-hover}`; `:active` reduz para `98%`.
- **Ghost:** fundo `{colors.ink-surface}`, borda `{colors.ink-line}`, texto
  `#E4E4E7`. Hover troca a borda para laranja a 50% e o texto para branco.
- **Focus:** anel de 2px em `{colors.primary}` com `2px` de offset sobre o fundo
  — global, definido em `:focus-visible`.
- Transições em `200ms` com `cubic-bezier(0.22, 1, 0.36, 1)`.

### Cards / Containers
Caráter: contido, com a borda fazendo todo o trabalho.

- **Corner Style:** `{rounded.lg}` (16px)
- **Background:** `{colors.ink-surface}`
- **Border:** 1px `{colors.ink-line}`; no hover vira `{colors.primary}` a 50%
- **Shadow Strategy:** nenhuma em repouso; Halo Suave no hover (ver Elevation)
- **Internal Padding:** `24px`, subindo para `28px` em cards de destaque
- **Movimento:** sobe `4px` no hover, em `300ms`

### Chips / Tags
- **Tag de clube:** `{rounded.sm}`, `4px 10px`, 11px em peso 800 caixa alta com
  entreletra ampliada. Cor de fundo, texto e borda derivam do clube, sempre em
  opacidades baixas (`14%` de fundo, `55%` de borda).
- **Filtro do blog:** botão de `12px` de raio; ativo é laranja sólido com texto
  branco, inativo é superfície com borda de linha.

### Navigation
- Links em 14px peso 600, `{colors.muted}` em repouso, branco no hover com fundo
  branco a 4%.
- O header é transparente no topo da página e ganha fundo `{colors.ink}` a 85%
  com `blur` e borda inferior depois de `12px` de rolagem.
- No celular vira um drawer que abre por `max-height`, com o scroll do corpo
  travado enquanto está aberto.

### Media Card (componente-assinatura)
O card de episódio e o de corte carregam a identidade do produto: miniatura em
`16:9` ou `9:16` com escurecimento de `40%`, botão de play circular laranja no
centro que cresce `10%` no hover, selo de duração no canto inferior, e um par de
botões YouTube/Spotify divididos meio a meio no rodapé do card. O corte vertical
usa gradiente de baixo para cima até o título.

### Direção escolhida, ainda não implementada
O cliente escolheu um caráter **"encorpado e físico"** para botões e cards —
mais volume, sombra marcada, sensação de clique. O sistema implementado hoje é o
oposto disso: borda fina e halo sutil, que é também o que o briefing original
pedia ("bordas finas com brilho sutil, sem sombras pesadas"). Esta é uma decisão
em aberto, não uma descrição do código. Enquanto não for resolvida, vale o
sistema descrito acima.

## Movimento

O site tem **um** momento focal, e ele mora no herói: **as camisas sendo
escritas**.

A faixa das quatro camisas entra listra por listra, da esquerda para a direita,
começando `300ms` depois da chamada. Os quatro cards abaixo repetem a mesma
ordem a partir de `660ms`. São duas cascatas encadeadas, não simultâneas — o
olho lê como um gesto só descendo pela página.

**As quatro faixas têm a mesma largura, e isso é a mensagem.** Equilíbrio entre
os 4 grandes é regra editorial; a faixa diz isso em objeto — quatro camisas
lado a lado, do mesmo tamanho. Nada ali representa medida de nada.

> Uma versão anterior deste topo trazia uma onda de osciloscópio com quatro
> cristas iguais. Foi rejeitada pelo cliente e a razão vale como regra: **uma
> forma que parece gráfico precisa ser gráfico.** Se ela exige uma explicação
> para justificar por que não significa nada, não é para estar na página.

| Peça | Onde | Técnica |
|---|---|---|
| Faixa das quatro camisas | `.faixa-clube` no Hero | `scaleX`, atraso via `--faixa-atraso` |
| Faixas dos cards | `.faixa-clube` no card | mesma classe, atraso maior |
| Feixes de luz | `FeixesHero` | canvas 2D, ~30fps, um só desfoque em CSS |

**Os feixes são ambiente, não momento.** Pintam num canvas atrás de tudo, param
quando o topo sai de vista ou a aba vai para segundo plano, e ficam num quadro
parado sob `prefers-reduced-motion`. Matiz 22–44, em volta do laranja da casa.
Adaptado de "Beams Background", de Dorian Baffier (kokonutui.com, MIT).

**São riscos finos, não manchas.** 11 feixes de 10 a 40px (7 no celular), com
desfoque de 10px: o topo lê como preto e o laranja entra como detalhe. A versão
anterior tinha 28 feixes de 90 a 200px borrados a 22px, e o resultado era um
lençol laranja. A largura somada caiu de ~4060px para ~275px, o que pagou
buffer a 80% (risco fino serrilha em buffer baixo) e teto de 60fps em vez de 30
(risco fino é o que mais denuncia judder).

**O véu (`bg-veu-hero`) não é decoração, é legibilidade.** Um risco passando
exatamente por trás do texto de apoio o derruba para ~2,8:1. Medido por
amostragem de 9 segundos, com o véu a 60% o pior caso fica em 5,5:1. Se algum
dia os feixes ficarem mais fortes ou mais largos, **remeça isto** — não é um
valor que se ajusta a olho.

### Microinterações

Fora do momento focal, movimento aqui é **retorno de estado**, nunca enfeite. A
régua: se a peça não muda de comportamento quando o estado muda, ela não devia
se mexer.

| Peça | O que informa |
|---|---|
| Setas do carrossel | Desabilitam de verdade nas pontas (`disabled`, não só opacidade) |
| Trilho de posição | No celular, onde não há setas: largura = quanto se vê, posição = onde se está |
| Seção ativa no menu | `IntersectionObserver` numa faixa estreita (92px a 30% da tela) |
| Barra de leitura | Só na página do artigo, `animation-timeline: scroll()`, sem JavaScript |
| Anel de foco no card | No card inteiro (`focus-within`), não no texto do link sobreposto |
| Copiar e-mail | A palavra troca no lugar do ícone e volta sozinha em 2,2s |

**Numeral que é dado usa `.numerico`** (`font-variant-numeric: tabular-nums`).
Vale para número de episódio, duração, views, tempo de leitura, data e
contagem de filtro. Na Plus Jakarta Sans o "1" é bem mais estreito que o "8":
sem isso a coluna de selos muda de largura de um card para o outro, e é a
diferença entre um número escrito e um número medido.

Regras que valem para qualquer movimento novo:

- **O estado padrão é o final.** Se a animação não rodar — navegador antigo,
  movimento reduzido, CSS que não chegou — o conteúdo já está lá, inteiro.
  Nada nasce escondido esperando JavaScript.
- **Só `transform`, `opacity`, `clip-path` e `mask`.** Nada que force layout.
- **Entrada por rolagem é `animation-timeline: view()`**, sob `@supports`, para
  não custar listener de scroll.
- **`prefers-reduced-motion` reduz deslocamento, não feedback.** Entradas param
  de deslizar mas ainda aparecem; hover, botão pressionado e o giro do card da
  bancada continuam respondendo. Um `transition: none !important` global levaria
  junto o feedback e é o erro que esta regra existe para evitar.
- **Um momento focal por vez.** Um segundo movimento autoral disputando atenção
  com a onda não é dois efeitos, é nenhum.

## Do's and Don'ts

### Do:
- **Do** usar o laranja `{colors.primary}` como sinal de ação ou hierarquia, em
  no máximo 10% da área de qualquer tela.
- **Do** construir profundidade com a dupla superfície + borda de 1px em
  `{colors.ink-line}` antes de pensar em sombra.
- **Do** resolver hierarquia com peso 800 e tamanho, não com cor.
- **Do** dar às quatro torcidas o mesmo peso visual sempre que elas aparecerem
  juntas — mesma área, mesma posição na grade, mesma saturação.
- **Do** desenhar a versão de celular primeiro: faixas que arrastam, alvo mínimo
  de `44px`, barra fixa inferior para os dois destinos principais.
- **Do** condicionar realce de hover a `@media (hover: hover) and (pointer: fine)`.
  No toque o `:hover` gruda depois do toque e o cartão fica levantado até a pessoa
  tocar em outro lugar; ali o feedback certo é `:active`.
- **Do** manter todo ícone como SVG inline de traço `1.8px`.

### Don't:
- **Don't** usar sombra preta difusa. A sombra deste sistema é laranja e só
  aparece em resposta a estado.
- **Don't** introduzir tema claro. O escuro não é preferência, é a identidade.
- **Don't** usar cor de clube como cor de interface — botão verde, fundo
  vermelho, borda alviverde. Cor de clube identifica, não decora.
- **Don't** destacar um clube sozinho em elemento estrutural (herói, banner,
  ordem de listagem).
- **Don't** carregar biblioteca de ícones, fonte externa em runtime ou imagem de
  banco de imagens.
- **Don't** empilhar cards idênticos sem hierarquia — é exatamente a "rede social
  genérica" que o cliente rejeitou.
