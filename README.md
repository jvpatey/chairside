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

Edit `apps/mobile/.env` and set `EXPO_PUBLIC_SUPABASE_ANON_KEY` from Supabase → Project Settings → API.

Run the database migration in Supabase SQL editor: [`supabase/migrations/001_profiles.sql`](supabase/migrations/001_profiles.sql).

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
- Job posts, full profiles, and matching features

Add these incrementally as you build out the MVP.
