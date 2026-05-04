-- ============================================================================
-- Cantina — esquema base. Pegar en Supabase SQL Editor y ejecutar.
-- Después: en Database > Replication, habilita Realtime para `queue_items`
-- y `venues` (necesario para que las suscripciones funcionen).
-- ============================================================================

-- Extensiones (uuid generator)
create extension if not exists "uuid-ossp";

-- ─────────────────────────────────────────────────────────────────────────────
-- venues: cada bar / discoteca
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists public.venues (
  id uuid primary key default uuid_generate_v4(),
  slug text not null unique,
  name text not null,
  allowed_genres text[] not null default '{}',
  blocked_track_ids text[] not null default '{}',
  request_cooldown_sec integer not null default 60,
  allow_explicit boolean not null default true,
  tip_enabled boolean not null default true,
  tip_price_cop integer not null default 5000,
  created_at timestamptz not null default now()
);

-- ─────────────────────────────────────────────────────────────────────────────
-- queue_items: la cola activa + histórico
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists public.queue_items (
  id uuid primary key default uuid_generate_v4(),
  venue_id uuid not null references public.venues(id) on delete cascade,
  -- Snapshot completo del track resuelto (ResolvedTrack en TS)
  track jsonb not null,
  requested_by text not null,
  requested_by_name text,
  position bigint not null,
  boosted boolean not null default false,
  status text not null default 'queued' check (status in ('queued','playing','played','skipped')),
  created_at timestamptz not null default now()
);

create index if not exists queue_items_venue_status_pos
  on public.queue_items (venue_id, status, position);

create index if not exists queue_items_venue_created
  on public.queue_items (venue_id, created_at desc);

-- ─────────────────────────────────────────────────────────────────────────────
-- youtube_resolutions: cache de spotify_id → youtube_video_id
-- (evita re-resolver canciones populares — ahorra cuota de YouTube API)
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists public.youtube_resolutions (
  spotify_id text primary key,
  youtube_video_id text not null,
  is_official boolean not null default false,
  has_video boolean not null default true,
  resolved_at timestamptz not null default now()
);

-- ─────────────────────────────────────────────────────────────────────────────
-- RLS — anon puede leer venues+queue, insertar queue. Solo admin (futuro)
-- modifica venues. Para MVP: políticas permisivas en escritura, endurecer luego.
-- ─────────────────────────────────────────────────────────────────────────────
alter table public.venues enable row level security;
alter table public.queue_items enable row level security;
alter table public.youtube_resolutions enable row level security;

-- venues: lectura pública
drop policy if exists "venues_read" on public.venues;
create policy "venues_read" on public.venues for select using (true);

-- venues: writes desde anon (MVP — sustituir con auth admin más tarde)
drop policy if exists "venues_write_anon" on public.venues;
create policy "venues_write_anon" on public.venues for update using (true) with check (true);

-- queue_items: lectura pública
drop policy if exists "queue_read" on public.queue_items;
create policy "queue_read" on public.queue_items for select using (true);

-- queue_items: cualquiera puede insertar (cliente del bar)
drop policy if exists "queue_insert_anon" on public.queue_items;
create policy "queue_insert_anon" on public.queue_items for insert with check (true);

-- queue_items: cualquiera puede update / delete (admin del bar — endurecer luego)
drop policy if exists "queue_update_anon" on public.queue_items;
create policy "queue_update_anon" on public.queue_items for update using (true) with check (true);

drop policy if exists "queue_delete_anon" on public.queue_items;
create policy "queue_delete_anon" on public.queue_items for delete using (true);

-- youtube_resolutions: lectura/escritura pública (es solo cache)
drop policy if exists "yt_res_read" on public.youtube_resolutions;
create policy "yt_res_read" on public.youtube_resolutions for select using (true);
drop policy if exists "yt_res_write" on public.youtube_resolutions;
create policy "yt_res_write" on public.youtube_resolutions for insert with check (true);

-- ─────────────────────────────────────────────────────────────────────────────
-- Habilitar Realtime para las tablas (también puedes hacerlo en UI)
-- ─────────────────────────────────────────────────────────────────────────────
alter publication supabase_realtime add table public.queue_items;
alter publication supabase_realtime add table public.venues;

-- IMPORTANTE: REPLICA IDENTITY FULL hace que los eventos DELETE incluyan
-- TODA la fila vieja (no solo el PK), lo que permite que filtros como
-- `venue_id=eq.X` funcionen para DELETE. Sin esto, los DELETE realtime
-- nunca pasan el filtro y la cola no se actualiza al borrar items.
alter table public.queue_items replica identity full;
alter table public.venues replica identity full;

-- ─────────────────────────────────────────────────────────────────────────────
-- Seed: venue de prueba con slug "demo"
-- ─────────────────────────────────────────────────────────────────────────────
insert into public.venues (slug, name, allowed_genres, request_cooldown_sec, tip_price_cop)
values ('demo', 'Bar Demo · Cantina', '{}', 30, 5000)
on conflict (slug) do nothing;
