-- Neon / Vercel Postgres — run with: psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f drizzle/0000_init_neon.sql

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TYPE rarity_tier AS ENUM (
  'common',
  'uncommon',
  'rare',
  'epic',
  'legendary',
  'jackpot'
);

CREATE TYPE game_type AS ENUM ('wheel', 'plinko', 'slots');

CREATE TABLE profiles (
  id text PRIMARY KEY,
  email text,
  full_name text,
  role text NOT NULL DEFAULT 'staff' CHECK (role IN ('admin', 'staff')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE app_settings (
  key text PRIMARY KEY,
  value jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE prizes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text DEFAULT '',
  image_url text,
  rarity rarity_tier NOT NULL DEFAULT 'common',
  quantity_total int NOT NULL DEFAULT 0 CHECK (quantity_total >= 0),
  quantity_remaining int NOT NULL DEFAULT 0 CHECK (quantity_remaining >= 0),
  active boolean NOT NULL DEFAULT true,
  redemption_instructions text DEFAULT '',
  internal_notes text DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX prizes_active_idx ON prizes (active);

CREATE TABLE prize_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  prize_id uuid NOT NULL REFERENCES prizes (id) ON DELETE CASCADE,
  game game_type NOT NULL,
  probability_weight double precision NOT NULL DEFAULT 1 CHECK (probability_weight >= 0),
  visual_weight double precision NOT NULL DEFAULT 1 CHECK (visual_weight >= 0),
  enabled boolean NOT NULL DEFAULT true,
  wheel_color text,
  wheel_glow_jackpot boolean NOT NULL DEFAULT false,
  plinko_slot_index int CHECK (plinko_slot_index IS NULL OR plinko_slot_index >= 0),
  slot_symbol_key text,
  slot_payline_tier int NOT NULL DEFAULT 0,
  display_sort int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (prize_id, game, plinko_slot_index)
);

CREATE INDEX prize_assignments_game_enabled_idx ON prize_assignments (game, enabled);

CREATE TABLE plays (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  game game_type NOT NULL,
  prize_id uuid REFERENCES prizes (id) ON DELETE SET NULL,
  assignment_id uuid REFERENCES prize_assignments (id) ON DELETE SET NULL,
  session_id text NOT NULL,
  client_meta jsonb NOT NULL DEFAULT '{}'::jsonb,
  server_meta jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX plays_game_created_idx ON plays (game, created_at DESC);
CREATE INDEX plays_session_idx ON plays (session_id);
CREATE INDEX plays_prize_idx ON plays (prize_id);

CREATE TABLE redemptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  play_id uuid NOT NULL REFERENCES plays (id) ON DELETE CASCADE,
  prize_id uuid NOT NULL REFERENCES prizes (id) ON DELETE CASCADE,
  code text NOT NULL UNIQUE,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'redeemed', 'expired')),
  claim_later boolean NOT NULL DEFAULT false,
  redeemed_at timestamptz,
  redeemed_by text REFERENCES profiles (id),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX redemptions_status_idx ON redemptions (status);
CREATE INDEX redemptions_code_idx ON redemptions (code);
