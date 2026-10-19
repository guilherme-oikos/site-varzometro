-- Bolão da bancada: jogos do Brasileirão, palpites e ranking.
--
-- Como rodar: SQL Editor > New query > colar este arquivo inteiro > Run. Pode
-- rodar de novo sem quebrar nada. Depois, uma vez só, grave o segredo da
-- sincronização (o mesmo valor do CRON_SECRET da Vercel):
--
--   select public.bolao_definir_segredo('COLE-AQUI-O-CRON-SECRET');
--
-- Os jogos vêm do football-data.org. Quem grava é `bolao_sincronizar`, chamada
-- pela rota /api/bolao/sincronizar (cron) e pelo botão do admin no painel. A
-- service_role continua fora da Vercel: a função só aceita o segredo acima ou
-- uma sessão de admin, e só sabe gravar jogo.
--
-- Prazo e sigilo dos palpites são garantidos aqui, pela RLS, e não pelo painel:
-- a chave anônima está no navegador, e qualquer um da bancada conseguiria
-- chamar a API direto.

-- ------------------------------------------------------------------- Jogos --

create table if not exists public.bolao_jogos (
  -- ID do jogo no football-data.org.
  id bigint primary key,
  rodada integer not null check (rodada between 1 and 38),
  mandante text not null,
  mandante_sigla text not null default '',
  -- Só o nome do arquivo do escudo ("1769.png"). O site serve por
  -- /escudos/<arquivo>, para o navegador do visitante não ir a terceiros.
  mandante_escudo text,
  visitante text not null,
  visitante_sigla text not null default '',
  visitante_escudo text,
  inicio timestamptz not null,
  status text not null default 'agendado'
    check (status in ('agendado', 'ao_vivo', 'encerrado', 'adiado', 'cancelado')),
  gols_mandante integer check (gols_mandante >= 0),
  gols_visitante integer check (gols_visitante >= 0),
  -- Vira true quando os palpites deste jogo já ficaram visíveis para todos. Não
  -- volta mais: jogo suspenso no meio e remarcado não reabre palpite que todo
  -- mundo já viu.
  revelado boolean not null default false,
  -- Correção do admin. A sincronização não sobrescreve jogo marcado assim.
  editado_a_mao boolean not null default false,
  atualizado_em timestamptz not null default now()
);

create index if not exists bolao_jogos_rodada_idx on public.bolao_jogos (rodada, inicio);

-- -------------------------------------------------------------- Palpites --

create table if not exists public.bolao_palpites (
  jogo_id bigint not null references public.bolao_jogos (id) on delete cascade,
  autor_id uuid not null references public.perfis (id) on delete cascade,
  gols_mandante integer not null check (gols_mandante between 0 and 20),
  gols_visitante integer not null check (gols_visitante between 0 and 20),
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  primary key (jogo_id, autor_id)
);

create index if not exists bolao_palpites_autor_idx on public.bolao_palpites (autor_id);

-- ---------------------------------------------------- Estado e segredo --

-- Uma linha só: quando a última sincronização deu certo. Leitura pública, para
-- o site mostrar "atualizado há X minutos" e saber se já passou da hora.
create table if not exists public.bolao_estado (
  id boolean primary key default true check (id),
  sincronizado_em timestamptz
);
insert into public.bolao_estado (id) values (true) on conflict (id) do nothing;

-- Sem nenhuma política: com a RLS ligada, ninguém lê nem escreve pela API.
-- Guarda só o hash do segredo, nunca o valor.
create table if not exists public.bolao_config (
  chave text primary key,
  valor text not null
);

-- --------------------------------------------------------------- Funções --

-- Pode palpitar: jogo marcado, ainda não começou e nunca foi revelado.
create or replace function public.bolao_aberto(j public.bolao_jogos)
returns boolean
language sql
stable
as $$
  select j.status = 'agendado' and j.inicio > now() and not j.revelado;
$$;

-- Palpites à mostra para todos: a bola já rolou (ou o jogo foi revelado antes).
-- Jogo adiado antes do apito fica escondido, e reabre quando ganhar data nova.
create or replace function public.bolao_visivel(j public.bolao_jogos)
returns boolean
language sql
stable
as $$
  select j.revelado
    or j.status in ('ao_vivo', 'encerrado')
    or (j.status = 'agendado' and j.inicio <= now());
$$;

-- A regra de pontuação mora aqui, num lugar só. `src/lib/bolao.ts` só descreve
-- a regra na tela — se mudar aqui, mude o texto de lá.
--   5  placar exato
--   3  acertou quem venceu (ou o empate) e os gols de um dos times
--   2  acertou quem venceu (ou o empate)
--   1  errou o resultado, mas acertou os gols de um dos times
--   0  nada
create or replace function public.bolao_pontos(pm integer, pv integer, gm integer, gv integer)
returns integer
language sql
immutable
as $$
  select case
    when gm is null or gv is null then null
    when pm = gm and pv = gv then 5
    when sign(pm - pv) = sign(gm - gv) and (pm = gm or pv = gv) then 3
    when sign(pm - pv) = sign(gm - gv) then 2
    when pm = gm or pv = gv then 1
    else 0
  end;
$$;

-- Ninguém muda o placar do palpite de outro nem troca o jogo de um palpite.
create or replace function public.bolao_proteger_palpite()
returns trigger
language plpgsql
as $$
begin
  new.jogo_id = old.jogo_id;
  new.autor_id = old.autor_id;
  new.criado_em = old.criado_em;
  new.atualizado_em = now();
  return new;
end;
$$;

drop trigger if exists bolao_palpites_protecao on public.bolao_palpites;
create trigger bolao_palpites_protecao
  before update on public.bolao_palpites
  for each row execute function public.bolao_proteger_palpite();

-- Palpite que já ficou à mostra não volta a ficar escondido nem reabre, venha
-- a mudança da sincronização ou da correção do admin.
create or replace function public.bolao_manter_revelado()
returns trigger
language plpgsql
as $$
begin
  new.revelado = old.revelado or new.revelado or public.bolao_visivel(old)
    or new.status in ('ao_vivo', 'encerrado');
  return new;
end;
$$;

drop trigger if exists bolao_jogos_revelado on public.bolao_jogos;
create trigger bolao_jogos_revelado
  before update on public.bolao_jogos
  for each row execute function public.bolao_manter_revelado();

drop trigger if exists bolao_jogos_atualizado_em on public.bolao_jogos;
create trigger bolao_jogos_atualizado_em
  before update on public.bolao_jogos
  for each row execute function public.tocar_atualizado_em();

-- Grava o hash do segredo da sincronização. Só roda pelo SQL Editor: as
-- permissões de anon e authenticated são retiradas logo abaixo.
create or replace function public.bolao_definir_segredo(segredo text)
returns void
language sql
security definer
set search_path = public
as $$
  insert into public.bolao_config (chave, valor)
  values ('segredo_sync', encode(sha256(convert_to(trim(segredo), 'UTF8')), 'hex'))
  on conflict (chave) do update set valor = excluded.valor;
$$;

revoke execute on function public.bolao_definir_segredo(text) from public, anon, authenticated;

/*
 * Recebe a lista de jogos já traduzida pelo site (ver src/lib/bolao-sync.ts) e
 * grava. Regras:
 *
 * - Jogo novo só entra se ainda não começou: o bolão é das rodadas que faltam,
 *   não da temporada inteira.
 * - Jogo que já existe é atualizado (data, status, placar), a não ser que o
 *   admin tenha corrigido à mão.
 * - `revelado` é cuidado pelo trigger `bolao_jogos_revelado`.
 *
 * Devolve quantos jogos foram gravados.
 */
create or replace function public.bolao_sincronizar(segredo text, jogos jsonb)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  esperado text;
  item jsonb;
  atual public.bolao_jogos;
  gravados integer := 0;
begin
  select valor into esperado from public.bolao_config where chave = 'segredo_sync';

  if not public.eh_admin()
    and (segredo is null or esperado is null
         or encode(sha256(convert_to(trim(segredo), 'UTF8')), 'hex') <> esperado) then
    raise exception 'sem permissão para sincronizar o bolão' using errcode = '42501';
  end if;

  for item in select * from jsonb_array_elements(jogos)
  loop
    select * into atual from public.bolao_jogos where id = (item ->> 'id')::bigint;

    if not found then
      if (item ->> 'status') <> 'agendado' and (item ->> 'status') <> 'adiado' then
        continue;
      end if;
      if (item ->> 'inicio')::timestamptz <= now() then
        continue;
      end if;

      insert into public.bolao_jogos (
        id, rodada, mandante, mandante_sigla, mandante_escudo,
        visitante, visitante_sigla, visitante_escudo,
        inicio, status, gols_mandante, gols_visitante
      ) values (
        (item ->> 'id')::bigint,
        (item ->> 'rodada')::integer,
        item ->> 'mandante',
        coalesce(item ->> 'mandante_sigla', ''),
        item ->> 'mandante_escudo',
        item ->> 'visitante',
        coalesce(item ->> 'visitante_sigla', ''),
        item ->> 'visitante_escudo',
        (item ->> 'inicio')::timestamptz,
        item ->> 'status',
        (item ->> 'gols_mandante')::integer,
        (item ->> 'gols_visitante')::integer
      );
      gravados := gravados + 1;
      continue;
    end if;

    if atual.editado_a_mao then
      continue;
    end if;

    update public.bolao_jogos set
      rodada = (item ->> 'rodada')::integer,
      mandante = item ->> 'mandante',
      mandante_sigla = coalesce(item ->> 'mandante_sigla', ''),
      mandante_escudo = item ->> 'mandante_escudo',
      visitante = item ->> 'visitante',
      visitante_sigla = coalesce(item ->> 'visitante_sigla', ''),
      visitante_escudo = item ->> 'visitante_escudo',
      inicio = (item ->> 'inicio')::timestamptz,
      status = item ->> 'status',
      gols_mandante = (item ->> 'gols_mandante')::integer,
      gols_visitante = (item ->> 'gols_visitante')::integer
    where id = atual.id;
    gravados := gravados + 1;
  end loop;

  update public.bolao_estado set sincronizado_em = now() where id;

  return gravados;
end;
$$;

grant execute on function public.bolao_sincronizar(text, jsonb) to anon, authenticated;

/*
 * Quem já palpitou em cada jogo — só o "quem", nunca o placar. É o que permite
 * mostrar "faltam 2 palpitar" sem abrir o palpite antes do apito. Por isso é
 * `security definer`: passa por cima da RLS de propósito, e devolve só as
 * duas colunas.
 */
create or replace function public.bolao_quem_palpitou(rodada_alvo integer)
returns table (jogo_id bigint, autor_id uuid)
language sql
stable
security definer
set search_path = public
as $$
  select p.jogo_id, p.autor_id
  from public.bolao_palpites p
  join public.bolao_jogos j on j.id = p.jogo_id
  where j.rodada = rodada_alvo;
$$;

grant execute on function public.bolao_quem_palpitou(integer) to anon, authenticated;

-- ------------------------------------------------------------------ Views --

-- `security_invoker`: as views respeitam a RLS de quem consulta. O visitante só
-- enxerga palpite de jogo que já começou, e o ranking conta só jogo encerrado
-- — então ninguém descobre palpite alheio pela soma.
create or replace view public.bolao_palpites_pontuados
with (security_invoker = true) as
select
  p.jogo_id,
  p.autor_id,
  p.gols_mandante,
  p.gols_visitante,
  p.atualizado_em,
  case when j.status = 'encerrado'
    then public.bolao_pontos(p.gols_mandante, p.gols_visitante, j.gols_mandante, j.gols_visitante)
  end as pontos
from public.bolao_palpites p
join public.bolao_jogos j on j.id = p.jogo_id;

-- Toda a bancada aparece, mesmo quem ainda não pontuou. Convidado entra quando
-- tiver palpite.
create or replace view public.bolao_ranking
with (security_invoker = true) as
select
  pf.id as autor_id,
  pf.nome,
  pf.iniciais,
  pf.clube,
  pf.foto_url,
  pf.foto_blog_url,
  pf.ordem,
  coalesce(sum(pp.pontos), 0)::integer as pontos,
  count(pp.pontos) filter (where pp.pontos = 5)::integer as exatos,
  count(pp.pontos) filter (where pp.pontos >= 2)::integer as resultados,
  count(pp.pontos)::integer as jogos_pontuados
from public.perfis pf
left join public.bolao_palpites_pontuados pp on pp.autor_id = pf.id
where pf.na_bancada or pp.autor_id is not null
group by pf.id;

grant select on public.bolao_palpites_pontuados to anon, authenticated;
grant select on public.bolao_ranking to anon, authenticated;

-- --------------------------------------------------------------------- RLS --

alter table public.bolao_jogos enable row level security;
alter table public.bolao_palpites enable row level security;
alter table public.bolao_estado enable row level security;
alter table public.bolao_config enable row level security;

drop policy if exists "bolao_jogos: leitura pública" on public.bolao_jogos;
create policy "bolao_jogos: leitura pública" on public.bolao_jogos
  for select using (true);

-- Correção manual de placar ou data. Criar e apagar jogo é só pela
-- sincronização (ou pelo SQL Editor).
drop policy if exists "bolao_jogos: admin corrige" on public.bolao_jogos;
create policy "bolao_jogos: admin corrige" on public.bolao_jogos
  for update using (public.eh_admin()) with check (public.eh_admin());

drop policy if exists "bolao_estado: leitura pública" on public.bolao_estado;
create policy "bolao_estado: leitura pública" on public.bolao_estado
  for select using (true);

-- O próprio palpite, sempre. O dos outros, só depois do apito inicial.
drop policy if exists "bolao_palpites: dono ou jogo começado" on public.bolao_palpites;
create policy "bolao_palpites: dono ou jogo começado" on public.bolao_palpites
  for select using (
    autor_id = auth.uid()
    or exists (select 1 from public.bolao_jogos j where j.id = jogo_id and public.bolao_visivel(j))
  );

-- Criar, mudar e apagar: só o próprio, e só até o apito inicial. É o banco que
-- confere a hora, não o navegador.
drop policy if exists "bolao_palpites: dono palpita antes do jogo" on public.bolao_palpites;
create policy "bolao_palpites: dono palpita antes do jogo" on public.bolao_palpites
  for insert with check (
    autor_id = auth.uid()
    and exists (select 1 from public.bolao_jogos j where j.id = jogo_id and public.bolao_aberto(j))
  );

drop policy if exists "bolao_palpites: dono muda antes do jogo" on public.bolao_palpites;
create policy "bolao_palpites: dono muda antes do jogo" on public.bolao_palpites
  for update using (
    autor_id = auth.uid()
    and exists (select 1 from public.bolao_jogos j where j.id = jogo_id and public.bolao_aberto(j))
  ) with check (autor_id = auth.uid());

drop policy if exists "bolao_palpites: dono apaga antes do jogo" on public.bolao_palpites;
create policy "bolao_palpites: dono apaga antes do jogo" on public.bolao_palpites
  for delete using (
    autor_id = auth.uid()
    and exists (select 1 from public.bolao_jogos j where j.id = jogo_id and public.bolao_aberto(j))
  );
