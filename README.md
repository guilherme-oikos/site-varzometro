# VARzômetro — Site oficial

Landing page institucional + blog estático do podcast **VARzômetro**, o hub do futebol paulista.
Next.js 14 (App Router) · TypeScript · Tailwind CSS · Markdown/MDX · pronto para deploy gratuito na Vercel.

---

## Rodando o projeto

```bash
npm install
npm run dev
```

Abra <http://localhost:3000>.

Outros comandos:

```bash
npm run build   # build de produção
npm start       # sobe o build localmente
```

> **Não rode `npm run build` com o `npm run dev` ligado.** Os dois escrevem na mesma
> pasta `.next` e o dev server quebra (erros de `Cannot find module`). Se acontecer:
> pare tudo, apague a pasta `.next` e rode `npm run dev` de novo.

---

## Estrutura

```
content/
  posts/                    # artigos do blog (.md) — adicione arquivos aqui
public/
  logo.png                  # logo oficial (coloque o arquivo aqui)
  og.jpg                    # imagem de compartilhamento 1200x630 (opcional)
  bancada/                  # fotos dos integrantes (opcional)
src/
  app/
    layout.tsx              # shell, fontes, SEO global, JSON-LD
    page.tsx                # landing page (one-page)
    globals.css             # tema, tokens e utilitários
    not-found.tsx           # 404
    robots.ts / sitemap.ts  # SEO técnico
    blog/
      page.tsx              # listagem com filtro por clube
      [slug]/page.tsx       # artigo individual (MDX)
  components/
    Header.tsx              # navegação fixa + menu hambúrguer
    Hero.tsx                # abertura
    Pilares.tsx             # os 4 pilares da bancada
    Manifesto.tsx           # manifesto do torcedor
    Bancada.tsx             # integrantes
    CarrosselMidia.tsx      # abas Episódios (16:9) / Cortes (9:16)
    BlogSection.tsx         # últimos artigos na home
    BlogList.tsx            # grade + filtro do /blog
    PostCard.tsx            # card de artigo
    Footer.tsx              # redes, navegação e contato
    FloatingCTA.tsx         # botão fixo de conversão
    Logo.tsx / Icons.tsx
  lib/
    site.ts                 # TODO o conteúdo editável (links, bancada, episódios, cortes)
    posts.ts                # leitura dos Markdown + tempo de leitura
    media.ts                # checagem de arquivos em /public
```

---

## O que editar primeiro

Quase tudo o que muda no dia a dia está em **`src/lib/site.ts`**:

| O que | Onde |
| --- | --- |
| Links de YouTube, Spotify, TikTok, Instagram | `socials` |
| E-mail de contato e URL do site | `site` |
| Integrantes da bancada | `bancada` |
| Episódios do carrossel | `episodios` |
| Cortes verticais | `cortes` |
| Textos dos pilares e do manifesto | `pilares`, `manifestoDestaques` |

### Imagens

Já estão no lugar, geradas a partir da pasta `IDENTIDADE VISUAL` e `FOTOS MEMBROS`:

- `public/logo.png` — lockup oficial sem margens (806×509).
- `public/icone.png` — versão quadrada usada como favicon.
- `public/bancada/*.jpg` — fotos dos integrantes em 800×800.
- `public/og.jpg` — imagem de compartilhamento (1200×630), feita a partir da capa.

Para trocar qualquer uma, basta substituir o arquivo mantendo o nome. Se apagar uma
foto da bancada, o card cai sozinho no avatar com iniciais (checagem em `src/lib/media.ts`).

**Ainda provisório:** as capas de episódio e corte
(`public/episodios/placeholder.svg` e `public/cortes/placeholder.svg`). Troque o campo
`thumb` em `src/lib/site.ts` pelas thumbs reais.

> Se for usar SVG próprio como imagem, comece o arquivo com
> `<?xml version="1.0" encoding="UTF-8"?>` — o otimizador do Next só reconhece SVG
> com essa declaração.

---

## Episódios e cortes: o site se atualiza sozinho

**Você não precisa fazer nada.** Ao subir um vídeo novo no canal, ele aparece no
site em até 1 hora, sem republicar nada e sem mexer em código.

Como funciona: a home busca os vídeos direto do canal e se regenera de hora em
hora (`revalidate` em `src/app/page.tsx`). Vídeos com mais de 3 minutos entram na
aba **Episódios**; os de até 3 minutos, na aba **Cortes**.

O código está em `src/lib/youtube-feed.ts`, com dois caminhos:

| Caminho | Precisa de quê | O que traz |
| --- | --- | --- |
| **Páginas públicas do canal** (padrão) | nada | título, capa e link |
| **API oficial do YouTube** | uma chave gratuita | o de cima + duração e visualizações reais |

### Ligando a API (opcional, ~5 min, gratuito)

Só vale a pena se você quiser o selo de duração ("1h 12min") e o número de
visualizações nos cortes.

1. Acesse <https://console.cloud.google.com> e crie um projeto.
2. Em **APIs e serviços → Biblioteca**, procure **YouTube Data API v3** e ative.
3. Em **Credenciais → Criar credenciais → Chave de API**, copie a chave.
4. Na Vercel: **Settings → Environment Variables**, crie `YOUTUBE_API_KEY` com
   esse valor. Para rodar local, copie `.env.example` como `.env.local`.

O consumo é de 2 unidades por atualização, com cota diária de 10.000 — ou seja,
sobra muito.

### E se o YouTube mudar alguma coisa?

Se as duas buscas falharem, o site usa as listas `episodios` e `cortes` de
`src/lib/site.ts` como reserva. Ele nunca fica com a seção vazia. Essas listas
também servem para fixar um vídeo à mão, se um dia precisar.

### Cortes do TikTok

TikTok e Instagram não liberam a capa por link, então esses continuam manuais,
em `cortes` no `src/lib/site.ts`:

```ts
{
  titulo: 'Corte que viralizou no TikTok',
  link: 'https://www.tiktok.com/@varzometro/video/123...',
  thumb: '/cortes/nome-do-arquivo.jpg',  // print salvo em public/cortes/
  views: '45,9 mil',                     // opcional
},
```

> Dica: publique o mesmo corte como Short no YouTube. Aí ele entra automático e
> você não precisa salvar print nenhum.

---

## Publicando um artigo no blog

> **Guia passo a passo:** [`PUBLICAR.md`](PUBLICAR.md) — escrito para quem vai
> subir os textos sem mexer em código. O modelo pronto para copiar está em
> [`content/MODELO-DE-ARTIGO.md`](content/MODELO-DE-ARTIGO.md).
>
> A seção abaixo é a versão resumida.

**Sim: um arquivo `.md` na pasta `content/posts/` é o artigo.** Não existe painel,
banco de dados nem login. Criou o arquivo, o artigo existe.

O nome do arquivo vira o endereço da página:

```
content/posts/pre-jogo-do-classico.md   ->   varzometro.com/blog/pre-jogo-do-classico
```

Use só letras minúsculas, sem acento e com hífen no lugar do espaço.

### A única regra: o cabeçalho

Todo artigo começa com um bloco entre duas linhas de `---`. É de onde saem o
autor, a tag do clube e a data que aparecem no card:

```markdown
---
title: 'Título chamativo do artigo'
excerpt: 'Resumo de uma ou duas linhas, que aparece no card e no Google.'
date: '2026-09-06'
author: 'GJ'          # GJ, Marti, Vinícius ou Gê
clube: 'SPFC'         # SPFC | SCCP | SEP | SFC
tags: ['pré-jogo', 'clássico']
---

Daqui pra baixo é o texto do artigo.

## Um subtítulo

Parágrafo normal, com **negrito** quando precisar.

- item de lista
- outro item

> Citação em destaque.
```

Só isso. Formatação em Markdown: `##` vira subtítulo, `**texto**` vira negrito,
`-` vira lista. Nada mais é obrigatório.

Tempo de leitura, data por extenso, filtro por clube, página do artigo, "leia
também" e sitemap são gerados sozinhos a partir desse arquivo.

### Colocando imagens no artigo

Todas as imagens do blog ficam na pasta `public/blog/`. Salve o arquivo lá e use
o caminho começando com `/blog/`.

**Capa do artigo** — aparece no card da listagem, no topo da página do artigo e
é a imagem que o WhatsApp mostra quando alguém compartilha o link. Some duas
linhas no cabeçalho:

```markdown
---
title: 'Por que o Corinthians não sai do lugar'
excerpt: 'Duas linhas de resumo.'
date: '2026-09-10'
author: 'Marti'
clube: 'SCCP'
cover: '/blog/corinthians-arquibancada.jpg'
coverAlt: 'Torcida do Corinthians na Neo Química Arena'
---
```

Tamanho ideal: **1200×675** (16:9). Se for outro formato, a imagem é cortada no
centro para caber. O `coverAlt` descreve a foto para quem usa leitor de tela e
aparece como legenda embaixo da capa.

**Imagens no meio do texto** — no corpo do artigo, onde você quiser:

```markdown
![Descrição da imagem](/blog/lance-do-jogo.jpg)
```

E com legenda visível, colocando o texto entre aspas no final:

```markdown
![Descrição da imagem](/blog/lance-do-jogo.jpg "Foto: reprodução / TV Globo")
```

Essas imagens aparecem na largura do texto, com canto arredondado, e mantêm o
formato original — não são cortadas.

> **Capa é opcional — nenhum artigo fica sem imagem.** Se você não colocar
> `cover`, o artigo recebe automaticamente a arte padrão do VARzômetro
> (`/blog/capa-padrao.svg`), tanto no card quanto no topo do texto. Isso vale
> para os artigos que já existem e para os próximos.
>
> E se você escrever o caminho errado, o site não quebra: ele percebe que o
> arquivo não existe e usa a arte padrão do mesmo jeito.
>
> Ao compartilhar no WhatsApp, um artigo com a arte padrão mostra a imagem do
> site (`og.jpg`), não a arte — o WhatsApp não consegue exibir o formato dela.
> Você não precisa fazer nada: isso já está resolvido.

Use JPG para fotos (mais leve) e PNG para artes com texto ou fundo transparente.
Vale comprimir antes em <https://squoosh.app> — foto de celular tem uns 5 MB e
deixa a página lenta; abaixo de 300 KB é um bom alvo.

O artigo `pre-jogo-classico-o-que-cada-time-precisa-fazer.md` tem uma imagem de
exemplo no meio do texto, só para você ver como fica. Pode trocar ou apagar.

### Onde criar o arquivo

- **Testando no seu computador:** salve o `.md` na pasta e ele aparece na hora em
  `localhost:3000/blog`.
- **Publicando de verdade:** o arquivo precisa chegar ao repositório do GitHub —
  ou pelo site do GitHub (**Add file → Create new file**, cola o texto, **Commit**),
  ou por `git push`. A Vercel republica o site sozinha em cerca de 1 minuto.

---

## Deploy na Vercel (gratuito)

1. Suba o projeto para um repositório no GitHub.
2. Em <https://vercel.com>, importe o repositório. O framework é detectado sozinho.
3. Ajuste `site.url` em `src/lib/site.ts` para o domínio final (importante para SEO,
   sitemap e Open Graph).

Nenhuma variável de ambiente é necessária.

---

## Paleta e tipografia

| Token | Valor | Uso |
| --- | --- | --- |
| `primary` | `#E07C0A` | destaques, CTAs, links |
| `base` | `#0F0F12` | fundo da página |
| `base-surface` | `#16161B` | cartões e seções alternadas |
| `base-line` | `#26262E` | bordas finas |
| `muted` | `#A1A1AA` | textos de apoio |

Tipografia: **Plus Jakarta Sans** (via `next/font`, sem requisição externa em runtime).
