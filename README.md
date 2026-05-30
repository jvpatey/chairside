# Chairside

A mobile-first dental staffing app for Nova Scotia clinics and dental professionals. Clinics post permanent roles and fill-in shifts; workers browse, apply with an application kit, and get explainable match scoring. Includes in-app messaging, interviews, and Pingram notifications.

## Prerequisites

- Node.js 20+
- [pnpm](https://pnpm.io/)
- [Xcode](https://developer.apple.com/xcode/) (iOS simulator or local dev builds)
- [Supabase CLI](https://supabase.com/docs/guides/cli) (Edge Functions deploy)
- [EAS CLI](https://docs.expo.dev/build/setup/) (TestFlight / App Store builds)

## Getting started

```bash
pnpm install
```

Create `apps/mobile/.env` with values from Supabase → Project Settings → API and your third-party dashboards:

| Variable | Purpose |
| -------- | ------- |
| `EXPO_PUBLIC_SUPABASE_URL` | Project URL (`https://<ref>.supabase.co`) |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Anon / publishable key |
| `EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN` | Mapbox token for address autocomplete |
| `EXPO_PUBLIC_PINGRAM_CLIENT_ID` | Pingram environment ID or `pingram_pk_...` public key (see [docs/NOTIFICATIONS.md](docs/NOTIFICATIONS.md)) |

Optional overrides:

- `EXPO_PUBLIC_PINGRAM_API_HOST` — defaults to `api.ca.pingram.io`
- `EXPO_PUBLIC_PINGRAM_WS_HOST` — defaults to `ws.ca.pingram.io`
- `EXPO_PUBLIC_PINGRAM_ENVIRONMENT_ID` — explicit environment ID if not using `PINGRAM_CLIENT_ID`

Start the dev server:

```bash
pnpm dev
```

Press `i` in the Expo dev tools for the iOS simulator, or scan the QR code with Expo Go.

### Database migrations

Apply every file in [`supabase/migrations/`](supabase/migrations/) **in numeric order** (`001` through `048` and any newer files). Use the Supabase SQL editor, or your usual migration workflow against the linked project.

If the database already has early migrations, run only the files you have not applied yet.

Major areas covered by migrations include: profiles and RLS, clinic/worker profiles, job and shift posts, applications and screening, match tiers, application kit snapshots, storage (resumes/photos/logos), notifications prefs, interviews, messaging, and fill-in confirmation RPCs.

## Auth

Chairside uses Supabase Auth with deep links back to the app (`chairside://auth/callback`).

**Supabase → Authentication → URL Configuration**

- **Site URL:** `chairside://auth/callback` (not `localhost` — required for TestFlight)
- **Redirect URLs:** `chairside://**` and `exp://**` (Expo Go local dev)

**Flows**

| Method | Expo Go | Dev / TestFlight build |
| ------ | ------- | ---------------------- |
| Email sign-up | Yes (with redirect URLs above) | Yes |
| Email sign-in | Yes | Yes |
| Forgot password | Yes — link opens app → set new password screen | Yes |
| Google | Yes | Yes |
| Sign in with Apple | No | Yes |

Email sign-up sends a confirmation link. Password reset sends a recovery link. Both must use the Site URL / redirect config above so links open the app instead of Safari hitting `localhost`.

After a reset link, the user lands on **Choose a new password** before entering the app.

## Native builds (TestFlight / production)

Several features require an EAS build — they do not work in Expo Go:

- **Sign in with Apple**
- **Push notifications** (via `expo-notifications` + Pingram)
- **In-app PDF resume preview** (`react-native-pdf`; Expo Go falls back to share sheet)

From `apps/mobile` (or `pnpm build:ios` from the repo root):

```bash
cd apps/mobile
eas build --profile production --platform ios
```

Local `.env` is not uploaded to EAS. Set the same `EXPO_PUBLIC_*` variables for the **production** (and **preview**) environment:

```bash
cd apps/mobile
eas env:create --environment production --name EXPO_PUBLIC_SUPABASE_URL --value '...'
# repeat for SUPABASE_ANON_KEY, PINGRAM_CLIENT_ID, MAPBOX_ACCESS_TOKEN, etc.
```

Push setup: [docs/PUSH_IOS_PRODUCTION.md](docs/PUSH_IOS_PRODUCTION.md)

Build profiles are defined in [`apps/mobile/eas.json`](apps/mobile/eas.json) (`development`, `preview`, `production`).

**Important:** Run EAS from `apps/mobile`, not the monorepo root. A stray root `app.json` will make EAS introspect the wrong config and try to disable Push Notifications / Sign in with Apple on your bundle ID.

## Edge Functions

Deploy from the project root. Use `--use-api` if local Docker bundling is unavailable.

**Account deletion** — required for Profile → delete account:

```bash
supabase functions deploy delete-account --use-api
```

Secrets: `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` (auto-set when linked).

**Notifications** — dispatches Pingram in-app, push, and optional SMS:

```bash
supabase secrets set PINGRAM_API_KEY=pingram_sk_...
supabase secrets set NOTIFY_WEBHOOK_SECRET=$(openssl rand -hex 32)
supabase functions deploy notify --use-api
```

Full webhook and dashboard setup: [docs/NOTIFICATIONS.md](docs/NOTIFICATIONS.md)

**Deno in the IDE:** install the [Deno extension](https://marketplace.visualstudio.com/items?itemName=denoland.vscode-deno). The repo’s `.vscode/settings.json` scopes Deno to `supabase/functions` only.

## Scripts

| Command | Description |
| ------- | ----------- |
| `pnpm dev` | Start Expo dev server |
| `pnpm ios` | Expo + iOS simulator |
| `pnpm android` | Expo + Android |
| `pnpm web` | Expo web (experimental) |
| `pnpm lint` | ESLint (`apps/mobile`) |

## Project structure

```
chairside/
├── apps/mobile/           # Expo app (Expo SDK 54, Expo Router)
├── packages/
│   ├── api/               # Supabase client, auth, applications, messaging
│   ├── core/              # Match scoring and shared domain logic
│   ├── config/            # Role types, screening catalog, notification types
│   └── ui/                # Shared UI stubs
├── supabase/
│   ├── migrations/        # Postgres schema and RLS
│   └── functions/         # delete-account, notify
├── docs/                  # Notifications, iOS push, operational runbooks
└── scripts/               # Pingram verification and notify smoke tests
```

## Documentation

| Doc | Contents |
| --- | -------- |
| [docs/NOTIFICATIONS.md](docs/NOTIFICATIONS.md) | Pingram types, webhooks, `notify` deploy |
| [docs/PUSH_IOS_PRODUCTION.md](docs/PUSH_IOS_PRODUCTION.md) | APNs, EAS env, TestFlight push debugging |

## Expo Go vs dev build (quick reference)

| Feature | Expo Go | EAS build |
| ------- | ------- | --------- |
| In-app notifications (Pingram) | Yes | Yes |
| Push banners | No | Yes |
| View resume in-app | Share only | PDF viewer |
| Sign in with Apple | No | Yes |
