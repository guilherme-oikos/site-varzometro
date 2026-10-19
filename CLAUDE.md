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

Next.js 14 (App Router) + TypeScript + Tailwind + Supabase (Postgres, Auth e
Storage, plano Free). Deploy alvo: Vercel no plano gratuito. As páginas públicas
são estáticas com ISR; o painel (`/painel`) é dinâmico e exige login. Passo a
passo de configuração em produção: `SUPABASE.md`.

O conteúdo vem de cinco fontes:

1. **`src/lib/site.ts`** — fonte única de verdade para links das redes, e-mail,
   pilares e dados dos clubes. Mudanças de conteúdo institucional acontecem
   aqui, não nos componentes. As listas `episodios` e `cortes` daqui são apenas
   **reserva** (ver item 4), e `bancada`/`convidados` também (ver item 2).
2. **Supabase: `perfis` e `artigos`** — cada integrante tem login e edita o
   próprio perfil e os próprios artigos pelo painel. Esquema e RLS em
   `supabase/migrations/0001_inicial.sql`. `src/lib/posts.ts` e
   `src/lib/perfis.ts` leem com o cliente anônimo de
   `src/lib/supabase/publico.ts`, cujas consultas entram no cache do Next com a
   tag `conteudo`. As Server Actions de `src/app/painel/actions.ts` chamam
   `revalidateTag('conteudo')` ao salvar — publicar não exige deploy.
   `/blog/[slug]` tem `dynamicParams = true` para artigo novo abrir sem rebuild.
3. **`content/posts/*.md`** — **reserva**: só é lido quando as variáveis do
   Supabase não existem (dev sem conta). Foi a origem da migração
   (`npm run migrar`, `scripts/migrar-para-supabase.mts`).
   `content/MODELO-DE-ARTIGO.md` é do fluxo antigo e não é lido.
4. **`src/lib/youtube-feed.ts`** — busca os vídeos do canal em tempo de
   revalidação, para o site se atualizar sozinho quando sobe vídeo novo.
   `SecaoMidia` (server) faz a busca e passa por props para `CarrosselMidia`
   (client). Ordem de tentativa: API oficial (se houver `YOUTUBE_API_KEY`) →
   páginas públicas do canal (sem chave) → listas manuais do `site.ts`.
   Vídeos de até 3 minutos viram cortes; acima disso, episódios.

5. **Bolão: `bolao_jogos` e `bolao_palpites`** (`supabase/migrations/0002_bolao.sql`;
   a `0003_ranking_por_faixa.sql` refaz a view `bolao_ranking` com a contagem de
   +3, +2 e +1).
   Os jogos vêm do football-data.org (`src/lib/bolao-sync.ts`, competição
   `BSA`) e são gravados pela função `bolao_sincronizar`, chamada pelo cron
   `/api/bolao/sincronizar`, pelo botão do admin e por
   `/api/bolao/atualizar` (quando alguém logado abre o `/bolao`; ver
   `src/lib/bolao-logado.ts`) se a última busca passou de 1 minuto com jogo em
   andamento, ou 10 sem jogo (o cron da Vercel grátis é só diário; 1 minuto é
   o piso do football-data grátis, 10 consultas/minuto). `/bolao` (e `/bolao/rodada/N` e `/bolao/time/<slug>`, os jogos de um
   time só — endereço próprio e não `?time=`, que deixaria a página dinâmica)
   é pública e estática, com revalidação de 5
   minutos e tag `bolao` — o apito inicial muda o que a página mostra sem
   ninguém salvar nada.

Componentes são server components por padrão. No site público, os
`'use client'` são `Header` (menu), `CarrosselMidia` (abas/carrossel),
`FloatingCTA` (scroll) e, no bolão, `Escudo` (`onError`), `SeletorRodada`
(esqueleto dos jogos no instante da troca de rodada), `GraficoEvolucao`
(gráfico no padrão do shadcn/ui: Recharts + `src/components/ui/chart.tsx`,
adaptado aos tokens do site; o Recharts só baixa no navegador, por
`next/dynamic`) e `PalpitesDoLogado` (o palpite é no próprio `/bolao`,
não existe página de palpite no painel; `/painel/bolao` só redireciona). No painel, os de `src/components/painel/` e
`CardIntegrante` (reusado como prévia do perfil).

## Armadilhas específicas deste projeto

**Páginas públicas nunca leem cookie.** `supabasePublico()` é anônimo de
propósito: chamar `cookies()` (ou `supabaseServidor()`) numa página pública a
torna dinâmica e cada visita passa a bater no banco. O middleware só roda em
`/painel` e `/login` pelo mesmo motivo — e porque a política de privacidade
promete que visitante não recebe cookie. `supabaseServidor()` usa
`cache: 'no-store'`: rascunho de um não pode cair no cache compartilhado.
Quando a página pública precisa de algo de quem está logado (o palpite no
`/bolao`, o `MenuPerfil`), o navegador confere o cookie com
`temCookieDeSessao()` e só então chama uma rota (`/api/bolao/meu`) ou o
cliente do navegador. **Para carregar dado ao abrir a página, rota com
`fetch`, não Server Action:** o Next enfileira as actions e segura a tela
enquanto uma está pendente — com a busca do football-data no meio, o gráfico
do bolão ficava 6 a 8 segundos no esqueleto. O HTML continua o mesmo para todo mundo, e visitante não dispara
nada.

**Bolão: prazo, sigilo e pontos são do banco.** O palpite só entra até o apito
(`bolao_aberto`), o dos outros só aparece depois (`bolao_visivel`), e os pontos
saem de `bolao_pontos` — painel, página pública e ranking leem as views
`bolao_palpites_pontuados` e `bolao_ranking` (`security_invoker`, respeitam a
RLS). `src/lib/bolao.ts` repete a regra só para a tela; mudou no SQL, mude o
texto de `REGRAS` (e `REGRA_ZEBRA`). Resenha e zebra (`0004_resenha_e_zebra.sql`)
moram na linha do palpite para herdar prazo e sigilo da RLS; uma zebra por
rodada é o trigger `bolao_uma_zebra_por_rodada`. `pontos` já vem dobrado pela
zebra e `pontos_base` é a faixa da regra: exato, resultado certo e as colunas
+5/+3/+2/+1 contam pela base, nunca por `pontos`. A leitura dos palpites é
`select('*')` normalizado em `palpiteDaLinha`, para o site não cair antes de a
migração rodar. Campeão da rodada, evolução e "próprio time" só somam
os pontos que vêm do banco (`placarDaRodada`, `evolucao` e
`desempenhoNoProprioTime` em `bolao.ts`); o time de cada clube é casado pelo
nome do football-data em `TIME_DO_CLUBE` (a sigla de lá repete: Corinthians e
Coritiba são "COR"). Para ver jogo encerrado antes de ter um,
`BOLAO_SIMULAR` no `.env.local` (`src/lib/bolao-simulacao.ts`, só no dev, nada
vai para o banco). `revelado` nunca volta a false (trigger): jogo suspenso e
remarcado não reabre palpite que todo mundo viu. `bolao_quem_palpitou` é
`security definer` de propósito e devolve só quem, nunca o placar.

**A sincronização do bolão não usa service_role.** `bolao_sincronizar` aceita
sessão de admin ou o `CRON_SECRET`, conferido contra o hash gravado em
`bolao_config` por `bolao_definir_segredo` (só roda no SQL Editor). Trocou o
`CRON_SECRET` na Vercel, rode a função de novo — senão o cron passa a levar
"sem permissão". Jogo novo só entra se ainda não começou; jogo com
`editado_a_mao` não é sobrescrito.

**Escudo do football-data passa por `/escudos/[arquivo]`.** Carregar direto
faria o navegador do visitante falar com um terceiro que a política de
privacidade não cita, e muitos escudos são SVG sem `<?xml` (o `next/image`
recusa). A rota só aceita `<número>.png|svg` — não é proxy aberto.

**Erro do Supabase sobe, não vira lista vazia.** `posts.ts` e `perfis.ts`
lançam erro de propósito: na revalidação o Next mantém a última página boa, e no
build o deploy falha e o anterior segue no ar. Devolver `[]` publicaria um blog
vazio em silêncio — o mesmo tipo de falha muda que congelou o YouTube.

**Supabase Free pausa após 7 dias sem uso.** Com o cache, o banco pode passar
uma semana sem consulta. `/api/manter-ativo` (cron diário em `vercel.json`,
protegido por `CRON_SECRET`) existe só para isso. Não remova.

**Quem garante permissão é a RLS, não o painel.** A chave anônima vai para o
navegador (o painel envia imagem direto ao Storage). Toda regra nova de acesso
vai no SQL, com política e, se precisar, trigger — como os que impedem o dono de
mudar `is_admin`, `na_bancada`, `ordem`, `autor_id` e o slug já publicado. A
`service_role` só existe no `.env.local` para o script de migração; nunca na
Vercel, nunca com `NEXT_PUBLIC_`.

**O corpo do artigo é Markdown puro, não MDX.** O texto vem do banco, escrito
por quem tem login, e MDX executa JavaScript. `CorpoDoArtigo` usa
`react-markdown` (sem HTML cru) e é o mesmo componente na página e na prévia do
editor. Não volte para `next-mdx-remote`.

**Slug nasce na primeira publicação e não muda mais.** É gerado do título em
`salvarArtigo`; colisão tenta `-2`, `-3`... (o rascunho alheio é invisível pela
RLS, por isso a tentativa e não uma consulta antes). O trigger impede troca
depois, para não quebrar link compartilhado.

**Login é por nome de usuário, não por e-mail.** O Supabase Auth exige e-mail,
então `src/lib/usuario.ts` traduz `gj` em `gj@usuarios.varzometro.com.br` — e-mail
interno que ninguém recebe. Consequência: recuperação de senha é só pelo admin
no painel do Supabase; não adicione fluxo de "esqueci a senha" por e-mail.

**`posts.ts` é `server-only`.** Ele importa `fs` e o cliente do Supabase.
Componente client que precisa do tipo usa `import type` (como `BlogList`).

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
para canais grandes. Não tente usá-lo.

**O caminho sem chave não funciona em produção.** Raspar o HTML de
`youtube.com/channel/<id>/videos` funciona de IP residencial e **falha de IP de
datacenter** (Vercel): o YouTube responde **404** para a página do canal. Cuidado ao ler esse
404 — ele parece URL errada e não é; a mesma URL abre normal no navegador. Isso passou despercebido porque foi verificado só da máquina
local — em produção o site caiu na lista manual do `site.ts` e ficou dias sem
atualizar, em silêncio. **`YOUTUBE_API_KEY` é obrigatória em produção**, não
opcional. O caminho sem chave fica como reserva para desenvolvimento local.

Para saber se um ID é Short sem chave: `youtube.com/shorts/<id>` devolve 200 para
Short e 303 para vídeo longo.

Todo caminho da busca registra no log do servidor qual fonte venceu, ou que caiu
na reserva. Se o site parar de atualizar de novo, o log da Vercel diz por quê.

**Variável de ambiente colada em painel vem com lixo.** O `YOUTUBE_CHANNEL_ID`
na Vercel veio com caractere invisível grudado; o ID da playlist é derivado dele
e o Google respondeu `HTTP 400 invalid — Invalid Value`. Despista feio: 400
parece problema de chave, mas **chave recusada devolve 403**. 400 é requisição
malformada, ou seja, parâmetro. Por isso `limparVariavel()` aplica trim e tira
aspas, e o ID do canal é validado contra `UC` + 22 caracteres. Ao adicionar
variável nova, passe pelo mesmo tratamento.

**Imagem sozinha em Markdown vem embrulhada em `<p>`.** Renderizar `<figure>` ali
dentro é HTML inválido e quebra a hidratação do React. Por isso a página do
`CorpoDoArtigo` passa `remarkUnwrapImages` para o `react-markdown`. Se um dia outro elemento de
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
  Exceção conhecida e confirmada pelo cliente: a bancada tem cinco integrantes,
  dois deles palmeirenses (o santista é o Léo). O Léo fica por último na
  ordem dos cards, a pedido do cliente.
- **Tom de voz:** informal, de mesa de bar, direto. Nunca formal, professoral,
  engessado ou didático. Evitar "futebolês" de TV (`box to box` e afins).
- **Paleta:** laranja `#E07C0A` (`primary`), fundo `#0F0F12` (`ink`), superfície
  `#16161B`, apoio `#A1A1AA` (`muted`). O briefing menciona `#FF5C00` como o
  laranja da logo; o cliente decidiu manter o `#E07C0A`.
- **Estilo visual:** bordas finas com brilho sutil, sem sombras pesadas.

## Privacidade

`/politica-de-privacidade` descreve o site como ele é hoje: sem formulário, sem
analytics e sem cookies para visitantes — por isso não há banner de cookies. O
único cookie é o de sessão da área da bancada, estritamente necessário e só para
quem faz login; a política já cita isso e o Supabase como operador.
**Se for adicionar Google Analytics, Meta Pixel, newsletter, formulário ou player
incorporado, a política precisa ser atualizada antes de o recurso entrar no ar**,
e passa a ser necessário aviso de cookies. A data fica em `ultimaAtualizacao`, no
topo do arquivo da página.

## Estado do projeto

- **Repositório:** https://github.com/guilherme-oikos/site-varzometro (branch
  `main`). A Vercel republica sozinha a cada push.
- **Publicação de artigo é pelo painel próprio (`/login` → `/painel`), sobre
  Supabase** — pedido em 17/10/2026, depois de o CMS `/admin` ter sido
  descartado. Publicação direta, sem aprovação; perfil totalmente editável pelo
  dono (inclusive nome e clube); contas só criadas pelo admin, sem cadastro
  público. **Nenhum link do site aponta para `/login`** — a bancada entra pela
  URL; o botão de perfil no header (`MenuPerfil`) só aparece para quem já está
  logado. Guia para quem escreve em `PUBLICAR.md`, configuração em
  `SUPABASE.md`. Não instale CMS de terceiros.
- **`YOUTUBE_API_KEY` configurada na Vercel e funcionando.** A seção de vídeos
  se atualiza sozinha de novo, com duração e views. Se voltar a congelar, o log
  do build diz o motivo — ver a armadilha das variáveis abaixo.
- Capas em `public/episodios/` e `public/cortes/` são provisórias e só aparecem
  quando um corte não tem `youtubeId`.
- **No ar:** https://www.varzometro.com.br — é o valor de `site.url`, e afeta
  canonical, sitemap e Open Graph. **O "www" é intencional:** o domínio sem www
  responde 308 para o com www, então o com www é o que devolve 200. Se a Vercel
  passar a servir o apex como principal, trocar o valor junto. O endereço antigo
  `varzometropodcast.vercel.app` continua respondendo e não deve ser divulgado.
- **Avisos de segurança em aberto:** `npm audit` acusa o próprio `next` (14.2.35)
  e o `postcss`. A Vercel não bloqueia por esses — só bloqueou o
  `next-mdx-remote@5`, que depois foi removido de vez (ver armadilha do Markdown). Resolver exige migrar para o Next 16, com
  quebras de API no App Router; é trabalho à parte, ainda não agendado.

O `README.md` documenta os fluxos operacionais para o cliente: como publicar
episódio, corte e artigo, e como trocar as imagens.
