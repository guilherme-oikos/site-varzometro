-- Contador de visualizações dos artigos do blog.
--
-- Como rodar: SQL Editor > New query > colar este arquivo inteiro > Run. Pode
-- rodar de novo sem quebrar nada. Precisa do 0001_inicial.sql antes.
--
-- Um número por artigo e mais nada: sem IP, sem cookie, sem quem leu. Cada
-- abertura da página soma 1 (recarregar conta de novo, de propósito).
--
-- Tabela à parte, e não coluna em `artigos`: o dono pode editar a própria
-- linha de `artigos` pela RLS, e daria para inflar o próprio contador. Aqui
-- ninguém escreve direto — só pelas funções abaixo, que são `security definer`.

create table if not exists public.artigo_visualizacoes (
  artigo_id uuid primary key references public.artigos (id) on delete cascade,
  total bigint not null default 0 check (total >= 0),
  atualizado_em timestamptz not null default now()
);

-- RLS ligada sem política nenhuma: ninguém lê nem escreve a tabela direto.
alter table public.artigo_visualizacoes enable row level security;

-- Soma 1 e devolve o total. Só conta artigo publicado: slug de rascunho (que
-- nem existe) ou inventado devolve nulo e não cria linha.
create or replace function public.registrar_visualizacao(slug_alvo text)
returns bigint
language plpgsql
security definer
set search_path = public
as $$
declare
  alvo uuid;
  novo bigint;
begin
  select id into alvo from public.artigos where slug = slug_alvo and status = 'publicado';
  if alvo is null then
    return null;
  end if;

  insert into public.artigo_visualizacoes as v (artigo_id, total)
  values (alvo, 1)
  on conflict (artigo_id) do update set total = v.total + 1, atualizado_em = now()
  returning v.total into novo;

  return novo;
end;
$$;

-- Os totais de uma lista de artigos (a página do blog pede todos de uma vez).
-- Artigo publicado que ninguém abriu ainda vem com zero.
create or replace function public.visualizacoes_dos_artigos(slugs text[])
returns table (slug text, total bigint)
language sql
stable
security definer
set search_path = public
as $$
  select a.slug, coalesce(v.total, 0)
  from public.artigos a
  left join public.artigo_visualizacoes v on v.artigo_id = a.id
  where a.status = 'publicado' and a.slug = any (slugs);
$$;

grant execute on function public.registrar_visualizacao(text) to anon, authenticated;
grant execute on function public.visualizacoes_dos_artigos(text[]) to anon, authenticated;
