# MKE H-D Prize Hub

Production-oriented Next.js app for Milwaukee Harley-Davidson–style event prize activations: three floor games (wheel, plinko, slots), **Postgres** (Vercel Postgres / Neon) + **Drizzle ORM**, a **single shared admin password** (HTTP-only session cookie) for the staff console, weighted outcomes resolved on the server, and an admin UI for prizes, distribution preview, and analytics.

## Stack

- **Next.js 16** (App Router, TypeScript)
- **Tailwind CSS 4** + **shadcn/ui**
- **Framer Motion**
- **Neon / Vercel Postgres** + **Drizzle ORM**
- **Zustand** (kiosk + session hints)
- **Zod** (API validation)

## Repository layout

```
src/
  app/                      # Routes: /, /game/*, /admin/login, /admin/*, /api/*
  actions/                  # Server actions (admin auth, prize CRUD)
  db/                       # Drizzle schema + DB client
  components/
  lib/auth/                 # Admin session (HMAC cookie) + DB guard
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

2. **Admin login**

   Copy `.env.local.example` to `.env.local` and set:

   - `ADMIN_PASSWORD` — one strong password shared by staff who manage prizes
   - `ADMIN_SESSION_SECRET` — long random string used to sign the session cookie (e.g. `openssl rand -hex 32`)

3. **Database**

   Create a **Vercel Postgres** or **Neon** database. Copy the **pooled** connection string into:

   - `DATABASE_URL`

   Apply the schema (supports multiple statements — use `psql`, not a single-statement SQL editor):

   ```bash
   psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f drizzle/0000_init_neon.sql
   ```

   The previous `supabase/migrations/` file is **legacy** (Supabase Auth + RLS); this app no longer uses it.

4. **Dev / build**

   ```bash
   npm run dev
   ```

   Open `/admin/login`, sign in with `ADMIN_PASSWORD`, then use `/admin` and related pages.

   ```bash
   npm run build && npm start
   ```

5. **Optional demo mode**

   - `NEXT_PUBLIC_LOCAL_ONLY_MODE=true` — in-memory prize catalog; plays are not written to Postgres.

6. **Floor inventory**

   - **No `DATABASE_URL`:** games use the built-in demo catalog (plays are not saved unless you configure the DB).
   - **`DATABASE_URL` set:** games only use your database. Create prizes in **Prize lab**, then add each one under **Game assignments** for wheel / plinko / slots (probability weight; plinko also needs a **slot index**). Until then, the kiosk shows a short “set up in admin” message instead of dummy prizes.

## Vercel deployment

1. Link the GitHub repo.
2. Add **Production** (and Preview if needed) env vars: `DATABASE_URL`, `ADMIN_PASSWORD`, `ADMIN_SESSION_SECRET`.
3. Run `drizzle/0000_init_neon.sql` against that database (e.g. **`psql … -f`**).
4. Redeploy after changing secrets.

## Product notes

- Outcomes are chosen server-side; public config endpoints do not expose probability weights.
- `/admin/*` (except `/admin/login`) and `/api/admin/*` require a valid **admin session cookie**; there is no per-user identity for staff.
- Floor routes (`/`, `/game/*`, `/api/games/*`) stay public for kiosk use.
- The `profiles` table remains for optional linkage (e.g. `redeemed_by`); it is **not** used to gate admin access.

## Branding

This template uses original Milwaukee / Harley-adjacent *theming* only. Official H-D marks require separate brand approval.
