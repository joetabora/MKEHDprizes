-- LEGACY: Supabase-only (auth.users, RLS, auth.uid()). Not used by the current app.
-- Use drizzle/0000_init_neon.sql for Vercel Postgres / Neon instead.

-- MKE H-D Prize Hub — initial schema
-- Run in Supabase SQL editor or via CLI migrations

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Profiles (extends auth.users)
-- ---------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  full_name text,
  role text not null default 'staff' check (role in ('admin', 'staff')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index profiles_role_idx on public.profiles (role);

-- ---------------------------------------------------------------------------
-- App settings (singleton rows)
-- ---------------------------------------------------------------------------
create table public.app_settings (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Prizes
-- ---------------------------------------------------------------------------
create type public.rarity_tier as enum (
  'common',
  'uncommon',
  'rare',
  'epic',
  'legendary',
  'jackpot'
);

create type public.game_type as enum ('wheel', 'plinko', 'slots');

create table public.prizes (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text default '',
  image_url text,
  rarity public.rarity_tier not null default 'common',
  quantity_total int not null default 0 check (quantity_total >= 0),
  quantity_remaining int not null default 0 check (quantity_remaining >= 0),
  active boolean not null default true,
  redemption_instructions text default '',
  internal_notes text default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index prizes_active_idx on public.prizes (active);

-- ---------------------------------------------------------------------------
-- Per-game assignment (weights + layout)
-- ---------------------------------------------------------------------------
create table public.prize_assignments (
  id uuid primary key default gen_random_uuid(),
  prize_id uuid not null references public.prizes (id) on delete cascade,
  game public.game_type not null,
  probability_weight numeric not null default 1 check (probability_weight >= 0),
  visual_weight numeric not null default 1 check (visual_weight >= 0),
  enabled boolean not null default true,
  wheel_color text,
  wheel_glow_jackpot boolean not null default false,
  plinko_slot_index int check (plinko_slot_index is null or plinko_slot_index >= 0),
  slot_symbol_key text,
  slot_payline_tier int not null default 0,
  display_sort int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (prize_id, game, plinko_slot_index)
);

create index prize_assignments_game_enabled_idx
  on public.prize_assignments (game, enabled);

-- ---------------------------------------------------------------------------
-- Plays & redemptions
-- ---------------------------------------------------------------------------
create table public.plays (
  id uuid primary key default gen_random_uuid(),
  game public.game_type not null,
  prize_id uuid references public.prizes (id) on delete set null,
  assignment_id uuid references public.prize_assignments (id) on delete set null,
  session_id text not null,
  client_meta jsonb not null default '{}'::jsonb,
  server_meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index plays_game_created_idx on public.plays (game, created_at desc);
create index plays_session_idx on public.plays (session_id);
create index plays_prize_idx on public.plays (prize_id);

create table public.redemptions (
  id uuid primary key default gen_random_uuid(),
  play_id uuid not null references public.plays (id) on delete cascade,
  prize_id uuid not null references public.prizes (id) on delete cascade,
  code text not null unique,
  status text not null default 'pending' check (status in ('pending', 'redeemed', 'expired')),
  claim_later boolean not null default false,
  redeemed_at timestamptz,
  redeemed_by uuid references public.profiles (id),
  created_at timestamptz not null default now()
);

create index redemptions_status_idx on public.redemptions (status);
create index redemptions_code_idx on public.redemptions (code);

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.app_settings enable row level security;
alter table public.prizes enable row level security;
alter table public.prize_assignments enable row level security;
alter table public.plays enable row level security;
alter table public.redemptions enable row level security;

-- Profiles: users can read/update self
create policy "profiles_select_own"
  on public.profiles for select
  using (auth.uid() = id);

create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = id);

-- Admin/staff policies helper via role in JWT custom claim optional —
-- here we use table check: admins see all profiles
create policy "profiles_admin_all"
  on public.profiles for all
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

-- App settings: admin read/write
create policy "app_settings_admin_select"
  on public.app_settings for select
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

create policy "app_settings_admin_mutate"
  on public.app_settings for all
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

-- Prizes & assignments: admin full access
create policy "prizes_admin_all"
  on public.prizes for all
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

create policy "prize_assignments_admin_all"
  on public.prize_assignments for all
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

-- Plays: admin read; no public direct insert (use service role from API)
create policy "plays_admin_select"
  on public.plays for select
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role in ('admin', 'staff')
    )
  );

-- Redemptions: staff/admin
create policy "redemptions_staff_select"
  on public.redemptions for select
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role in ('admin', 'staff')
    )
  );

create policy "redemptions_staff_update"
  on public.redemptions for update
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role in ('admin', 'staff')
    )
  );

create policy "redemptions_admin_insert"
  on public.redemptions for insert
  with check (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role in ('admin', 'staff')
    )
  );

-- ---------------------------------------------------------------------------
-- Trigger: new user → profile
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    coalesce(new.raw_user_meta_data->>'role', 'staff')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Storage bucket (run separately in Supabase dashboard if preferred)
-- insert into storage.buckets (id, name, public) values ('prize-images', 'prize-images', true);
-- ---------------------------------------------------------------------------
