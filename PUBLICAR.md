# Como publicar um artigo no blog

Guia para quem vai subir os textos. Não precisa saber programar e não precisa
usar terminal.

O modelo pronto para copiar está em **`content/MODELO-DE-ARTIGO.md`**.

---

## Entendendo em 30 segundos

Cada artigo do blog é **um arquivo de texto**. Um arquivo = um artigo.

Eles moram em `content/posts/`. O site lê essa pasta e monta tudo sozinho: card,
página, data, tempo de leitura, filtro por clube, Google.

**O nome do arquivo vira o endereço da página:**

```
content/posts/pre-jogo-do-classico.md
        ↓
varzometro.com/blog/pre-jogo-do-classico
```

Por isso o nome do arquivo tem três regras:

- só letras minúsculas
- sem acento e sem ç (`pre-jogo`, não `pré-jogo`)
- hífen no lugar de espaço
- termina em `.md`

---

## O passo a passo

### 1. Receba o texto do seu amigo

Pode vir por WhatsApp, e-mail, Word, qualquer coisa. Você vai copiar e colar.

### 2. Copie o modelo

Abra `content/MODELO-DE-ARTIGO.md`, copie tudo, e crie um arquivo novo dentro de
`content/posts/` com o nome do artigo. Exemplo: `santos-na-vila.md`.

> ⚠️ **Só coloque o arquivo em `content/posts/` quando ele estiver pronto para
> publicar.** Tudo que está nessa pasta vai para o ar. Enquanto estiver
> trabalhando no texto, deixe o arquivo em qualquer outro lugar do computador.

### 3. Preencha o cabeçalho

É o bloco entre as duas linhas de `---`, no topo. É a parte que precisa estar
certa — o texto embaixo é livre.

```
---
title: 'Santos em reconstrução: o que ainda falta'
excerpt: 'Time joga bem 60 minutos e entrega os outros 30.'
date: '2026-09-10'
author: 'Gê'
clube: 'SFC'
tags: ['análise', 'vila belmiro']
---
```

| Campo | Valores aceitos |
|---|---|
| `author` | `GJ` · `Marti` · `Vinícius` · `Gê` |
| `clube` | `SPFC` (São Paulo) · `SCCP` (Corinthians) · `SEP` (Palmeiras) · `SFC` (Santos) |
| `date` | Sempre `'ano-mês-dia'` com zero na frente: `'2026-03-05'` |

### 4. Cole o texto embaixo

Apague o exemplo e cole o artigo. Depois é só marcar os subtítulos com `##` e os
negritos com `**duas estrelinhas**`. A cola completa está no fim do modelo.

### 5. Capa: não precisa fazer nada

Sem capa, o artigo recebe a arte padrão do VARzômetro automaticamente. Só mexa
nisso se tiver uma imagem específica para aquele texto.

> ⚠️ **Cuidado com foto de jogo.** Imagem de agência (AFP, Getty, Reuters) ou
> copiada de site de notícias é paga, e essas empresas cobram de quem usa sem
> licença. **Pôr o crédito não resolve** — crédito diz quem tirou, licença é a
> permissão de publicar.
>
> Sem licença, as opções seguras são: foto tirada por vocês, imagem de banco
> livre, ou nenhuma capa (o artigo ganha a arte do VARzômetro).

### 6. Suba para o ar

É o passo que faz o artigo existir de verdade — leia a seção abaixo.

---

## ⚠️ Importante: como o artigo chega no ar

Salvar o arquivo no seu computador **não publica nada.**

Quando você roda o site aqui na sua máquina, salvar o arquivo muda a página na
hora. Isso engana: no site de verdade **não funciona assim.**

O motivo: as páginas do blog são montadas uma vez, no momento em que o site é
publicado. Depois disso o site no ar não volta mais na pasta para conferir se
algo mudou. Só uma publicação nova regenera as páginas.

> É diferente dos vídeos do YouTube, que **aparecem sozinhos**. Aqueles o site
> busca no canal enquanto está no ar. O blog não busca nada — ele já vem pronto.

O caminho completo é:

```
você edita o arquivo  →  envia para o GitHub  →  a Vercel percebe
                      →  publica de novo  →  no ar (cerca de 1 minuto)
```

O único passo manual é o de enviar para o GitHub. E é simples: tudo pelo
navegador, sem programa e sem terminal.

### Publicando pelo GitHub

O repositório é **github.com/guilherme-oikos/site-varzometro** e o site no ar é
**varzometropodcast.vercel.app**.

1. Entre no repositório no `github.com`
2. Abra a pasta `content/posts`
3. **Artigo novo:** botão `Add file` → `Create new file` → escreva o nome do
   arquivo (`santos-na-vila.md`) → cole o conteúdo
4. **Corrigir um artigo:** clique no arquivo → ícone de lápis → edite
5. Botão verde `Commit changes`
6. Espere cerca de um minuto e recarregue o site

Corrigir um erro de digitação num artigo já publicado segue o mesmo caminho: edita,
`Commit changes`, um minuto, pronto.

---

## Antes de publicar, confira

- [ ] Nome do arquivo em minúsculas, sem acento, com hífen, terminando em `.md`
- [ ] O arquivo está dentro de `content/posts/`
- [ ] As duas linhas de `---` estão lá, uma no começo e uma no fim do cabeçalho
- [ ] `author` escrito igualzinho, com acento (`Vinícius`, `Gê`)
- [ ] `clube` em maiúsculas (`SPFC`, `SCCP`, `SEP`, `SFC`)
- [ ] `date` no formato `'2026-09-10'`
- [ ] Título e resumo entre aspas

---

## Se der errado

**O artigo não apareceu no site.** Confira se o arquivo está em `content/posts/`
e se termina em `.md`. Depois confira se você chegou a publicar (passo 6) — salvar
não publica.

**O artigo apareceu sem o autor ou com a tag do clube errada.** Erro de digitação
no cabeçalho. `author` e `clube` precisam ser exatamente um dos valores da tabela.

**A página do artigo dá erro.** Quase sempre é aspas. Se o título tem apóstrofo
(`O 'craque' sumiu`), troque as aspas de fora por aspas duplas:

```
title: "O 'craque' sumiu"
```

**A data saiu errada no card.** O formato é ano-mês-dia: `'2026-03-05'` é 5 de
março. `'2026-05-03'` seria 3 de maio.

**A imagem não aparece.** Confira se o arquivo está em `public/blog/` e se o
caminho no texto começa com `/blog/`. Se o caminho estiver errado, o artigo não
quebra — ele mostra a arte padrão no lugar.

---

Detalhes técnicos e as outras tarefas do site (episódios, cortes, imagens,
deploy) estão no `README.md`.
