# Ligando o login da bancada em produção (Supabase + Vercel)

Passo a passo para pôr no ar o painel em que cada integrante edita o próprio
perfil e publica os próprios artigos. Tudo no plano gratuito. Faz uma vez só;
leva uns 30 minutos.

Enquanto isto não for feito, o site continua igual a hoje: lê os artigos de
`content/posts/` e a bancada do `src/lib/site.ts`, e `/painel` mostra um aviso.

---

## 1. Criar o projeto no Supabase

1. Entre em <https://supabase.com> com a conta do projeto (de preferência
   `varzometropodcast@gmail.com`, para não ficar preso a uma pessoa).
2. **New project**
   - Name: `varzometro`
   - Database password: gere uma forte e guarde num gerenciador de senhas.
   - Region: **South America (São Paulo)**.
   - Plan: Free.
3. Espere o projeto terminar de criar (1–2 minutos).

## 2. Criar as tabelas

1. Menu lateral → **SQL Editor** → **New query**.
2. Cole o conteúdo inteiro de [`supabase/migrations/0001_inicial.sql`](supabase/migrations/0001_inicial.sql)
   e clique em **Run**. Deve aparecer "Success. No rows returned".
3. Confira em **Table Editor**: existem `perfis` e `artigos`. Em **Storage**:
   existe o bucket `imagens`.

## 3. Fechar o cadastro público

Ninguém de fora pode criar conta — só o admin.

1. **Authentication → Sign In / Providers → Email**: deixe ligado.
2. Desligue **Allow new users to sign up**. Salve.
3. **Authentication → URL Configuration**:
   - Site URL: `https://www.varzometro.com.br`
   - Redirect URLs: adicione `https://www.varzometro.com.br/**` e
     `http://localhost:3000/**`.

## 4. Copiar as chaves

**Project Settings → API** (ou **API Keys**):

| No painel do Supabase | Vira a variável | Vai para |
| --- | --- | --- |
| Project URL | `NEXT_PUBLIC_SUPABASE_URL` | Vercel e `.env.local` |
| `anon` / `public` | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Vercel e `.env.local` |
| `service_role` / `secret` | `SUPABASE_SERVICE_ROLE_KEY` | **só** `.env.local` |

A `service_role` passa por cima de todas as regras do banco. Ela nunca vai para
a Vercel, nunca vai para o git e nunca ganha prefixo `NEXT_PUBLIC_`.

## 5. Criar as contas e migrar o conteúdo atual

Roda na sua máquina, uma vez. Cria o login de cada integrante, copia as fotos e
os 11 artigos para o Supabase mantendo os mesmos endereços (`/blog/...`), para
nenhum link já compartilhado quebrar.

1. Crie o `.env.local` na raiz (copie de `.env.example`) com as três variáveis
   do passo 4.
2. Copie `scripts/contas.exemplo.json` para `scripts/contas.json` e preencha o
   usuário (de 2 a 30 letras minúsculas, números, `.`, `-` ou `_`, sem acento) e
   uma senha provisória de cada um. O login é pelo usuário, não por e-mail: ver
   "Login por usuário" abaixo. Marque `"admin": true` em quem
   vai administrar (pode ser mais de um). Esse arquivo está no `.gitignore`.
3. Rode:

   ```bash
   npm install
   npm run migrar
   ```

   Deve terminar com `Pronto: 5 perfis e 11 artigos.`
4. Teste local: `npm run dev`, abra <http://localhost:3000/login> e entre com
   uma das contas.
5. Apague o `scripts/contas.json` depois e mande a senha provisória para cada um
   por mensagem privada. Cada um troca em **Meu perfil → Senha**.

> O script pode rodar de novo sem duplicar nada, **mas só antes** de a bancada
> começar a usar o painel: ele sobrescreve perfis e artigos com o que está no
> código.

## 6. Configurar a Vercel

1. Vercel → projeto → **Settings → Environment Variables**. Adicione, marcando
   **Production** e **Preview**:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `CRON_SECRET` — qualquer texto longo e aleatório (ex.: gere em
     <https://1password.com/password-generator>, 40 caracteres).
2. Ao colar, confira que não veio espaço nem quebra de linha. O código limpa o
   básico, mas foi exatamente isso que travou o YouTube uma vez (ver CLAUDE.md).
3. **Antes do push, faça os passos 1 a 3 do bolão (item 7).** Depois, push
   para a `main`: a Vercel publica sozinha.
4. Depois do deploy: **Settings → Cron Jobs** deve listar `/api/manter-ativo`,
   uma vez por dia.

## 7. Ligar o bolão

1. **SQL Editor → New query**: cole [`supabase/migrations/0002_bolao.sql`](supabase/migrations/0002_bolao.sql)
   inteiro e clique em **Run**. **Faça isto antes do push**: sem as tabelas, a
   página `/bolao` não monta e o build da Vercel falha (o site anterior segue
   no ar, mas o novo não entra).
   Em seguida, do mesmo jeito, [`supabase/migrations/0003_ranking_por_faixa.sql`](supabase/migrations/0003_ranking_por_faixa.sql)
   (as colunas +5 / +3 / +2 / +1 do ranking). Também antes do push: sem ela, a
   tabela do ranking sai com as colunas +3, +2 e +1 vazias.
   Por último, [`supabase/migrations/0004_resenha_e_zebra.sql`](supabase/migrations/0004_resenha_e_zebra.sql)
   (resenha no palpite e zebra da rodada). Sem ela o site continua de pé, mas
   salvar palpite dá "Falta rodar a migração 0004".
   E [`supabase/migrations/0005_temporadas.sql`](supabase/migrations/0005_temporadas.sql)
   (uma temporada por campeonato). **Esta é obrigatória antes do push:** o
   código novo lê a coluna `temporada`, e sem ela o bolão inteiro dá erro.
   Depois do deploy, dá para apagar a versão antiga de uma função:
   `drop function public.bolao_quem_palpitou(integer);`
2. Ainda no SQL Editor, grave o segredo da sincronização — **o mesmo valor do
   `CRON_SECRET`** da Vercel:

   ```sql
   select public.bolao_definir_segredo('COLE-AQUI-O-CRON-SECRET');
   ```

   O banco guarda só o hash. Se trocar o `CRON_SECRET` um dia, rode de novo.
3. Crie o token em <https://www.football-data.org/client/register> (grátis,
   chega por e-mail) e adicione na Vercel como `FOOTBALL_DATA_TOKEN`, em
   **Production** e **Preview**. Ponha também no `.env.local`.
4. Depois do deploy: entre como admin e abra `/bolao` → **Atualizar jogos
   agora** (o botão só aparece para o admin logado). Entram os jogos que ainda não começaram; os que já foram ficam de
   fora.

Como funciona no dia a dia:

- **Virada de campeonato (2026 → 2027) não pede nada.** Quando o football-data
  passa a devolver a temporada nova, a sincronização grava os jogos com o ano
  novo, o `/bolao` mostra a temporada mais recente com o ranking zerado, e a
  anterior fica em `/bolao/temporada/<ano>` com o pódio e a classificação final.

- **Os jogos se atualizam sozinhos.** Um cron às 2h busca data, situação e
  placar. Fora isso, alguém logado abrir o `/bolao` busca de novo se a última busca
  passou de **1 minuto, quando tem jogo em andamento** (começou há menos de 4
  horas e não foi encerrado), ou de 10 minutos no resto do tempo. Quem abre o
  painel depois do apito final já vê o ranking com o placar novo — desde que o
  football-data já tenha encerrado o jogo. A página pública não dispara busca:
  mostra o que está no banco, com até 5 minutos de cache.
- **O prazo é o apito inicial de cada jogo**, conferido pelo banco. Antes dele,
  ninguém vê o palpite dos outros (nem na página pública); depois, todo mundo vê.
- **Pontuação:** 5 placar exato · 3 vencedor (ou empate) e os gols de um dos
  times · 2 vencedor (ou empate) · 1 errou o resultado mas cravou os gols de um
  time. Desempate: mais placares exatos, depois mais resultados certos. A conta
  é a função `bolao_pontos` no SQL.
- **A API errou ou demorou?** No card do jogo, o admin abre **Corrigir jogo**,
  muda situação e placar e salva. A sincronização deixa de mexer naquele jogo
  até alguém clicar em **Voltar a seguir a API**.
- **Jogo adiado antes de começar** reabre para palpite quando ganhar data nova.
  Jogo que começou e foi suspenso, não: os palpites já ficaram à mostra.

## 8. Conferir em produção

- <https://www.varzometro.com.br/blog> mostra os 11 artigos, com capa.
- <https://www.varzometro.com.br/login> → login → **Meu perfil** → mude a bio,
  salve, e veja o card mudar na home (pode levar alguns segundos).
- **Novo artigo** → escreva → **Publicar** → aparece no blog sem novo deploy.
- Deslogado, <https://www.varzometro.com.br/painel> manda para `/login`.
- Compartilhe um artigo no WhatsApp: a prévia deve mostrar a capa.
- Logado, **/bolao**: os jogos da rodada aparecem com os campos do palpite.
  Salve um, saia do login e abra <https://www.varzometro.com.br/bolao>: o placar
  do palpite **não** pode aparecer antes do jogo, só "1 de 5 já palpitaram".
- **Settings → Cron Jobs** lista também `/api/bolao/sincronizar`.

Depois de uns dias tudo certo, os arquivos de `content/posts/` podem ser
apagados num commit separado — eles só servem de reserva para quem roda o site
sem Supabase.

---

## Dia a dia

- **Integrante novo:** Authentication → Users → **Add user** → *Create new user*
  (e-mail `usuario@usuarios.varzometro.com.br`, senha provisória, marque *Auto
  Confirm User*). A pessoa entra digitando só `usuario`. Copie o **UID** e, no
  SQL Editor:

  ```sql
  insert into perfis (id, nome, iniciais, clube, papel, funcao, bio, na_bancada, ordem)
  values ('UID-COPIADO', 'Nome', 'NO', 'SFC', 'Comentarista', '', '', true, 60);
  ```

  `na_bancada = false` para convidado (assina artigo, mas não ganha card).
  `ordem` define a posição do card (10, 20, 30...).
- **Esqueceu a senha:** Authentication → Users → clique no usuário → defina uma
  senha nova direto por ali. O "Send password recovery" não serve: o e-mail da
  conta é interno e ninguém o recebe.
- **Mudar ordem dos cards ou tirar alguém da bancada:** Table Editor → `perfis`
  → colunas `ordem` e `na_bancada`. Só o admin mexe nelas; o painel não deixa.
- **Alguém saiu do projeto:** apague o usuário em Authentication → Users. Os
  artigos dele travam a exclusão (para não sumirem do blog sem querer): passe
  os artigos para outra pessoa ou apague-os antes.

## Login por usuário

O Supabase só aceita e-mail como identificador, então cada conta tem um e-mail
interno no formato `usuario@usuarios.varzometro.com.br` e a tela de login monta
esse endereço a partir do que a pessoa digita (`src/lib/usuario.ts`). Ninguém
recebe e-mail nesse endereço — por isso a recuperação de senha é sempre pelo
admin (**Users → definir senha nova**), nunca pelo "Send password recovery".
Para trocar o usuário de alguém, mude o e-mail da conta em Authentication →
Users mantendo o mesmo domínio.

## Limites do plano grátis

| | Free | Uso esperado |
| --- | --- | --- |
| Banco | 500 MB | texto de artigo é kB; sobra por anos |
| Storage | 1 GB | o painel reduz cada foto antes de enviar (algumas centenas de KB): milhares de imagens |
| Pausa | após 7 dias sem uso | resolvido pelo cron diário |
| E-mails do Auth | poucos por hora | por isso as contas são criadas com senha, sem convite por e-mail |

A Vercel Hobby é para uso **não comercial**. Se o site passar a ter patrocínio
ou anúncio, os termos pedem o plano Pro.
