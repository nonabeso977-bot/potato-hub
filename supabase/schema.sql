-- POTATO HUB database foundation
-- Run this file in the Supabase SQL Editor.
create extension if not exists pgcrypto;

create table if not exists public.games (
 id uuid primary key default gen_random_uuid(),
 slug text unique not null,
 name text not null,
 category text not null default 'أخرى',
 version text not null default '1.0.0',
 description text not null default '',
 kind text not null default 'game',
 status text not null default 'available' check(status in ('available','coming-soon','maintenance')),
 cover_url text,
 demo_url text,
 download_url text,
 published boolean not null default false,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);

create table if not exists public.game_updates (
 id uuid primary key default gen_random_uuid(),
 game_id uuid not null references public.games(id) on delete cascade,
 version text not null,
 title text not null,
 notes text not null default '',
 released_at timestamptz not null default now(),
 created_at timestamptz not null default now(),
 unique(game_id,version)
);

create table if not exists public.user_library (
 user_id uuid not null references auth.users(id) on delete cascade,
 game_id uuid not null references public.games(id) on delete cascade,
 installed_version text,
 added_at timestamptz not null default now(),
 primary key(user_id,game_id)
);

create table if not exists public.push_subscriptions (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references auth.users(id) on delete cascade,
 endpoint text not null unique,
 subscription jsonb not null,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);

create index if not exists game_updates_game_released_idx on public.game_updates(game_id,released_at desc);
create index if not exists user_library_user_idx on public.user_library(user_id);
create index if not exists push_subscriptions_user_idx on public.push_subscriptions(user_id);

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists games_set_updated_at on public.games;
create trigger games_set_updated_at before update on public.games
for each row execute function public.set_updated_at();

alter table public.games enable row level security;
alter table public.game_updates enable row level security;
alter table public.user_library enable row level security;
alter table public.push_subscriptions enable row level security;

drop policy if exists "Published games are readable" on public.games;
create policy "Published games are readable" on public.games for select using(published=true);

drop policy if exists "Updates for published games are readable" on public.game_updates;
create policy "Updates for published games are readable" on public.game_updates for select using(
 exists(select 1 from public.games g where g.id=game_id and g.published=true)
);

drop policy if exists "Users read their own library" on public.user_library;
create policy "Users read their own library" on public.user_library for select using(auth.uid()=user_id);
drop policy if exists "Users add to their own library" on public.user_library;
create policy "Users add to their own library" on public.user_library for insert with check(auth.uid()=user_id);
drop policy if exists "Users update their own library" on public.user_library;
create policy "Users update their own library" on public.user_library for update using(auth.uid()=user_id) with check(auth.uid()=user_id);
drop policy if exists "Users remove from their own library" on public.user_library;
create policy "Users remove from their own library" on public.user_library for delete using(auth.uid()=user_id);

drop policy if exists "Users read their own push subscriptions" on public.push_subscriptions;
create policy "Users read their own push subscriptions" on public.push_subscriptions for select using(auth.uid()=user_id);
drop policy if exists "Users add their own push subscriptions" on public.push_subscriptions;
create policy "Users add their own push subscriptions" on public.push_subscriptions for insert with check(auth.uid()=user_id);
drop policy if exists "Users update their own push subscriptions" on public.push_subscriptions;
create policy "Users update their own push subscriptions" on public.push_subscriptions for update using(auth.uid()=user_id) with check(auth.uid()=user_id);
drop policy if exists "Users delete their own push subscriptions" on public.push_subscriptions;
create policy "Users delete their own push subscriptions" on public.push_subscriptions for delete using(auth.uid()=user_id);

-- Create a public Storage bucket named game-assets in the dashboard.
-- Never expose a Supabase service_role key in browser code.
