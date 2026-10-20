-- Bolão: uma temporada por campeonato (2026, 2027...).
--
-- Como rodar: SQL Editor > New query > colar este arquivo inteiro > Run. Pode
-- rodar de novo sem quebrar nada. Precisa do 0002, 0003 e 0004 antes.
--
-- Depois disto, a virada de campeonato não pede mexer em tabela nenhuma:
-- quando o football-data passar a devolver a temporada nova, a sincronização
-- grava os jogos com o ano novo, o site passa a mostrar a temporada mais
-- recente com o ranking zerado, e a anterior vai para /bolao/temporada/<ano>.
-- O número da rodada se repete entre temporadas (a 31 de 2026 e a 31 de
-- 2027), por isso tudo que é "por rodada" passa a ser "por temporada e rodada".

-- ------------------------------------------------------------- Temporada --

alter table public.bolao_jogos add column if not exists temporada integer;
-- Tudo que existe até aqui é do Brasileirão 2026.
update public.bolao_jogos set temporada = 2026 where temporada is null;
alter table public.bolao_jogos alter column temporada set not null;
alter table public.bolao_jogos drop constraint if exists bolao_jogos_temporada_valida;
alter table public.bolao_jogos add constraint bolao_jogos_temporada_valida check (temporada between 2000 and 2100);

create index if not exists bolao_jogos_temporada_rodada on public.bolao_jogos (temporada, rodada);

-- ---------------------------------------------------------- Sincronização --

-- Igual à do 0002, mais a temporada: vem do football-data (`season.startDate`)
-- e, se um dia não vier, sai do ano da data do jogo — o Brasileirão é um ano
-- só, de janeiro a dezembro.
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
  ano integer;
begin
  select valor into esperado from public.bolao_config where chave = 'segredo_sync';

  if not public.eh_admin()
    and (segredo is null or esperado is null
         or encode(sha256(convert_to(trim(segredo), 'UTF8')), 'hex') <> esperado) then
    raise exception 'sem permissão para sincronizar o bolão' using errcode = '42501';
  end if;

  for item in select * from jsonb_array_elements(jogos)
  loop
    ano := coalesce(
      (item ->> 'temporada')::integer,
      extract(year from ((item ->> 'inicio')::timestamptz at time zone 'America/Sao_Paulo'))::integer
    );

    select * into atual from public.bolao_jogos where id = (item ->> 'id')::bigint;

    if not found then
      if (item ->> 'status') <> 'agendado' and (item ->> 'status') <> 'adiado' then
        continue;
      end if;
      if (item ->> 'inicio')::timestamptz <= now() then
        continue;
      end if;

      insert into public.bolao_jogos (
        id, temporada, rodada, mandante, mandante_sigla, mandante_escudo,
        visitante, visitante_sigla, visitante_escudo,
        inicio, status, gols_mandante, gols_visitante
      ) values (
        (item ->> 'id')::bigint,
        ano,
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
      temporada = ano,
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

-- ------------------------------------------------------------------ Zebra --

-- Igual à do 0004, mas a rodada é da mesma temporada: a zebra da rodada 31 de
-- 2026 não pode travar a rodada 31 de 2027.
create or replace function public.bolao_uma_zebra_por_rodada()
returns trigger
language plpgsql
as $$
declare
  rodada_do_jogo integer;
  temporada_do_jogo integer;
begin
  if not new.dobrado then
    return new;
  end if;

  select rodada, temporada into rodada_do_jogo, temporada_do_jogo
  from public.bolao_jogos where id = new.jogo_id;

  if exists (
    select 1
    from public.bolao_palpites p
    join public.bolao_jogos j on j.id = p.jogo_id
    where p.autor_id = new.autor_id
      and p.jogo_id <> new.jogo_id
      and p.dobrado
      and j.rodada = rodada_do_jogo
      and j.temporada = temporada_do_jogo
      and not public.bolao_aberto(j)
  ) then
    raise exception 'a zebra desta rodada já está num jogo que começou' using errcode = 'P0001';
  end if;

  update public.bolao_palpites p
  set dobrado = false
  from public.bolao_jogos j
  where j.id = p.jogo_id
    and p.autor_id = new.autor_id
    and p.jogo_id <> new.jogo_id
    and p.dobrado
    and j.rodada = rodada_do_jogo
    and j.temporada = temporada_do_jogo;

  return new;
end;
$$;

-- -------------------------------------------------------- Quem palpitou --

-- Versão com a temporada. A de um argumento (0002) fica, para o site que ainda
-- não foi publicado com esta mudança continuar funcionando no meio do caminho;
-- dá para apagar depois do deploy com:
--   drop function public.bolao_quem_palpitou(integer);
create or replace function public.bolao_quem_palpitou(rodada_alvo integer, temporada_alvo integer)
returns table (jogo_id bigint, autor_id uuid)
language sql
stable
security definer
set search_path = public
as $$
  select p.jogo_id, p.autor_id
  from public.bolao_palpites p
  join public.bolao_jogos j on j.id = p.jogo_id
  where j.rodada = rodada_alvo
    and j.temporada = temporada_alvo;
$$;

grant execute on function public.bolao_quem_palpitou(integer, integer) to anon, authenticated;

-- ------------------------------------------------------------------ Views --

-- A temporada de cada palpite, para o histórico ler uma temporada só.
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
         * (case when p.dobrado then 2 else 1 end)
  end as pontos,
  p.resenha,
  p.dobrado,
  case when j.status = 'encerrado'
    then public.bolao_pontos(p.gols_mandante, p.gols_visitante, j.gols_mandante, j.gols_visitante)
  end as pontos_base,
  j.temporada
from public.bolao_palpites p
join public.bolao_jogos j on j.id = p.jogo_id;

-- Uma linha por pessoa e temporada: cada campeonato começa do zero. Toda a
-- bancada aparece em toda temporada que tem jogo, mesmo sem ter pontuado.
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
  count(pp.pontos_base) filter (where pp.pontos_base = 5)::integer as exatos,
  count(pp.pontos_base) filter (where pp.pontos_base >= 2)::integer as resultados,
  count(pp.pontos_base)::integer as jogos_pontuados,
  count(pp.pontos_base) filter (where pp.pontos_base = 3)::integer as vencedor_e_gols,
  count(pp.pontos_base) filter (where pp.pontos_base = 2)::integer as so_vencedor,
  count(pp.pontos_base) filter (where pp.pontos_base = 1)::integer as so_gols,
  t.temporada
from public.perfis pf
cross join (select distinct temporada from public.bolao_jogos) t
left join public.bolao_palpites_pontuados pp on pp.autor_id = pf.id and pp.temporada = t.temporada
where pf.na_bancada or pp.autor_id is not null
group by pf.id, t.temporada;

grant select on public.bolao_palpites_pontuados to anon, authenticated;
grant select on public.bolao_ranking to anon, authenticated;
