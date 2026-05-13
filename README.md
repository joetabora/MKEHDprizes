# MKE H-D Prize Hub

Production-oriented Next.js app for Milwaukee Harley-Davidson–style event prize activations: three floor games (wheel, plinko, slots), **Postgres** (Vercel Postgres / Neon) + **Drizzle ORM**, **Clerk** authentication, weighted outcomes resolved on the server, and an admin console for prizes, distribution preview, analytics, and redemptions.

## Stack

- **Next.js 16** (App Router, TypeScript)
- **Tailwind CSS 4** + **shadcn/ui**
- **Framer Motion**
- **Neon / Vercel Postgres** + **Drizzle ORM**
- **Clerk** (sign-in, sessions)
- **Zustand** (kiosk + session hints)
- **Zod** (API validation)

## Repository layout

```
src/
  app/                      # Routes: /, /game/*, /sign-in, /admin/*, /api/*
  actions/                  # Server actions (admin prize / redemption CRUD)
  db/                       # Drizzle schema + DB client
  components/
  lib/auth/                 # Clerk profile sync + admin guard
  lib/games/                # Play orchestration + data fetch
  lib/db/mappers.ts         # DB row → app types
drizzle/
  0000_init_neon.sql        # Run once against your database (see below)
drizzle.config.ts           # drizzle-kit (optional)
```

## Local setup

1. **Install**

   ```bash
   npm install
   ```

2. **Clerk**

   Create an application at [Clerk](https://dashboard.clerk.com). Add to `.env.local`:

   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
   - `CLERK_SECRET_KEY`

3. **Database**

   Create a **Vercel Postgres** or **Neon** database. Copy the **pooled** connection string into:

   - `DATABASE_URL`

   Apply the schema (supports multiple statements — use `psql`, not a single-statement SQL editor):

   ```bash
   psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f drizzle/0000_init_neon.sql
   ```

   The previous `supabase/migrations/` file is **legacy** (Supabase Auth + RLS); this app no longer uses it.

4. **First admin**

   Sign in once via `/sign-in`, then in SQL:

   ```sql
   update public.profiles
   set role = 'admin'
   where id = 'user_XXXXX';  -- your Clerk user id from Clerk dashboard or DB
   ```

5. **Dev / build**

   ```bash
   npm run dev
   ```

   ```bash
   npm run build && npm start
   ```

6. **Optional demo mode**

   - `NEXT_PUBLIC_LOCAL_ONLY_MODE=true` — in-memory prize catalog; plays are not written to Postgres.

## Vercel deployment

1. Link the GitHub repo; add **Clerk** env vars and `DATABASE_URL` from Vercel Storage / Neon.
2. Run `drizzle/0000_init_neon.sql` against that database (SQL Editor with **psql** or Neon’s “run script” if supported).
3. Promote your user to `admin` in `profiles` as above.

## Product notes

- Outcomes are chosen server-side; public config endpoints do not expose probability weights.
- Admin APIs and server actions require a signed-in user with `profiles.role = 'admin'`.
- Floor routes (`/`, `/game/*`, `/api/games/*`) stay public for kiosk use.

## Branding

This template uses original Milwaukee / Harley-adjacent *theming* only. Official H-D marks require separate brand approval.
