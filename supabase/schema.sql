-- ============================================================================
--  NEBLINA RECORDS — Schema completo (Supabase / PostgreSQL)
--  Cole este arquivo inteiro no SQL Editor do Supabase e execute.
--  Idempotente: pode rodar mais de uma vez sem quebrar.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Extensões
-- ----------------------------------------------------------------------------
create extension if not exists "pgcrypto";

-- ----------------------------------------------------------------------------
-- Enums
-- ----------------------------------------------------------------------------
do $$ begin
  create type public.quality_grade as enum ('Poor', 'Fair', 'Good', 'Very Good', 'Excellent');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.user_role as enum ('customer', 'admin');
exception when duplicate_object then null; end $$;

-- ----------------------------------------------------------------------------
-- Tabela de e-mails com acesso admin (o admin é "designado pelo banco")
-- ----------------------------------------------------------------------------
create table if not exists public.admin_emails (
  email text primary key,
  created_at timestamptz not null default now()
);

-- Admins
insert into public.admin_emails (email) values
  ('admin@example.com'),
  ('admin2@example.com'),
  ('admin3@example.com')
on conflict (email) do nothing;

-- ----------------------------------------------------------------------------
-- Perfis (estende auth.users)
-- ----------------------------------------------------------------------------
create table if not exists public.profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  first_name    text,
  last_name     text,
  email         text,
  phone         text,
  role          public.user_role not null default 'customer',
  created_at    timestamptz not null default now(),
  last_login_at timestamptz
);

-- ----------------------------------------------------------------------------
-- Discos
-- ----------------------------------------------------------------------------
create table if not exists public.records (
  id              uuid primary key default gen_random_uuid(),
  title           text not null,                       -- nome do disco
  artist          text not null,                       -- autor / banda / grupo
  genre           text,                                -- estilo musical
  nationality     text,                                -- nacionalidade
  format          text,                                -- tipo de disco (LP, EP, Single, CD...)
  weight_grams    numeric(10,1),                       -- peso do disco
  disc_quality    public.quality_grade,                -- qualidade do disco
  cover_quality   public.quality_grade,                -- qualidade da capa
  price           numeric(10,2) not null default 0,
  payment_methods text[] not null default '{}',        -- formas de pagamento
  description     text,                                -- descrição rica
  cover_image_url text,                                -- foto original da capa (recortada como label)
  disc_config     jsonb not null default '{}'::jsonb,  -- config do vinil (cor, borda, label, etc.)
  audio_url       text,                                -- arquivo de áudio que toca na home
  audio_start     numeric(10,2) not null default 0,    -- início do trecho (segundos)
  audio_end       numeric(10,2),                       -- fim do trecho (segundos)
  extra_blocks    jsonb not null default '[]'::jsonb,  -- blocos livres montados pelo admin
  year            int,
  catalog_number  text,
  label_company   text,                                -- gravadora
  views_count     int not null default 0,
  stock_qty       int not null default 1,
  is_published    boolean not null default true,
  is_featured     boolean not null default false,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists records_genre_idx        on public.records (genre);
create index if not exists records_nationality_idx   on public.records (nationality);
create index if not exists records_artist_idx        on public.records (artist);
create index if not exists records_published_idx     on public.records (is_published);
create index if not exists records_created_idx       on public.records (created_at desc);

-- ----------------------------------------------------------------------------
-- Fotos reais do disco (aparecem só na subpágina)
-- ----------------------------------------------------------------------------
create table if not exists public.record_photos (
  id         uuid primary key default gen_random_uuid(),
  record_id  uuid not null references public.records(id) on delete cascade,
  url        text not null,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists record_photos_record_idx on public.record_photos (record_id);

-- ----------------------------------------------------------------------------
-- Comentários / perguntas públicas (usuário cadastrado; admin pode apagar)
-- ----------------------------------------------------------------------------
create table if not exists public.comments (
  id          uuid primary key default gen_random_uuid(),
  record_id   uuid not null references public.records(id) on delete cascade,
  user_id     uuid references public.profiles(id) on delete set null,
  author_name text,
  body        text not null,
  is_question boolean not null default false,
  created_at  timestamptz not null default now()
);
create index if not exists comments_record_idx on public.comments (record_id, created_at desc);

-- ----------------------------------------------------------------------------
-- Pedidos de evento (empresas/cidades que querem contratar a Neblina)
-- ----------------------------------------------------------------------------
create table if not exists public.event_requests (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  company      text,
  email        text,
  phone        text,
  city         text,
  event_type   text,
  event_date   date,
  message      text,
  status       text not null default 'new',
  created_at   timestamptz not null default now()
);

-- ============================================================================
--  Funções auxiliares
-- ============================================================================

-- Verifica se o usuário atual é admin (SECURITY DEFINER evita recursão de RLS)
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  );
$$;

-- Ao criar um usuário no auth, cria o perfil; se o e-mail estiver em admin_emails, vira admin
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role public.user_role := 'customer';
begin
  if exists (select 1 from public.admin_emails a where lower(a.email) = lower(new.email)) then
    v_role := 'admin';
  end if;

  insert into public.profiles (id, email, first_name, last_name, phone, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'first_name', ''),
    coalesce(new.raw_user_meta_data->>'last_name', ''),
    coalesce(new.raw_user_meta_data->>'phone', ''),
    v_role
  )
  on conflict (id) do update
    set email = excluded.email,
        first_name = coalesce(nullif(excluded.first_name, ''), public.profiles.first_name),
        last_name  = coalesce(nullif(excluded.last_name, ''),  public.profiles.last_name),
        phone      = coalesce(nullif(excluded.phone, ''),      public.profiles.phone),
        role       = greatest_role(public.profiles.role, v_role);
  return new;
end;
$$;

-- helper: mantém admin se já for admin
create or replace function public.greatest_role(a public.user_role, b public.user_role)
returns public.user_role language sql immutable as $$
  select case when a = 'admin' or b = 'admin' then 'admin'::public.user_role else 'customer'::public.user_role end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Registra último login
create or replace function public.touch_last_login()
returns void
language sql
security definer
set search_path = public
as $$
  update public.profiles set last_login_at = now() where id = auth.uid();
$$;

-- Incrementa contador de visitas de um disco
create or replace function public.increment_record_views(p_record_id uuid)
returns void
language sql
security definer
set search_path = public
as $$
  update public.records set views_count = views_count + 1 where id = p_record_id;
$$;

-- updated_at automático
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;

drop trigger if exists records_set_updated_at on public.records;
create trigger records_set_updated_at
  before update on public.records
  for each row execute function public.set_updated_at();

-- ============================================================================
--  Row Level Security
-- ============================================================================
alter table public.profiles       enable row level security;
alter table public.records        enable row level security;
alter table public.record_photos  enable row level security;
alter table public.comments       enable row level security;
alter table public.event_requests enable row level security;
alter table public.admin_emails   enable row level security;

-- profiles
drop policy if exists profiles_select_own_or_admin on public.profiles;
create policy profiles_select_own_or_admin on public.profiles
  for select using (id = auth.uid() or public.is_admin());

drop policy if exists profiles_update_own_or_admin on public.profiles;
create policy profiles_update_own_or_admin on public.profiles
  for update using (id = auth.uid() or public.is_admin());

-- records: leitura pública dos publicados; admin faz tudo
drop policy if exists records_public_read on public.records;
create policy records_public_read on public.records
  for select using (is_published or public.is_admin());

drop policy if exists records_admin_write on public.records;
create policy records_admin_write on public.records
  for all using (public.is_admin()) with check (public.is_admin());

-- record_photos
drop policy if exists record_photos_public_read on public.record_photos;
create policy record_photos_public_read on public.record_photos
  for select using (true);

drop policy if exists record_photos_admin_write on public.record_photos;
create policy record_photos_admin_write on public.record_photos
  for all using (public.is_admin()) with check (public.is_admin());

-- comments: leitura pública; usuário autenticado cria o próprio; admin/dono apaga
drop policy if exists comments_public_read on public.comments;
create policy comments_public_read on public.comments
  for select using (true);

drop policy if exists comments_auth_insert on public.comments;
create policy comments_auth_insert on public.comments
  for insert with check (auth.uid() = user_id);

drop policy if exists comments_delete_own_or_admin on public.comments;
create policy comments_delete_own_or_admin on public.comments
  for delete using (user_id = auth.uid() or public.is_admin());

-- event_requests: qualquer um cria; só admin lê
drop policy if exists event_requests_insert_any on public.event_requests;
create policy event_requests_insert_any on public.event_requests
  for insert with check (true);

drop policy if exists event_requests_admin_read on public.event_requests;
create policy event_requests_admin_read on public.event_requests
  for select using (public.is_admin());

drop policy if exists event_requests_admin_update on public.event_requests;
create policy event_requests_admin_update on public.event_requests
  for update using (public.is_admin());

-- admin_emails: só admin gerencia
drop policy if exists admin_emails_admin_all on public.admin_emails;
create policy admin_emails_admin_all on public.admin_emails
  for all using (public.is_admin()) with check (public.is_admin());

-- ============================================================================
--  Storage (buckets públicos para leitura)
-- ============================================================================
insert into storage.buckets (id, name, public) values ('covers', 'covers', true)
  on conflict (id) do update set public = true;
insert into storage.buckets (id, name, public) values ('record-photos', 'record-photos', true)
  on conflict (id) do update set public = true;
insert into storage.buckets (id, name, public) values ('audio', 'audio', true)
  on conflict (id) do update set public = true;

-- Leitura pública dos buckets
drop policy if exists storage_public_read on storage.objects;
create policy storage_public_read on storage.objects
  for select using (bucket_id in ('covers', 'record-photos', 'audio'));

-- Somente admin faz upload/alteração/remoção
drop policy if exists storage_admin_write on storage.objects;
create policy storage_admin_write on storage.objects
  for insert with check (bucket_id in ('covers','record-photos','audio') and public.is_admin());

drop policy if exists storage_admin_update on storage.objects;
create policy storage_admin_update on storage.objects
  for update using (bucket_id in ('covers','record-photos','audio') and public.is_admin());

drop policy if exists storage_admin_delete on storage.objects;
create policy storage_admin_delete on storage.objects
  for delete using (bucket_id in ('covers','record-photos','audio') and public.is_admin());

-- ============================================================================
--  Usuário ADMIN inicial (admin@example.com / senha: neblina2001)
--  Cria a conta já confirmada. O trigger handle_new_user o marca como admin
--  porque o e-mail está em admin_emails. Rode uma única vez.
-- ============================================================================
do $$
declare
  uid uuid := gen_random_uuid();
begin
  if not exists (select 1 from auth.users where email = 'admin@example.com') then
    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, created_at, updated_at,
      raw_app_meta_data, raw_user_meta_data,
      confirmation_token, recovery_token, email_change_token_new, email_change
    ) values (
      '00000000-0000-0000-0000-000000000000', uid, 'authenticated', 'authenticated',
      'admin@example.com', crypt('neblina2001', gen_salt('bf')),
      now(), now(), now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"first_name":"Nader","last_name":"Filho","phone":""}'::jsonb,
      '', '', '', ''
    );
    insert into auth.identities (
      id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at
    ) values (
      gen_random_uuid(), uid, uid::text,
      jsonb_build_object('sub', uid::text, 'email', 'admin@example.com', 'email_verified', true),
      'email', now(), now(), now()
    );
  end if;
end $$;

-- ============================================================================
--  Fim
-- ============================================================================

-- ============================================================================
--  Expansão do admin (campos extras, categorias de foto, faixas e tags)
-- ============================================================================
alter table public.records add column if not exists tracks jsonb not null default '[]'::jsonb;
alter table public.records add column if not exists home_track_id text;
alter table public.records add column if not exists condition jsonb not null default '{}'::jsonb;
alter table public.records add column if not exists included_content jsonb not null default '{}'::jsonb;
alter table public.records add column if not exists history jsonb not null default '{}'::jsonb;
alter table public.records add column if not exists market jsonb not null default '{}'::jsonb;
alter table public.records add column if not exists identification jsonb not null default '{}'::jsonb;
alter table public.records add column if not exists sale_info jsonb not null default '{}'::jsonb;
alter table public.records add column if not exists tag_ids text[] not null default '{}';
alter table public.records add column if not exists sort_order int not null default 0;
alter table public.records add column if not exists is_gatefold boolean not null default false;
alter table public.records add column if not exists gatefold_image_url text;
alter table public.records add column if not exists gatefold_dir text not null default 'side';  -- 'side' | 'down'
alter table public.records add column if not exists audioteca_tier text not null default 'public';  -- 'public' | 'members' | 'signature'
alter table public.record_photos add column if not exists category text not null default 'outro';
create index if not exists records_sort_idx on public.records (sort_order asc, created_at desc);

create table if not exists public.tags (
  id uuid primary key default gen_random_uuid(),
  label text not null,
  bg text not null default '#ff9d2e',
  fg text not null default '#241304',
  style text not null default 'solid',
  created_at timestamptz not null default now()
);
alter table public.tags enable row level security;
drop policy if exists tags_public_read on public.tags;
create policy tags_public_read on public.tags for select using (true);
drop policy if exists tags_admin_write on public.tags;
create policy tags_admin_write on public.tags for all using (public.is_admin()) with check (public.is_admin());

-- ============================================================================
--  Configurações do site (música global da home + etiqueta do mini-player)
-- ============================================================================
create table if not exists public.site_settings (
  id               text primary key default 'main',
  home_record_id   uuid references public.records(id) on delete set null,
  home_track_id    text,
  home_tag_id      uuid references public.tags(id) on delete set null,
  home_track_start numeric(10,2) not null default 0,   -- trecho da música da home
  home_track_end   numeric(10,2),
  updated_at       timestamptz not null default now()
);
alter table public.site_settings add column if not exists home_track_start numeric(10,2) not null default 0;
alter table public.site_settings add column if not exists home_track_end numeric(10,2);
insert into public.site_settings (id) values ('main') on conflict (id) do nothing;
alter table public.site_settings enable row level security;
drop policy if exists site_settings_public_read on public.site_settings;
create policy site_settings_public_read on public.site_settings for select using (true);
drop policy if exists site_settings_admin_write on public.site_settings;
create policy site_settings_admin_write on public.site_settings for all using (public.is_admin()) with check (public.is_admin());
