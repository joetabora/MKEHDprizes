-- Add preset wheel slice icon (emoji) per prize — run: psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f drizzle/0001_prize_wheel_icon.sql

ALTER TABLE prizes
  ADD COLUMN IF NOT EXISTS wheel_icon_key text NOT NULL DEFAULT 'star';
