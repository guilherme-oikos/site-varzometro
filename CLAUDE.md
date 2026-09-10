# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Idioma

Todo o conteúdo visível do site é em **pt-BR** — textos, comentários de código,
nomes de campos em `site.ts` (`titulo`, `descricao`, `bancada`) e mensagens de
commit. Mantenha esse padrão ao adicionar código.

## Comandos

```bash
npm run dev      # servidor de desenvolvimento em localhost:3000
npm run build    # build de produção (valida tipos e gera as páginas estáticas)
npm start        # sobe o build de produção localmente
npx tsc --noEmit # só a checagem de tipos (seguro rodar com o dev ligado)
```

**Nunca rode `npm run build` com o `npm run dev` ligado.** Os dois escrevem em
`.next` e o dev server quebra com `Cannot find module './XXX.js'` e 404 nos
chunks. Para validar um build: pare o dev, `rm -rf .next`, rode o build, apague
`.next` de novo e reinicie o dev.

Não há suíte de testes neste projeto. A validação é `npx tsc --noEmit` +
`npm run build` (o build também roda lint e checagem de tipos).

## Arquitetura

Next.js 14 (App Router) + TypeScript + Tailwind, sem banco de dados, sem rota de
API e sem autenticação. Deploy alvo: Vercel no plano gratuito. Quase tudo é
estático; a home é a única rota com ISR (`revalidate = 3600`), porque busca os
vídeos do canal.

O conteúdo vem de três fontes:

1. **`src/lib/site.ts`** — fonte única de verdade para links das redes, e-mail,
   integrantes da bancada, pilares e dados dos clubes. Mudanças de conteúdo
   institucional acontecem aqui, não nos componentes. As listas `episodios` e
   `cortes` daqui são apenas **reserva** (ver item 3).
2. **`content/posts/*.md`** — artigos do blog. `content/MODELO-DE-ARTIGO.md`
   é o template para o cliente e **não** é lido (fica fora de `posts/`); o passo
   a passo dele está em `PUBLICAR.md`. `src/lib/posts.ts` lê os arquivos
   com `gray-matter`, calcula tempo de leitura e data em pt-BR, e as páginas
   renderizam o corpo com `next-mdx-remote/rsc`. Criar um arquivo `.md` já gera
   card na home, item na listagem, página própria e entrada no sitemap.
3. **`src/lib/youtube-feed.ts`** — busca os vídeos do canal em tempo de
   revalidação, para o site se atualizar sozinho quando sobe vídeo novo.
   `SecaoMidia` (server) faz a busca e passa por props para `CarrosselMidia`
   (client). Ordem de tentativa: API oficial (se houver `YOUTUBE_API_KEY`) →
   páginas públicas do canal (sem chave) → listas manuais do `site.ts`.
   Vídeos de até 3 minutos viram cortes; acima disso, episódios.

Componentes são server components por padrão. Só três são `'use client'`:
`Header` (menu), `CarrosselMidia` (abas/carrossel) e `FloatingCTA` (scroll).

## Armadilhas específicas deste projeto

**O token de cor do fundo se chama `ink`, não `base`.** Uma cor chamada `base`
no `tailwind.config.ts` gera `.text-base` e colide com o utilitário de tamanho de
fonte do Tailwind, deixando textos com a cor do fundo (invisíveis). Se for
adicionar cores, evite nomes que colidam com utilitários (`base`, `sm`, `lg`...).

**`src/lib/media.ts` usa `fs` — só pode ser importado por server components.**
Importá-lo (mesmo indiretamente) a partir de um componente `'use client'` quebra
o build com `UnhandledSchemeError`. Foi o que aconteceu quando `Logo` usava
`publicFileExists` e o `Header` (client) importava o `Logo`. Helpers puros para
o YouTube ficam em `src/lib/youtube.ts` justamente por isso.

**Arquivos SVG precisam começar com `<?xml version="1.0" encoding="UTF-8"?>.`**
O otimizador de imagem do Next 14 não detecta SVG sem essa declaração e responde
400 (`The requested resource isn't a valid image`). `dangerouslyAllowSVG` já está
ligado no `next.config.mjs`, com CSP e sandbox.

**Capas de vídeo são derivadas do ID, nunca coladas como URL.** `src/lib/youtube.ts`
monta link e capa a partir do `youtubeId`. Para Shorts, `oar2.jpg` devolve a capa
vertical real em 1080×1920 — `maxresdefault.jpg` devolveria 16:9. Só
`i.ytimg.com` e `img.youtube.com` estão liberados em `next.config.mjs`.

Duração e views só existem quando `YOUTUBE_API_KEY` está configurada — o caminho
sem chave não tem como obter esses dados. Por isso os dois campos são opcionais e
a UI esconde o selo quando estão vazios. Capa de corte do TikTok é sempre manual
(imagem em `public/cortes/`): a plataforma não serve thumbnail por link.

**O feed RSS do YouTube (`/feeds/videos.xml`) está fora do ar** — responde 404 até
para canais grandes. Não tente usá-lo. Os caminhos que funcionam, verificados:
API v3 com chave, e o HTML de `youtube.com/channel/<id>/videos` e `/shorts`, de
onde saem os IDs por regex e os títulos pelo oEmbed público. Para saber se um ID
é Short sem chave: `youtube.com/shorts/<id>` devolve 200 para Short e 303 para
vídeo longo.

**Imagem sozinha em Markdown vem embrulhada em `<p>`.** Renderizar `<figure>` ali
dentro é HTML inválido e quebra a hidratação do React. Por isso a página do
artigo passa `remarkUnwrapImages` para o `MDXRemote`. Se um dia outro elemento de
bloco for mapeado em `MdxComponents.tsx`, o mesmo cuidado vale.

**Todo artigo tem capa.** Sem `cover` no cabeçalho (ou com um caminho que não
existe), `posts.ts` cai em `CAPA_PADRAO` (`/blog/capa-padrao.svg`) e marca
`capaPadrao: true`. Essa marca importa em dois lugares: a legenda embaixo da
capa some (arte genérica não descreve o artigo) e a prévia de compartilhamento
usa `OG_PADRAO` (`/og.jpg`) — **nunca o SVG**, porque WhatsApp e Facebook não
renderizam SVG em prévia de link e o artigo sairia sem imagem. Imagens do blog
ficam em `public/blog/`. `coverCredito` é campo separado do `coverAlt` e sai na
legenda como "Foto: ..." — o alternativo descreve a cena para leitor de tela, o
crédito é atribuição. **Crédito não é licença:** foto de agência sem contrato é
risco jurídico do cliente, e isso deve ser dito a ele quando aparecer. A capa usa `next/image` com `aspect-[16/9]` e
`object-cover`; as imagens do corpo do texto usam `<img>` puro, porque têm
proporção arbitrária e não podem ser cortadas.

**Nunca transforme a capitalização dos títulos vindos do YouTube.** Um
`toLowerCase()` aplicado a títulos em caixa alta quebra nomes próprios
("SÃO PAULO" virou "são paulo"). O tratamento se limita a tirar hashtags e o
sufixo "- VARZÔMETRO #NN".

## Regras de conteúdo (vindas do briefing do cliente)

- **Equilíbrio entre os 4 grandes de SP** (São Paulo, Corinthians, Palmeiras,
  Santos) é regra editorial, não estética. Nenhum clube pode receber destaque
  desproporcional — vale para copy, ordem de listas, exemplos e artigos do blog.
  Exceção conhecida e confirmada pelo cliente: a bancada tem dois palmeirenses e
  nenhum santista.
- **Tom de voz:** informal, de mesa de bar, direto. Nunca formal, professoral,
  engessado ou didático. Evitar "futebolês" de TV (`box to box` e afins).
- **Paleta:** laranja `#E07C0A` (`primary`), fundo `#0F0F12` (`ink`), superfície
  `#16161B`, apoio `#A1A1AA` (`muted`). O briefing menciona `#FF5C00` como o
  laranja da logo; o cliente decidiu manter o `#E07C0A`.
- **Estilo visual:** bordas finas com brilho sutil, sem sombras pesadas.

## Privacidade

`/politica-de-privacidade` descreve o site como ele é hoje: sem formulário, sem
login, sem analytics e sem cookies próprios — por isso não há banner de cookies.
**Se for adicionar Google Analytics, Meta Pixel, newsletter, formulário ou player
incorporado, a política precisa ser atualizada antes de o recurso entrar no ar**,
e passa a ser necessário aviso de cookies. A data fica em `ultimaAtualizacao`, no
topo do arquivo da página.

## Estado do projeto

- **Repositório:** https://github.com/guilherme-oikos/site-varzometro (branch
  `main`). Publicar artigo = commit em `content/posts/`; a Vercel republica
  sozinha a cada push. O passo a passo para o cliente está em `PUBLICAR.md`.
- **Deploy na Vercel: ainda não conectado.** Falta importar o repositório em
  vercel.com/new. Até isso acontecer, nada do que subir para o GitHub aparece
  em um site no ar.
- **Painel `/admin` (CMS): descartado pelo cliente.** A publicação de artigos
  continua sendo criar um `.md` em `content/posts/`. Não instale um CMS sem ele
  pedir de novo.
- `YOUTUBE_API_KEY` é opcional e ainda não foi configurada (ver `.env.example`).
  O site está rodando pelo caminho sem chave.
- Capas em `public/episodios/` e `public/cortes/` são provisórias e só aparecem
  quando um corte não tem `youtubeId`.
- **No ar:** https://varzometropodcast.vercel.app — é o valor de `site.url`.
  Se um domínio próprio for contratado, trocar lá (afeta SEO, sitemap e Open
  Graph) e configurar o domínio no painel da Vercel.
- **Avisos de segurança em aberto:** `npm audit` acusa o próprio `next` (14.2.35)
  e o `postcss`. A Vercel não bloqueia por esses — só bloqueou o
  `next-mdx-remote@5`, já corrigido. Resolver exige migrar para o Next 16, com
  quebras de API no App Router; é trabalho à parte, ainda não agendado.

O `README.md` documenta os fluxos operacionais para o cliente: como publicar
episódio, corte e artigo, e como trocar as imagens.
