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
- `EXPO_PUBLIC_PINGRAM_CLIENT_ID` — Pingram client ID for in-app and push (see [docs/NOTIFICATIONS.md](docs/NOTIFICATIONS.md))

Run all database migrations in [`supabase/migrations/`](supabase/migrations/) **in order** in the Supabase SQL editor:

1. [`001_profiles.sql`](supabase/migrations/001_profiles.sql) — profiles table, RLS, signup trigger
2. [`002_profiles_insert_policy.sql`](supabase/migrations/002_profiles_insert_policy.sql) — allows clients to insert/upsert their own profile under RLS
3. [`003_profiles_update_policy_check.sql`](supabase/migrations/003_profiles_update_policy_check.sql) — tightens UPDATE policy with `WITH CHECK`
4. [`004_handle_new_user_role_coercion.sql`](supabase/migrations/004_handle_new_user_role_coercion.sql) — invalid signup roles become `NULL` instead of blocking sign-up
5. [`005_clinic_profiles.sql`](supabase/migrations/005_clinic_profiles.sql) — clinic profile table and RLS
6. [`006_job_shift_posts.sql`](supabase/migrations/006_job_shift_posts.sql) — job and shift post tables
7. [`007_applications.sql`](supabase/migrations/007_applications.sql) — applications table
8. [`008_team_size_range.sql`](supabase/migrations/008_team_size_range.sql) — team size as range buckets
9. [`009_role_type_dentist_other.sql`](supabase/migrations/009_role_type_dentist_other.sql) — dentist and other role types
10. [`010_job_post_offerings.sql`](supabase/migrations/010_job_post_offerings.sql) — perks/offerings on job posts
11. [`011_job_post_paused_status.sql`](supabase/migrations/011_job_post_paused_status.sql) — paused status and delete policy for job posts

If you already ran `001` before the later files existed, run only the migrations you have not applied yet.

### Account deletion (Edge Function)

Clinic users can delete their account from the **Profile** tab. Deletion requires a Supabase Edge Function because clients cannot remove auth users directly.

**IDE setup:** Edge Functions run on Deno. Install the [Deno extension](https://marketplace.visualstudio.com/items?itemName=denoland.vscode-deno) in Cursor/VS Code (the repo includes `.vscode/settings.json` so only `supabase/functions` uses Deno — the rest of the monorepo stays on TypeScript).

Deploy from the project root (requires [Supabase CLI](https://supabase.com/docs/guides/cli)):

```bash
supabase functions deploy delete-account
```

If bundling fails locally (Docker not running), use server-side bundling:

```bash
supabase functions deploy delete-account --use-api
```

The function uses these secrets (set automatically when linked to your project, or configure in Supabase → Edge Functions → delete-account → Secrets):

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

Deleting a user removes the auth account and cascades to `profiles`, `clinic_profiles`, `job_posts`, `shift_posts`, and related `applications` per the database schema. This action is permanent.

```bash
pnpm dev
```

Press `i` in the Expo dev tools to open the iOS simulator.

### Auth notes

- **Email / Google:** work in Expo Go once Supabase env vars and redirect URLs (`chairside://**`) are configured.
- **Sign in with Apple:** requires a dev build — `npx expo run:ios` (not Expo Go).
- Supabase → Authentication → URL Configuration:
  - **Redirect URLs:** add `chairside://**` (and `exp://**` for Expo Go dev).
  - **Site URL:** set to `chairside://auth/callback` (not `localhost`) so confirmation and password-reset links open the app on device.

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
├── supabase/           # SQL migrations and Edge Functions
└── packages/           # config, core, ui (stubs)
```

## Web (later)

This project is mobile-first. Expo Router supports web out of the box — run `pnpm web` when you're ready to start on the web target. Web UI polish and a clinic dashboard are planned for post-MVP.

## Notifications (Pingram)

In-app alerts, mobile push, and optional fill-in SMS are integrated via Pingram. See [docs/NOTIFICATIONS.md](docs/NOTIFICATIONS.md) for dashboard setup, Edge Function deploy, and database webhooks.

Add to `apps/mobile/.env`:

- `EXPO_PUBLIC_PINGRAM_CLIENT_ID`

Deploy the `notify` Edge Function and apply migration `033_worker_notification_prefs.sql`.

## What's not included yet

- Worker profiles and matching tuning beyond current notifications

Add these incrementally as you build out the MVP.
