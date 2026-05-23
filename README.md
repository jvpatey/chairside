# Chairside

A mobile-first dental staffing app for Nova Scotia clinics and dental professionals, built to fill permanent roles and last-minute shifts faster with structured profiles, availability matching, and explainable fit scoring.

## Prerequisites

- Node.js 20+
- [pnpm](https://pnpm.io/)
- [Xcode](https://developer.apple.com/xcode/) (for iOS simulator / dev builds)

## Getting started

```bash
pnpm install
cp .env.example apps/mobile/.env
```

Edit `apps/mobile/.env` and set both values from Supabase → Project Settings → API:

- `EXPO_PUBLIC_SUPABASE_URL` — your project URL (`https://<ref>.supabase.co`)
- `EXPO_PUBLIC_SUPABASE_ANON_KEY` — the anon / publishable key
- `EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN` — Mapbox public token for address autocomplete

Run all database migrations in [`supabase/migrations/`](supabase/migrations/) **in order** in the Supabase SQL editor:

1. [`001_profiles.sql`](supabase/migrations/001_profiles.sql) — profiles table, RLS, signup trigger
2. [`002_profiles_insert_policy.sql`](supabase/migrations/002_profiles_insert_policy.sql) — allows clients to insert/upsert their own profile under RLS
3. [`003_profiles_update_policy_check.sql`](supabase/migrations/003_profiles_update_policy_check.sql) — tightens UPDATE policy with `WITH CHECK`
4. [`004_handle_new_user_role_coercion.sql`](supabase/migrations/004_handle_new_user_role_coercion.sql) — invalid signup roles become `NULL` instead of blocking sign-up
5. [`005_clinic_profiles.sql`](supabase/migrations/005_clinic_profiles.sql) — clinic profile table and RLS
6. [`006_job_shift_posts.sql`](supabase/migrations/006_job_shift_posts.sql) — job and shift post tables
7. [`007_applications.sql`](supabase/migrations/007_applications.sql) — applications table

If you already ran `001` before the later files existed, run `002`–`007` only.

```bash
pnpm dev
```

Press `i` in the Expo dev tools to open the iOS simulator.

### Auth notes

- **Email / Google:** work in Expo Go once Supabase env vars and redirect URLs (`chairside://**`) are configured.
- **Sign in with Apple:** requires a dev build — `npx expo run:ios` (not Expo Go).
- Supabase → Authentication → URL Configuration must include `chairside://**`.

## Scripts

| Command        | Description                    |
| -------------- | ------------------------------ |
| `pnpm dev`     | Start Expo dev server          |
| `pnpm ios`     | Start Expo and open iOS        |
| `pnpm android` | Start Expo and open Android    |
| `pnpm web`     | Start Expo web (future target) |
| `pnpm lint`    | Run ESLint                     |

## Project structure

```
chairside/
├── apps/mobile/        # Expo app (iOS/Android now, web later)
├── packages/api/       # Supabase client and auth helpers
├── supabase/           # SQL migrations
└── packages/           # config, core, ui (stubs)
```

## Web (later)

This project is mobile-first. Expo Router supports web out of the box — run `pnpm web` when you're ready to start on the web target. Web UI polish and a clinic dashboard are planned for post-MVP.

## What's not included yet

- Push notifications
- Worker profiles and matching tuning

Add these incrementally as you build out the MVP.
