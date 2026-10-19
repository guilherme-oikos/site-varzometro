-- Bolão: resenha no palpite e zebra da rodada.
--
-- Como rodar: SQL Editor > New query > colar este arquivo inteiro > Run. Pode
-- rodar de novo sem quebrar nada. Precisa do 0002_bolao.sql e do
-- 0003_ranking_por_faixa.sql antes.
--
-- As duas coisas moram na própria linha do palpite, de propósito: herdam a
-- RLS que já existe. Só o dono escreve, só até o apito (`bolao_aberto`), e
-- ninguém vê antes de a bola rolar (`bolao_visivel`) — nem a frase, nem em
-- qual jogo a pessoa jogou a zebra.

-- --------------------------------------------------------------- Colunas --

-- Frase curta junto do placar ("o Peixe não perde na Vila nem a pau").
alter table public.bolao_palpites add column if not exists resenha text;
alter table public.bolao_palpites drop constraint if exists bolao_palpites_resenha_tamanho;
alter table public.bolao_palpites add constraint bolao_palpites_resenha_tamanho
  check (resenha is null or char_length(resenha) between 1 and 80);

-- Zebra da rodada: um jogo por rodada vale o dobro.
alter table public.bolao_palpites add column if not exists dobrado boolean not null default false;

-- ------------------------------------------------------------------ Zebra --

-- Uma zebra por rodada. Marcar outra tira a do jogo anterior — desde que ele
-- ainda não tenha começado: zebra de jogo que já rolou fica, e aí a nova é
-- recusada. Roda com a permissão de quem salvou (não é security definer):
-- só mexe nos palpites da própria pessoa, que a RLS deixa.
create or replace function public.bolao_uma_zebra_por_rodada()
returns trigger
language plpgsql
as $$
declare
  rodada_do_jogo integer;
begin
  if not new.dobrado then
    return new;
  end if;

  select rodada into rodada_do_jogo from public.bolao_jogos where id = new.jogo_id;

  if exists (
    select 1
    from public.bolao_palpites p
    join public.bolao_jogos j on j.id = p.jogo_id
    where p.autor_id = new.autor_id
      and p.jogo_id <> new.jogo_id
      and p.dobrado
      and j.rodada = rodada_do_jogo
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
    and j.rodada = rodada_do_jogo;

  return new;
end;
$$;

drop trigger if exists bolao_palpites_zebra on public.bolao_palpites;
create trigger bolao_palpites_zebra
  before insert or update of dobrado on public.bolao_palpites
  for each row execute function public.bolao_uma_zebra_por_rodada();

-- ------------------------------------------------------------------ Views --

-- `pontos` passa a contar a zebra (o dobro); `pontos_base` é a faixa da regra
-- (5, 3, 2, 1, 0), que é o que conta placar exato e resultado certo. Colunas
-- novas no fim: `create or replace view` só aceita coluna nova depois das que
-- já existem.
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
  end as pontos_base
from public.bolao_palpites p
join public.bolao_jogos j on j.id = p.jogo_id;

-- Total com a zebra; as faixas e o desempate pela regra, sem ela.
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
  count(pp.pontos_base) filter (where pp.pontos_base = 1)::integer as so_gols
from public.perfis pf
left join public.bolao_palpites_pontuados pp on pp.autor_id = pf.id
where pf.na_bancada or pp.autor_id is not null
group by pf.id;

grant select on public.bolao_palpites_pontuados to anon, authenticated;
grant select on public.bolao_ranking to anon, authenticated;
