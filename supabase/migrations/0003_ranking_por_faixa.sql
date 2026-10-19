-- Ranking do bolão com quantas vezes cada um fez +5, +3, +2 e +1.
--
-- Como rodar: SQL Editor > New query > colar este arquivo inteiro > Run. Pode
-- rodar de novo sem quebrar nada. Precisa do 0002_bolao.sql antes.
--
-- `exatos` e `resultados` continuam (são o desempate). As colunas novas entram
-- no fim: `create or replace view` só aceita coluna nova depois das que já
-- existem.

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
  count(pp.pontos)::integer as jogos_pontuados,
  count(pp.pontos) filter (where pp.pontos = 3)::integer as vencedor_e_gols,
  count(pp.pontos) filter (where pp.pontos = 2)::integer as so_vencedor,
  count(pp.pontos) filter (where pp.pontos = 1)::integer as so_gols
from public.perfis pf
left join public.bolao_palpites_pontuados pp on pp.autor_id = pf.id
where pf.na_bancada or pp.autor_id is not null
group by pf.id;

grant select on public.bolao_ranking to anon, authenticated;
