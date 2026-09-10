# Product

<!-- impeccable:product-schema 1 -->

Registro de verdade do produto. Os títulos das seções ficam em inglês porque são
lidos por ferramenta; o conteúdo é em pt-BR, como todo o resto do projeto.

## Platform

web

## Users

Torcedores dos quatro grandes de São Paulo — São Paulo, Corinthians, Palmeiras e
Santos. Homens entre 20 e 50 anos, majoritariamente do estado de SP, que gostam
de futebol e de um bom debate.

O que os define não é a idade, é o cansaço: estão saturados da mídia esportiva
tradicional, do debate engessado e da lacração. Procuram gente que fale de
futebol como eles falam no grupo do WhatsApp.

**Como chegam:** quase sempre por vídeo vertical (TikTok, Reels, Shorts) ou pelo
Instagram, no celular, no meio de outra coisa. O site é encontrado depois do
conteúdo, não antes. Assumir chegada por desktop é assumir errado.

## Product Purpose

O VARzômetro é um podcast sobre futebol paulista. Este site é o endereço oficial
do projeto: reúne episódios, cortes e artigos em um lugar só.

**Sucesso, confirmado pelo cliente:** o site fez seu trabalho quando manda gente
para o YouTube e o Spotify. Ele é ponte, não destino. Toda decisão de produto
responde a "isso aproxima ou afasta a pessoa de dar play?".

O blog existe como porta de entrada por busca orgânica — trazer quem ainda não
conhece o podcast e conduzir ao episódio — e como prova de autoridade.

## Positioning

Quatro torcedores dos quatro grandes de SP na mesma mesa, cada um puxando para o
seu lado. Um veículo de futebol paulista pode copiar o formato de podcast; não
copia com honestidade a composição da bancada nem o histórico de amizade que faz
a discussão funcionar sem virar briga.

O contraponto é explícito: o oposto do estúdio de TV. Sem terno, sem gravata, sem
"futebolês", sem rabo preso com clube, diretoria ou patrocinador. Mídia
alternativa feita por torcedor, para torcedor.

O nome vem de piada interna: quando um dos quatro ficava bravo com a zoeira, os
outros diziam que "já ia apitar o varzômetro" — um medidor de várzea. O "VAR" em
maiúscula encaixa no termo do futebol.

## Operating Context

- **Ritmo:** cobertura semanal, com pré e pós-jogo dos jogos de meio de semana e
  da rodada de fim de semana. O conteúdo tem validade curta: episódio velho no
  topo do site é sinal de projeto parado.
- **YouTube é o canal principal.** Spotify em segundo. Cortes verticais circulam
  em TikTok, Reels e Shorts e funcionam como isca.
- **O site se atualiza sozinho** com os vídeos novos do canal, de hora em hora.
  Ninguém precisa mexer no site quando sobe episódio.
- **Blog publicado à mão:** cada artigo é um arquivo Markdown no repositório.
- **Deploy:** Vercel, plano gratuito. O projeto ainda não está no GitHub, o que
  hoje bloqueia tanto o deploy quanto a publicação de artigos.

## Capabilities and Constraints

- Site estático: sem banco de dados, sem login, sem rota de API, sem formulário.
- Sem cookies próprios, sem analytics e sem pixel de rastreamento até hoje. Isso
  é o que permite não ter banner de cookies; mudar isso exige atualizar a
  política de privacidade antes.
- Somente português do Brasil. Sem multilíngue.
- **Painel de administração (CMS) foi descartado pelo cliente.** A publicação de
  artigos continua sendo criar um arquivo `.md`.
- A bancada tem dois palmeirenses e nenhum santista. Confirmado pelo cliente e
  fiel à realidade do grupo; não é erro a corrigir.
- Domínio final ainda não definido.
- Chave da API do YouTube é opcional e ainda não foi criada. Sem ela, os cards
  não exibem duração nem visualizações.

**Decisão em aberto:** os quatro integrantes vão publicar no blog, e nenhum deles
tem conhecimento técnico. Como o CMS foi descartado, o fluxo depende de cada um
conseguir criar um arquivo pelo site do GitHub. Ainda não foi validado se isso
funciona na prática com os outros três.

## Brand Commitments

- **Nome:** VARzômetro. Sempre com o "VAR" em maiúscula.
- **Logo:** lockup oficial em `public/logo.png`, já recortado. O lockup contém o
  nome — não acompanhar de wordmark em texto.
- **Cor:** laranja `#E07C0A`, escolha confirmada pelo cliente. O briefing citava
  `#FF5C00` como o laranja da logo; a decisão de manter o `#E07C0A` é deliberada.
- **Tom de voz:** informal, direto, de mesa de bar. Nunca formal, professoral,
  engessado ou didático. Sem "futebolês" de TV.
- **Equilíbrio entre os quatro grandes é regra editorial**, não estética. Nenhum
  clube pode receber destaque desproporcional em copy, ordem, exemplos ou
  artigos.
- **Contato oficial:** varzometropodcast@gmail.com.
- **Redes oficiais:** YouTube `@VARzômetroPodcast`, Spotify (show
  `6WfDPCAJMVbYaW4G24nv59`), TikTok e Instagram `@varzometro`.

## Evidence on Hand

- **Canal ativo** desde janeiro de 2026, com episódios numerados até o #16 mais
  especiais de Copa do Mundo, e dezenas de cortes verticais. O site consome isso
  automaticamente.
- **Fotos dos quatro integrantes** em `public/bancada/`.
- **Identidade visual** (logo, capa do canal, versões em vídeo) na pasta
  `IDENTIDADE VISUAL` do projeto no OneDrive.
- **Briefing preenchido pelo cliente**, origem da maior parte deste registro.

**O que não existe — não inventar:** nenhum depoimento de ouvinte, nenhum número
de audiência confirmado, nenhum patrocinador, nenhuma menção de imprensa, nenhum
prêmio. O projeto ainda não gera receita. Qualquer prova social no site teria de
ser fabricada, e isso está proibido.

## Product Principles

1. **O site é ponte, não destino.** Se uma decisão não aproxima a pessoa de dar
   play no episódio, ela precisa de outra justificativa.
2. **As quatro torcidas têm o mesmo peso.** Vale para texto, ordem, exemplos e
   pauta. Desequilíbrio quebra a premissa do produto.
3. **Quem publica é leigo.** Um fluxo que exige conhecimento técnico não vai
   acontecer — na prática, vira blog parado.
4. **Ser o oposto do estúdio de TV.** Qualquer coisa que soe institucional,
   professoral ou corporativa está errada, mesmo que fique bonita.
5. **Nada de prova social inventada.** Sem números, depoimentos ou selos que o
   projeto ainda não conquistou.

## Accessibility & Inclusion

Requisito estabelecido no briefing: o site precisa ser responsivo. Como o público
chega de vídeo vertical, o celular é o cenário principal de uso — desempenho e
legibilidade no mobile valem mais do que refinamento em telas grandes.

Nenhum padrão formal de acessibilidade foi exigido pelo cliente.
