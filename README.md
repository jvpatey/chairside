# Chairside

A mobile-first dental staffing app for Canadian clinics and dental professionals. Clinics post permanent roles and fill-in shifts; workers browse, apply with an application kit, and get explainable match scoring. Includes in-app messaging, interviews, and Pingram notifications.

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
| `EXPO_PUBLIC_WEB_BASE_URL` | Production web origin for legal links (e.g. `https://chairside.app`) |

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

Apply every file in [`supabase/migrations/`](supabase/migrations/) **in numeric order** (currently `001` through `079`). Use the Supabase SQL editor, or your usual migration workflow against the linked project.

If the database already has early migrations, run only the files you have not applied yet.

Major areas covered by migrations include: profiles and RLS, clinic/worker profiles, job and shift posts, applications and screening (including staged flow), match tiers, application kit snapshots, storage (resumes/photos/logos/doctor photos), notification preferences, interviews, messaging (inbox, message search), fill-in outreach and confirmation RPCs, clinic worker CRM, saved posts, practice doctors, and account deletion retention with PII scrubbing.

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

**Important:** Always run EAS from `apps/mobile` (or use `pnpm build:ios` from the repo root). There is no root `app.json` — the mobile app config in [`apps/mobile/app.json`](apps/mobile/app.json) and [`apps/mobile/app.config.ts`](apps/mobile/app.config.ts) is the single source of truth (`com.chairside.app`).

## Edge Functions

Deploy from the project root. Use `--use-api` if local Docker bundling is unavailable.

**Account deletion** — required for Profile → delete account. Preserves historical applications/messages for the other party (marked as no longer on Chairside), scrubs PII, and removes storage files:

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
| `pnpm web` | Expo web dev server |
| `pnpm export:web` | Static web export to `apps/mobile/dist` |
| `pnpm lint` | ESLint (`apps/mobile`) |
| `pnpm --filter mobile test` | Vitest unit tests |
| `pnpm build:ios` | EAS production iOS build |
| `pnpm build:ios:preview` | EAS preview iOS build |
| `pnpm submit:ios` | Submit latest production iOS build to App Store Connect |
| `pnpm release:check` | Verify App Store release artifacts in repo |
| `pnpm --filter mobile generate:brand` | Regenerate app icons, splash logos, and favicon |

## Project structure

```
chairside/
├── apps/mobile/           # Expo app (Expo SDK 54, Expo Router)
│   └── scripts/           # Brand asset generator (icons, splash)
├── packages/
│   ├── api/               # Supabase client, auth, applications, messaging
│   ├── core/              # Match scoring and shared domain logic
│   ├── config/            # Role types, screening catalog, notification types
│   └── ui/                # Shared UI stubs
├── supabase/
│   ├── migrations/        # Postgres schema and RLS
│   └── functions/         # delete-account, notify
├── docs/                  # Notifications, iOS push, web deploy runbooks
└── scripts/               # Pingram verification and notify smoke tests
```

## Web deployment

Expo web can be exported and hosted separately from the native apps. Build with `pnpm export:web`, then follow [docs/WEB_DEPLOY.md](docs/WEB_DEPLOY.md) for Supabase redirect URLs and Vercel/Netlify/Cloudflare setup.

## Documentation

| Doc | Contents |
| --- | -------- |
| [docs/APP_STORE_RELEASE.md](docs/APP_STORE_RELEASE.md) | End-to-end App Store release runbook |
| [docs/APP_STORE_CONNECT.md](docs/APP_STORE_CONNECT.md) | Listing copy, privacy labels, review notes |
| [docs/TESTFLIGHT_CHECKLIST.md](docs/TESTFLIGHT_CHECKLIST.md) | Pre-submission smoke test checklist |
| [docs/SUPPORT_CONTACT.md](docs/SUPPORT_CONTACT.md) | Support form, Pingram email, edge function deploy |
| [docs/NOTIFICATIONS.md](docs/NOTIFICATIONS.md) | Pingram types, webhooks, `notify` deploy |
| [docs/PUSH_IOS_PRODUCTION.md](docs/PUSH_IOS_PRODUCTION.md) | APNs, EAS env, TestFlight push debugging |
| [docs/WEB_DEPLOY.md](docs/WEB_DEPLOY.md) | Static web export, auth redirects, hosting |
| [docs/WEB_BILLING.md](docs/WEB_BILLING.md) | RevenueCat Web Billing setup and cross-platform sync |

## Expo Go vs dev build (quick reference)

| Feature | Expo Go | EAS build |
| ------- | ------- | --------- |
| In-app notifications (Pingram) | Yes | Yes |
| Push banners | No | Yes |
| View resume in-app | Share only | PDF viewer |
| Sign in with Apple | No | Yes |
