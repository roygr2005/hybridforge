-- ============================================================
-- Train Smart — Supabase Schema
-- Run this in the Supabase SQL Editor (once)
-- ============================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ============================================================
-- PROFILES
-- ============================================================
create table if not exists public.profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  email        text,
  full_name    text,
  avatar_url   text,
  birth_date   date,
  height_cm    numeric(5,1),
  weight_kg    numeric(5,1),
  gender       text check (gender in ('male','female','other','prefer_not')),
  level        text check (level in ('beginner','intermediate','advanced')) default 'beginner',
  goal         text check (goal in ('performance','health','weight_loss','muscle_gain','endurance')) default 'health',
  sports       text[] default '{}',          -- e.g. ['strength','running','cycling']
  is_premium   boolean default false,
  lang         text default 'fr',
  created_at   timestamptz default now(),
  updated_at   timestamptz default now()
);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', '')
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================================
-- STRENGTH SESSIONS
-- ============================================================
create table if not exists public.strength_sessions (
  id         uuid primary key default uuid_generate_v4(),
  user_id    uuid not null references public.profiles(id) on delete cascade,
  name       text not null default 'Séance',      -- e.g. "Push", "Full Body"
  notes      text,
  duration_minutes integer,
  session_date date not null default current_date,
  created_at timestamptz default now()
);

-- ============================================================
-- STRENGTH SETS  (exercises inside a session)
-- ============================================================
create table if not exists public.strength_sets (
  id           uuid primary key default uuid_generate_v4(),
  session_id   uuid not null references public.strength_sessions(id) on delete cascade,
  user_id      uuid not null references public.profiles(id) on delete cascade,
  exercise     text not null,
  set_number   smallint not null default 1,
  reps         smallint,
  weight_kg    numeric(6,2),
  rpe          numeric(3,1) check (rpe between 1 and 10),  -- perceived effort
  notes        text,
  created_at   timestamptz default now()
);

-- ============================================================
-- ENDURANCE SESSIONS
-- ============================================================
create table if not exists public.endurance_sessions (
  id               uuid primary key default uuid_generate_v4(),
  user_id          uuid not null references public.profiles(id) on delete cascade,
  sport            text not null check (sport in ('running','cycling','swimming','rowing','other')),
  duration_minutes numeric(7,2) not null,
  distance_km      numeric(7,3),
  avg_pace_sec     integer,   -- seconds per km (running / swimming)
  avg_speed_kmh    numeric(5,2),
  avg_hr           smallint,  -- bpm
  max_hr           smallint,
  elevation_m      integer,
  notes            text,
  session_date     date not null default current_date,
  created_at       timestamptz default now()
);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
alter table public.profiles          enable row level security;
alter table public.strength_sessions enable row level security;
alter table public.strength_sets     enable row level security;
alter table public.endurance_sessions enable row level security;

-- profiles
create policy "Users can view own profile"
  on public.profiles for select using (auth.uid() = id);
create policy "Users can update own profile"
  on public.profiles for update using (auth.uid() = id);

-- strength_sessions
create policy "Users can manage own strength sessions"
  on public.strength_sessions for all using (auth.uid() = user_id);

-- strength_sets
create policy "Users can manage own strength sets"
  on public.strength_sets for all using (auth.uid() = user_id);

-- endurance_sessions
create policy "Users can manage own endurance sessions"
  on public.endurance_sessions for all using (auth.uid() = user_id);

-- ============================================================
-- INDEXES
-- ============================================================
create index if not exists idx_strength_sessions_user_date
  on public.strength_sessions(user_id, session_date desc);

create index if not exists idx_strength_sets_session
  on public.strength_sets(session_id);

create index if not exists idx_endurance_sessions_user_date
  on public.endurance_sessions(user_id, session_date desc);
