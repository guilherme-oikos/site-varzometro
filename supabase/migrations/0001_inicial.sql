-- Estrutura inicial do VARzômetro no Supabase.
--
-- Como rodar: painel do Supabase > SQL Editor > New query > colar este arquivo
-- inteiro > Run. Pode rodar de novo sem quebrar nada (tudo é "if not exists" ou
-- "or replace").
--
-- Quem garante "cada um só mexe no que é seu" é a RLS aqui embaixo, não o
-- painel do site. A chave anônima vai para o navegador de propósito: sem as
-- políticas, ela abriria o banco inteiro.

-- ------------------------------------------------------------------ Perfis --

create table if not exists public.perfis (
  -- Mesmo ID do usuário do Auth: um login, um perfil.
  id uuid primary key references auth.users (id) on delete cascade,
  nome text not null check (char_length(nome) between 1 and 40),
  iniciais text not null check (char_length(iniciais) between 1 and 3),
  clube text not null check (clube in ('SPFC', 'SCCP', 'SEP', 'SFC')),
  papel text not null default 'Comentarista',
  funcao text not null default '',
  bio text not null default '',
  -- Foto do card da bancada (vertical, 3:4) e do avatar do blog (quadrada).
  foto_url text,
  foto_blog_url text,
  -- Só o admin muda estes três (ver trigger abaixo). `na_bancada = false` é
  -- convidado: assina artigo, mas não ganha card na home.
  na_bancada boolean not null default true,
  ordem integer not null default 100,
  is_admin boolean not null default false,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

-- ----------------------------------------------------------------- Artigos --

create table if not exists public.artigos (
  id uuid primary key default gen_random_uuid(),
  -- Nulo enquanto é rascunho que nunca foi publicado. Na primeira publicação o
  -- slug é gerado do título e fica fixo: trocar depois quebraria link já
  -- compartilhado.
  slug text unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  autor_id uuid not null references public.perfis (id) on delete restrict,
  titulo text not null default '',
  resumo text not null default '',
  conteudo text not null default '',
  -- Nulo = selo GERAL (artigo sobre o futebol como um todo).
  clube text check (clube in ('SPFC', 'SCCP', 'SEP', 'SFC')),
  capa_url text,
  capa_alt text,
  capa_credito text,
  tags text[] not null default '{}',
  status text not null default 'rascunho' check (status in ('rascunho', 'publicado')),
  publicado_em timestamptz,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

create index if not exists artigos_publicados_idx
  on public.artigos (publicado_em desc)
  where status = 'publicado';

create index if not exists artigos_autor_idx on public.artigos (autor_id);

-- --------------------------------------------------------------- Funções --

-- `security definer` para a política poder consultar `perfis` sem cair na
-- própria RLS (o que viraria recursão).
create or replace function public.eh_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((select is_admin from public.perfis where id = auth.uid()), false);
$$;

create or replace function public.tocar_atualizado_em()
returns trigger
language plpgsql
as $$
begin
  new.atualizado_em = now();
  return new;
end;
$$;

-- O dono edita tudo do próprio perfil, menos o que organiza o site: quem é
-- admin, quem aparece na bancada e em que ordem. Isso fica com o admin.
-- `auth.uid()` nulo é o SQL Editor ou a chave service_role: passa direto.
create or replace function public.proteger_campos_do_perfil()
returns trigger
language plpgsql
as $$
begin
  if auth.uid() is not null and not public.eh_admin() then
    new.is_admin = old.is_admin;
    new.na_bancada = old.na_bancada;
    new.ordem = old.ordem;
  end if;
  return new;
end;
$$;

-- Ninguém transfere artigo para outro autor, nem troca o slug depois de
-- publicado, a não ser o admin.
create or replace function public.proteger_campos_do_artigo()
returns trigger
language plpgsql
as $$
begin
  if auth.uid() is not null and not public.eh_admin() then
    new.autor_id = old.autor_id;
    if old.slug is not null then
      new.slug = old.slug;
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists perfis_atualizado_em on public.perfis;
create trigger perfis_atualizado_em
  before update on public.perfis
  for each row execute function public.tocar_atualizado_em();

drop trigger if exists perfis_protecao on public.perfis;
create trigger perfis_protecao
  before update on public.perfis
  for each row execute function public.proteger_campos_do_perfil();

drop trigger if exists artigos_atualizado_em on public.artigos;
create trigger artigos_atualizado_em
  before update on public.artigos
  for each row execute function public.tocar_atualizado_em();

drop trigger if exists artigos_protecao on public.artigos;
create trigger artigos_protecao
  before update on public.artigos
  for each row execute function public.proteger_campos_do_artigo();

-- --------------------------------------------------------------------- RLS --

alter table public.perfis enable row level security;
alter table public.artigos enable row level security;

drop policy if exists "perfis: leitura pública" on public.perfis;
create policy "perfis: leitura pública" on public.perfis
  for select using (true);

drop policy if exists "perfis: dono ou admin edita" on public.perfis;
create policy "perfis: dono ou admin edita" on public.perfis
  for update using (auth.uid() = id or public.eh_admin())
  with check (auth.uid() = id or public.eh_admin());

-- Sem política de insert/delete em perfis: conta nova é criada pelo admin
-- (script de migração ou SQL Editor), nunca pelo site.

drop policy if exists "artigos: publicados são públicos" on public.artigos;
create policy "artigos: publicados são públicos" on public.artigos
  for select using (status = 'publicado' or autor_id = auth.uid() or public.eh_admin());

drop policy if exists "artigos: autor cria" on public.artigos;
create policy "artigos: autor cria" on public.artigos
  for insert with check (autor_id = auth.uid());

drop policy if exists "artigos: autor ou admin edita" on public.artigos;
create policy "artigos: autor ou admin edita" on public.artigos
  for update using (autor_id = auth.uid() or public.eh_admin())
  with check (autor_id = auth.uid() or public.eh_admin());

drop policy if exists "artigos: autor ou admin apaga" on public.artigos;
create policy "artigos: autor ou admin apaga" on public.artigos
  for delete using (autor_id = auth.uid() or public.eh_admin());

-- ----------------------------------------------------------------- Storage --

-- Bucket público para leitura (as imagens aparecem no site para qualquer um),
-- 5 MB por arquivo e só formatos de foto. SVG fica de fora: enviado por
-- usuário, poderia carregar script.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('imagens', 'imagens', true, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Cada um escreve só na própria pasta: imagens/<id do usuário>/...
drop policy if exists "imagens: dono envia" on storage.objects;
create policy "imagens: dono envia" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'imagens' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "imagens: dono substitui" on storage.objects;
create policy "imagens: dono substitui" on storage.objects
  for update to authenticated
  using (bucket_id = 'imagens' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "imagens: dono apaga" on storage.objects;
create policy "imagens: dono apaga" on storage.objects
  for delete to authenticated
  using (bucket_id = 'imagens' and (storage.foldername(name))[1] = auth.uid()::text);
