# Chairside

**Canadian dental hiring — permanent roles and same-day fill-ins.**

Clinics post roles and shifts, review applications with explainable match scores, message candidates, and run outreach. Professionals build an application kit, browse nearby work, and stay free. Built as a mobile-first Expo app with a shared web surface on [chairside.app](https://chairsidedental.app).

---

## At a glance

| | Clinics | Professionals |
| --- | --- | --- |
| **Core** | Post roles & fill-ins, applications pipeline, calendar, messaging | Browse & apply, application kit, match scores, fill-in availability |
| **Plans** | Free / Starter / Pro (RevenueCat — iOS + web) | Always free |
| **Orgs** | Individual clinics or multi-location **groups** with managers | — |
| **Extras** | Screening, interviews, CRM notes, discover, priority listing (Pro) | Saved posts, interview responses, in-app PDF kit |

---

## Stack

- **App** — Expo SDK 54 · Expo Router · React Native / React Native Web
- **Backend** — Supabase (Auth, Postgres + RLS, Storage, Edge Functions)
- **Billing** — RevenueCat (App Store + Web Billing)
- **Notifications** — Pingram (in-app, push, optional SMS)
- **Maps** — Mapbox
- **Monorepo** — pnpm workspaces (`apps/mobile`, `packages/*`)

---

## Prerequisites

- Node.js **20+**
- [pnpm](https://pnpm.io/) (`packageManager` pinned in root `package.json`)
- [Xcode](https://developer.apple.com/xcode/) for iOS simulator / local native builds
- [Supabase CLI](https://supabase.com/docs/guides/cli) for Edge Functions
- [EAS CLI](https://docs.expo.dev/build/setup/) for TestFlight / App Store builds

---

## Getting started

```bash
pnpm install
cp apps/mobile/.env.example apps/mobile/.env
# fill in values — see Environment below
pnpm dev
```

Press `i` for the iOS simulator, or scan the QR code with Expo Go.

| Command | What it does |
| --- | --- |
| `pnpm dev` | Expo dev server |
| `pnpm ios` / `pnpm android` / `pnpm web` | Platform-specific Expo |
| `pnpm export:web` | Static web export → `apps/mobile/dist` |
| `pnpm lint` | ESLint (`apps/mobile`) |
| `pnpm --filter mobile test` | Vitest unit tests |
| `pnpm build:ios` | EAS production iOS build |
| `pnpm build:ios:preview` | EAS preview iOS build |
| `pnpm submit:ios` | Submit latest production build to App Store Connect |
| `pnpm release:check` | Verify App Store release artifacts in repo |

---

## Environment

Create `apps/mobile/.env` (template: [`apps/mobile/.env.example`](apps/mobile/.env.example)):

| Variable | Required | Purpose |
| --- | --- | --- |
| `EXPO_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Yes | Anon / publishable key |
| `EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN` | Yes | Address autocomplete / maps |
| `EXPO_PUBLIC_PINGRAM_CLIENT_ID` | Yes* | Pingram env ID or `pingram_pk_…` — [docs/NOTIFICATIONS.md](docs/NOTIFICATIONS.md) |
| `EXPO_PUBLIC_WEB_BASE_URL` | Prod | Legal / invite links (e.g. `https://chairside.app`) |
| `EXPO_PUBLIC_REVENUECAT_IOS_API_KEY` | Billing | iOS SDK key |
| `EXPO_PUBLIC_REVENUECAT_WEB_API_KEY` | Billing | Web Billing public key (`rcb_…`) |
| `EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY` | Optional | Android SDK key when enabled |

\*Required for notification registration in builds that use Pingram.

**Optional overrides**

- `EXPO_PUBLIC_PINGRAM_API_HOST` — default `api.ca.pingram.io`
- `EXPO_PUBLIC_PINGRAM_WS_HOST` — default `ws.ca.pingram.io`
- `EXPO_PUBLIC_PINGRAM_ENVIRONMENT_ID` — if not embedded in `PINGRAM_CLIENT_ID`
- `EXPO_PUBLIC_CLINIC_GROUPS_ENABLED` — `0` / `false` to disable groups ([docs/CLINIC_GROUPS.md](docs/CLINIC_GROUPS.md))

Local `.env` is **not** uploaded to EAS — set the same `EXPO_PUBLIC_*` keys for **production** / **preview** via `eas env:create` from `apps/mobile`.

---

## Database migrations

Apply every file in [`supabase/migrations/`](supabase/migrations/) **in numeric order** (`001` → `100`). Use the Supabase SQL editor or your linked-project migration workflow. If the database already has early migrations, apply only what’s missing.

Schema covers profiles & RLS, clinic / worker profiles, jobs & fill-ins, applications & screening, match tiers, application kits, storage buckets, notifications, interviews, messaging, fill-in outreach & confirmation, clinic CRM, saved posts, practice doctors, account deletion retention, **clinic subscriptions / billing**, marketplace discover, and **clinic organizations** (groups, locations, managers, org messaging, member profiles).

---

## Auth

Supabase Auth with deep links into the app (`chairside://auth/callback`).

**Supabase → Authentication → URL Configuration**

| Setting | Value |
| --- | --- |
| Site URL | `chairside://auth/callback` (not `localhost` — required for TestFlight) |
| Redirect URLs | `chairside://**`, `exp://**` (Expo Go) |

| Method | Expo Go | Dev / TestFlight build |
| --- | --- | --- |
| Email sign-up / sign-in | Yes | Yes |
| Forgot password → set new password | Yes | Yes |
| Google | Yes | Yes |
| Sign in with Apple | No | Yes |

Email confirmation and password-recovery links must use the Site URL / redirects above so they open the app instead of Safari on `localhost`.

---

## Native builds (TestFlight / production)

These need an **EAS build** (not Expo Go):

- Sign in with Apple
- Push notifications (`expo-notifications` + Pingram)
- In-app PDF resume preview (`react-native-pdf`)

```bash
# from repo root
pnpm build:ios

# or
cd apps/mobile
eas build --profile production --platform ios
```

Profiles live in [`apps/mobile/eas.json`](apps/mobile/eas.json) (`development`, `preview`, `production`).

> Always run EAS from `apps/mobile` (or `pnpm build:ios` from root). There is no root `app.json` — [`apps/mobile/app.json`](apps/mobile/app.json) + [`apps/mobile/app.config.ts`](apps/mobile/app.config.ts) are the source of truth (`com.chairside.app`).

Push runbook: [docs/PUSH_IOS_PRODUCTION.md](docs/PUSH_IOS_PRODUCTION.md)

---

## Edge Functions

Deploy from the project root. Use `--use-api` if local Docker bundling isn’t available.

| Function | Purpose |
| --- | --- |
| `delete-account` | Profile → delete account; retains counterpart history, scrubs PII, clears storage |
| `notify` | Pingram in-app / push / optional SMS |
| `revenuecat-sync` | Pull entitlements into `clinic_subscriptions` after purchase |
| `revenuecat-webhook` | RevenueCat → Supabase subscription source of truth |
| `support-contact` | In-app support form delivery |

```bash
supabase functions deploy delete-account --use-api
supabase functions deploy notify --use-api
supabase functions deploy revenuecat-sync --use-api
supabase functions deploy revenuecat-webhook --use-api
supabase functions deploy support-contact --use-api
```

Typical secrets: `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` (often auto-set when linked), plus `PINGRAM_API_KEY`, `NOTIFY_WEBHOOK_SECRET`, `REVENUECAT_SECRET_API_KEY`, `REVENUECAT_WEBHOOK_SECRET`.

- Notifications: [docs/NOTIFICATIONS.md](docs/NOTIFICATIONS.md)
- Web billing: [docs/WEB_BILLING.md](docs/WEB_BILLING.md)
- Support: [docs/SUPPORT_CONTACT.md](docs/SUPPORT_CONTACT.md)

**Deno in the IDE:** install the [Deno extension](https://marketplace.visualstudio.com/items?itemName=denoland.vscode-deno). Repo `.vscode/settings.json` scopes Deno to `supabase/functions` only.

---

## Project structure

```text
chairside/
├── apps/mobile/              # Expo app (SDK 54, Expo Router) + web
│   └── scripts/              # Brand asset generator (icons, splash)
├── packages/
│   ├── api/                  # Supabase client, auth, domain APIs
│   ├── core/                 # Match scoring & shared domain logic
│   ├── config/               # Roles, screening, billing plan config
│   └── ui/                   # Shared UI stubs
├── supabase/
│   ├── migrations/           # Postgres schema + RLS (001–100)
│   └── functions/            # delete-account, notify, revenuecat-*, support-contact
├── docs/                     # Runbooks (release, push, web, billing, groups)
└── scripts/                  # Pingram / notify / release helpers
```

---

## Web

```bash
pnpm export:web
```

Host `apps/mobile/dist` on Vercel / Netlify / Cloudflare. Configure Supabase auth redirects for the web origin — see [docs/WEB_DEPLOY.md](docs/WEB_DEPLOY.md). Clinic subscriptions on web: [docs/WEB_BILLING.md](docs/WEB_BILLING.md).

---

## Documentation

| Doc | Contents |
| --- | --- |
| [docs/CLINIC_GROUPS.md](docs/CLINIC_GROUPS.md) | Individual vs group orgs, locations, managers |
| [docs/WEB_BILLING.md](docs/WEB_BILLING.md) | RevenueCat Web Billing + entitlement sync |
| [docs/APP_STORE_RELEASE.md](docs/APP_STORE_RELEASE.md) | End-to-end App Store release |
| [docs/APP_STORE_CONNECT.md](docs/APP_STORE_CONNECT.md) | Listing copy, privacy, review notes |
| [docs/TESTFLIGHT_CHECKLIST.md](docs/TESTFLIGHT_CHECKLIST.md) | Pre-submission smoke tests |
| [docs/NOTIFICATIONS.md](docs/NOTIFICATIONS.md) | Pingram types, webhooks, `notify` |
| [docs/PUSH_IOS_PRODUCTION.md](docs/PUSH_IOS_PRODUCTION.md) | APNs, EAS env, push debugging |
| [docs/WEB_DEPLOY.md](docs/WEB_DEPLOY.md) | Static export, redirects, hosting |
| [docs/SUPPORT_CONTACT.md](docs/SUPPORT_CONTACT.md) | Support form + edge function |

---

## Expo Go vs EAS build

| Feature | Expo Go | EAS build |
| --- | --- | --- |
| In-app notifications (Pingram) | Yes | Yes |
| Push banners | No | Yes |
| View resume in-app | Share only | PDF viewer |
| Sign in with Apple | No | Yes |
| Clinic billing (RevenueCat) | Limited / store-dependent | Full native + web paths |

---

<p align="center">
  <sub>Built for Canadian dental teams · <a href="https://chairside.app">chairside.app</a></sub>
</p>
