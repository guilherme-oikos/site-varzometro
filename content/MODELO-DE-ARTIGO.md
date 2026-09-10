---
title: 'Escreva aqui o título do artigo'
excerpt: 'Uma ou duas linhas resumindo o texto. É o que aparece no card do blog e no Google.'
date: '2026-09-10'
author: 'GJ'
clube: 'SPFC'
tags: ['pré-jogo', 'clássico']
---

Este arquivo é o **modelo**. Ele não aparece no site — está em `content/`, e o
site só lê o que estiver em `content/posts/`.

Para escrever um artigo novo: copie este arquivo para `content/posts/`, troque o
nome do arquivo, preencha o cabeçalho lá em cima e apague todo este texto de
exemplo daqui para baixo.

O passo a passo completo está em `PUBLICAR.md`, na pasta principal do projeto.

---

## Cola rápida do cabeçalho

As sete linhas entre os `---` são a única parte que **precisa** estar certa.

| Campo | O que colocar | Cuidado |
|---|---|---|
| `title` | O título do artigo | Se tiver aspas simples no texto, use aspas duplas em volta: `title: "O 'craque' sumiu"` |
| `excerpt` | Resumo de 1 ou 2 linhas | Mesma regra de aspas |
| `date` | A data no formato `'2026-09-10'` | Sempre ano-mês-dia, com zero na frente: `'2026-03-05'`, nunca `'5/3/2026'` |
| `author` | `GJ`, `Marti`, `Vinícius` ou `Gê` | Escreva igualzinho, com acento |
| `clube` | `SPFC`, `SCCP`, `SEP` ou `SFC` | Maiúsculas. São São Paulo, Corinthians, Palmeiras e Santos |
| `tags` | Dois ou três assuntos | Entre colchetes, cada um entre aspas |

**Capa é opcional.** Sem nada, o artigo recebe a arte padrão do VARzômetro. Se
quiser uma imagem própria, salve em `public/blog/` e acrescente ao cabeçalho:

```
cover: '/blog/nome-da-imagem.jpg'
coverAlt: 'Descrição curta da foto, para quem não enxerga'
coverCredito: 'Nome do fotógrafo / Agência'
```

> ⚠️ **Foto de agência (AFP, Getty, Reuters) ou de site de notícias exige
> licença paga.** Pôr o crédito identifica o autor, mas **não** autoriza o uso —
> são coisas diferentes. Sem licença, o seguro é usar foto própria, de banco
> livre, ou não pôr capa nenhuma: o artigo recebe a arte do VARzômetro sozinho.

---

## Cola rápida do texto

Daqui para baixo é o artigo. Você escreve normal, e só precisa de cinco sinais:

`## Assim vira um subtítulo` — use para separar os blocos do texto.

Parágrafo é só escrever e pular uma linha entre um e outro. Para dar ênfase,
`**duas estrelinhas**` deixam a palavra em **negrito**.

- Traço no começo da linha vira lista
- Uma linha para cada item

> Sinal de maior faz uma citação em destaque, para a frase que resume o texto.

[Assim vira link](https://youtube.com) — o texto entre colchetes, o endereço
entre parênteses.

Para pôr uma imagem no meio do texto, salve o arquivo em `public/blog/` e use:

```
![Descrição da imagem](/blog/nome-do-arquivo.jpg)
```

---

## O que o site faz sozinho

Você não precisa se preocupar com nada disto — sai pronto do arquivo:

- O card na home e na página do blog
- A data por extenso ("10 de setembro de 2026")
- O tempo de leitura
- A tag colorida do clube
- O filtro por clube na página do blog
- A seção "Leia também" no fim do artigo
- O endereço da página e a entrada no Google
