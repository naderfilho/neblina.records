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

  insert into public.profiles (id, email, first_name, last_name, phone, gender, city, state, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'first_name', ''),
    coalesce(new.raw_user_meta_data->>'last_name', ''),
    coalesce(new.raw_user_meta_data->>'phone', ''),
    nullif(new.raw_user_meta_data->>'gender', ''),
    nullif(new.raw_user_meta_data->>'city', ''),
    nullif(new.raw_user_meta_data->>'state', ''),
    v_role
  )
  on conflict (id) do update
    set email = excluded.email,
        first_name = coalesce(nullif(excluded.first_name, ''), public.profiles.first_name),
        last_name  = coalesce(nullif(excluded.last_name, ''),  public.profiles.last_name),
        phone      = coalesce(nullif(excluded.phone, ''),      public.profiles.phone),
        gender     = coalesce(excluded.gender, public.profiles.gender),
        city       = coalesce(excluded.city,   public.profiles.city),
        state      = coalesce(excluded.state,  public.profiles.state),
        role       = greatest_role(public.profiles.role, v_role);
  return new;
end;
$$;

-- helper: mantém admin se já for admin
create or replace function public.greatest_role(a public.user_role, b public.user_role)
returns public.user_role language sql immutable set search_path = public as $$
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
returns trigger language plpgsql set search_path = public as $$
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
--  Usuário ADMIN inicial
--  Crie o admin pelo painel do Supabase (Authentication > Users) ou pelo fluxo
--  de cadastro do site, e adicione o e-mail em public.admin_emails para que o
--  trigger handle_new_user o marque como admin. NÃO versione senhas aqui.
--  (defina a variável psql :admin_email / :admin_password ao rodar manualmente)
-- ============================================================================
-- do $$ ... $$;  -- removido: não guardamos credenciais no repositório

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

-- Foto de perfil, favoritos e registro de venda
alter table public.profiles add column if not exists avatar_url text;

alter table public.records add column if not exists sold boolean not null default false;
alter table public.records add column if not exists sold_channel text;
alter table public.records add column if not exists sold_to_user_id uuid references public.profiles(id) on delete set null;
alter table public.records add column if not exists sold_to_name text;
alter table public.records add column if not exists sold_at timestamptz;
alter table public.records add column if not exists sold_note text;

create table if not exists public.favorites (
  user_id    uuid not null references public.profiles(id) on delete cascade,
  record_id  uuid not null references public.records(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, record_id)
);
create index if not exists favorites_record_idx on public.favorites (record_id);
alter table public.favorites enable row level security;
drop policy if exists favorites_own on public.favorites;
create policy favorites_own on public.favorites for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());

insert into storage.buckets (id, name, public) values ('avatars', 'avatars', true)
  on conflict (id) do update set public = true;
drop policy if exists avatars_public_read on storage.objects;
create policy avatars_public_read on storage.objects for select using (bucket_id = 'avatars');
drop policy if exists avatars_auth_write on storage.objects;
create policy avatars_auth_write on storage.objects for insert with check (bucket_id = 'avatars' and auth.role() = 'authenticated');
drop policy if exists avatars_auth_update on storage.objects;
create policy avatars_auth_update on storage.objects for update using (bucket_id = 'avatars' and auth.role() = 'authenticated');

-- ============================================================================
--  Histórico de ações (auditoria dos admins)
-- ============================================================================
create table if not exists public.audit_log (
  id           uuid primary key default gen_random_uuid(),
  actor_id     uuid references public.profiles(id) on delete set null,
  actor_name   text,
  action       text not null,
  entity       text not null,
  entity_id    uuid,
  entity_label text,
  details      jsonb not null default '{}'::jsonb,
  created_at   timestamptz not null default now()
);
create index if not exists audit_log_created_idx on public.audit_log (created_at desc);
alter table public.audit_log enable row level security;
drop policy if exists audit_admin_read on public.audit_log;
create policy audit_admin_read on public.audit_log for select using (public.is_admin());

create or replace function public.log_action(
  p_action text, p_entity text, p_entity_id uuid, p_entity_label text, p_details jsonb default '{}'::jsonb
) returns void
language plpgsql security definer set search_path = public as $$
declare v_name text;
begin
  if not public.is_admin() then return; end if;
  select nullif(trim(coalesce(first_name,'') || ' ' || coalesce(last_name,'')), '')
    into v_name from public.profiles where id = auth.uid();
  insert into public.audit_log (actor_id, actor_name, action, entity, entity_id, entity_label, details)
  values (auth.uid(), coalesce(v_name, (select email from public.profiles where id = auth.uid())),
          p_action, p_entity, p_entity_id, p_entity_label, coalesce(p_details, '{}'::jsonb));
end $$;
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

-- ============================================================================
--  Data de nascimento no perfil (promoções de aniversário)
-- ============================================================================
alter table public.profiles add column if not exists birth_date date;

-- Gênero e localização (coletados no cadastro; usados nos filtros do admin)
alter table public.profiles add column if not exists gender text;
alter table public.profiles add column if not exists city   text;
alter table public.profiles add column if not exists state  text;

-- ============================================================================
--  Uso da Neblina IA (custo por chamada — gasto em tempo real no admin)
-- ============================================================================
create table if not exists public.ai_usage (
  id            uuid primary key default gen_random_uuid(),
  actor_id      uuid references public.profiles(id) on delete set null,
  action        text not null,
  model         text,
  cost_usd      numeric not null default 0,
  input_tokens  integer,
  output_tokens integer,
  created_at    timestamptz not null default now()
);
create index if not exists ai_usage_created_idx on public.ai_usage (created_at desc);
alter table public.ai_usage enable row level security;
drop policy if exists ai_usage_admin_read on public.ai_usage;
create policy ai_usage_admin_read on public.ai_usage for select using (public.is_admin());
drop policy if exists ai_usage_admin_insert on public.ai_usage;
create policy ai_usage_admin_insert on public.ai_usage for insert with check (public.is_admin());

-- Disponibilidade do disco (peca unica): available | reserved | sold
alter table public.records add column if not exists availability text not null default 'available';
-- Tags: fonte e tamanho da etiqueta
alter table public.tags add column if not exists font text not null default 'sans';
alter table public.tags add column if not exists size text not null default 'sm';

-- Capa/label do Lado B, disco autografado e respostas de comentários
alter table public.records  add column if not exists cover_image_url_b text;
alter table public.records  add column if not exists is_autographed boolean not null default false;
alter table public.records  add column if not exists autograph_photo_url text;
alter table public.comments add column if not exists parent_id uuid references public.comments(id) on delete cascade;
create index if not exists comments_parent_idx on public.comments (parent_id);

-- ============================================================================
--  BOXES (box sets) — caixas com vários discos dentro (discos vinculados)
-- ============================================================================
create table if not exists public.boxes (
  id              uuid primary key default gen_random_uuid(),
  title           text not null,
  subtitle        text,
  box_type        text,
  description     text,
  cover_image_url text,
  spine_image_url text,
  back_image_url  text,
  box_config      jsonb not null default '{}'::jsonb,      -- visual 3D (acabamento/cor)
  year            int,
  catalog_number  text,
  label_company   text,
  price           numeric(10,2) not null default 0,
  payment_methods text[] not null default '{}',
  availability    text not null default 'available',
  audioteca_tier  text not null default 'public',
  is_published    boolean not null default true,
  is_featured     boolean not null default false,
  is_autographed  boolean not null default false,
  autograph_photo_url text,
  sort_order      int not null default 0,
  views_count     int not null default 0,
  tag_ids         text[] not null default '{}',
  extra_blocks    jsonb not null default '[]'::jsonb,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index if not exists boxes_published_idx on public.boxes (is_published);
create index if not exists boxes_sort_idx on public.boxes (sort_order asc, created_at desc);
create index if not exists boxes_type_idx on public.boxes (box_type);

-- join ordenado box -> discos (um disco pode estar num box e ainda aparecer solto)
create table if not exists public.box_records (
  box_id     uuid not null references public.boxes(id) on delete cascade,
  record_id  uuid not null references public.records(id) on delete cascade,
  position   int not null default 0,
  created_at timestamptz not null default now(),
  primary key (box_id, record_id)
);
create index if not exists box_records_box_idx on public.box_records (box_id, position);
create index if not exists box_records_record_idx on public.box_records (record_id);

-- discos exclusivos de um box (cadastrados junto do box, fora do catálogo)
alter table public.records add column if not exists box_only boolean not null default false;
create index if not exists records_box_only_idx on public.records (box_only);

-- CUSTO / valor pago na aquisição (privado, só admin) — para calcular lucro.
-- Fica no disco (inclui os do box) e no box. Nunca é exposto na área pública.
alter table public.records add column if not exists cost numeric(10,2);
alter table public.boxes   add column if not exists cost numeric(10,2);
-- records.cost já nasce protegido (anon não tem SELECT de colunas internas).
-- boxes tem grant de tabela para anon, então revogamos explicitamente a coluna cost.
revoke select (cost) on public.boxes from anon;

-- ============================================================================
--  Endurecimento (defesa em profundidade) — reduz a superfície das funções
--  expostas via API. A segurança principal continua no RLS.
-- ============================================================================
-- funções que só o admin usa não ficam ao alcance do anon (já eram travadas por is_admin)
revoke execute on function public.broadcast_notification(text, text, text, text, uuid) from anon;
revoke execute on function public.set_records_order(uuid[]) from anon;
revoke execute on function public.records_with_audio() from anon;
revoke execute on function public.log_action(text, text, uuid, text, jsonb) from anon;
revoke execute on function public.touch_last_login() from anon;
-- funções de gatilho/evento não devem ser chamáveis via API por ninguém
revoke execute on function public.handle_new_user() from anon, authenticated;
revoke execute on function public.rls_auto_enable() from anon, authenticated;
-- OBS: is_admin(), increment_record_views() e increment_box_views() continuam
-- executáveis por anon — o RLS e as páginas públicas dependem delas.

-- ============================================================================
--  CUPONS de desconto + boas-vindas
-- ============================================================================
create table if not exists public.coupons (
  id               uuid primary key default gen_random_uuid(),
  code             text not null unique,
  discount_percent int not null check (discount_percent between 1 and 100),
  user_id          uuid references public.profiles(id) on delete cascade, -- null = geral
  description      text,
  expires_at       timestamptz,
  is_active        boolean not null default true,
  redeemed_at      timestamptz,
  created_at       timestamptz not null default now()
);
create index if not exists coupons_user_idx on public.coupons (user_id);
create index if not exists coupons_active_idx on public.coupons (is_active);
alter table public.coupons enable row level security;
drop policy if exists coupons_read on public.coupons;
create policy coupons_read on public.coupons
  for select using (user_id = auth.uid() or (user_id is null and is_active) or public.is_admin());
drop policy if exists coupons_admin_write on public.coupons;
create policy coupons_admin_write on public.coupons
  for all using (public.is_admin()) with check (public.is_admin());

-- boas-vindas: marca quando o admin já tratou o cadastro novo
alter table public.profiles add column if not exists welcomed_at timestamptz;

-- admin pode inserir uma notificação avulsa (ex.: aviso de cupom para 1 cliente)
drop policy if exists notifications_admin_insert on public.notifications;
create policy notifications_admin_insert on public.notifications
  for insert with check (public.is_admin());

drop trigger if exists boxes_set_updated_at on public.boxes;
create trigger boxes_set_updated_at
  before update on public.boxes
  for each row execute function public.set_updated_at();

create or replace function public.increment_box_views(p_box_id uuid)
returns void language sql security definer set search_path = public as $$
  update public.boxes set views_count = views_count + 1 where id = p_box_id;
$$;

alter table public.boxes       enable row level security;
alter table public.box_records enable row level security;

drop policy if exists boxes_public_read on public.boxes;
create policy boxes_public_read on public.boxes
  for select using (is_published or public.is_admin());
drop policy if exists boxes_admin_write on public.boxes;
create policy boxes_admin_write on public.boxes
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists box_records_public_read on public.box_records;
create policy box_records_public_read on public.box_records
  for select using (true);
drop policy if exists box_records_admin_write on public.box_records;
create policy box_records_admin_write on public.box_records
  for all using (public.is_admin()) with check (public.is_admin());

-- disco também é legível publicamente se pertence a um box publicado (discos "só no box")
drop policy if exists records_public_read on public.records;
create policy records_public_read on public.records
  for select using (
    is_published
    or public.is_admin()
    or exists (
      select 1 from public.box_records br
      join public.boxes bx on bx.id = br.box_id
      where br.record_id = records.id and bx.is_published
    )
  );
