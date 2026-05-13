# MKE H-D Prize Hub

Production-oriented Next.js app for Milwaukee Harley-Davidson–style event prize activations: three floor games (wheel, plinko, slots), Supabase-backed inventory and auth, weighted outcomes resolved on the server (odds never shipped to the client), and an admin console for prizes, distribution preview, analytics, and redemptions.

## Stack

- **Next.js 16** (App Router, TypeScript)
- **Tailwind CSS 4** + **shadcn/ui**
- **Framer Motion** (game motion)
- **Supabase** (Postgres, Auth, optional Storage)
- **Zustand** (kiosk + session preferences)
- **Zod** (API validation)

## Repository layout

```
src/
  app/                      # Routes: /, /game/*, /admin/*, /api/*
  components/
    admin/                  # Prize lab, stats reset
    brand/                  # Logo / sponsor rail hooks
    games/                  # Wheel, plinko, slots, HUD, win overlay
    home/                   # Lobby + attract mode
    ui/                     # shadcn components
  hooks/                    # Fullscreen, procedural audio
  lib/
    games/                  # Config + play orchestration
    supabase/               # Browser, server, service-role clients
    prize-engine.ts         # Weighting, wheel geometry, slot hints
    rarity.ts               # Tier labels + UI tokens
    mock-data.ts            # Local demo catalog
    stats-window.ts         # Analytics “since reset” window
  stores/                   # Kiosk + game session (recent wins)
  types/database.ts         # Shared TS models
supabase/
  migrations/00001_initial_schema.sql
.env.local.example
```

## Local setup

1. **Install**

   ```bash
   npm install
   ```

2. **Environment**

   Copy `.env.local.example` to `.env.local` and fill in Supabase keys, or enable demo mode:

   - `NEXT_PUBLIC_LOCAL_ONLY_MODE=true` — uses in-memory prize catalog; play API does not persist plays (still returns real JSON for games).

3. **Database**

   In the Supabase SQL editor (or CLI), run:

   `supabase/migrations/00001_initial_schema.sql`

4. **First admin user**

   - Create a user under **Authentication → Users**.
   - Promote to admin:

     ```sql
     update public.profiles
     set role = 'admin'
     where email = 'you@dealership.com';
     ```

5. **Dev server**

   ```bash
   npm run dev
   ```

   - Floor: [http://localhost:3000](http://localhost:3000)
   - Admin: [http://localhost:3000/admin/login](http://localhost:3000/admin/login)

6. **Production build**

   ```bash
   npm run build && npm start
   ```

## Vercel deployment

1. Create a Supabase project; run the migration SQL.
2. Create a Vercel project pointing at this repo.
3. Set environment variables in Vercel (see `.env.local.example`):

   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` (server-only; required for `/api/games/*/play` writes)

4. Deploy; optional `STATS_RESET_AT` ISO string seeds analytics window before first UI reset.

## Product notes

- **Fairness**: Outcomes are chosen in `src/lib/games/play.ts` via the service role. Public config endpoints only return display data (segment sizes, slot labels, symbol art).
- **Inventory**: Winning a prize decrements `quantity_remaining` and disables assignments when stock hits zero.
- **Kiosk**: HUD supports fullscreen, sound (Web Audio bleeps), staff reset of session anti-repeat hints, and attract overlay on the lobby.
- **Hotkey**: Lobby `Ctrl+Shift+A` surfaces a quick link to the admin sign-in.

## Optional next steps

- **Storage**: Add a `prize-images` public bucket and paste public URLs into `image_url`.
- **Offline / PWA**: Add a service worker and cache config payloads for field fail-safe.
- **Theme packs**: `useKioskStore` already persists theme id; wire CSS variables per event preset.

## Branding

This template uses original Milwaukee / Harley-adjacent *theming* only. Official H-D marks require separate brand approval.
