# App Store release runbook

End-to-end checklist for shipping Chairside to the App Store. Run EAS commands from `apps/mobile` unless noted.

## Prerequisites

- Apple Developer Program membership
- App Store Connect access
- Expo EAS CLI (`npm i -g eas-cli`)
- Supabase CLI linked to production project
- Pingram Canada environment with Mobile Push enabled

## 1. Public legal URLs (web)

Deploy the web app so these URLs are live before submission:

| Page | Path | App Store Connect field |
| ---- | ---- | ----------------------- |
| Privacy Policy | `/privacy` | Privacy Policy URL |
| Support | `/support` | Support URL |
| Terms | `/terms` | (optional; link from Support) |

Set `EXPO_PUBLIC_WEB_BASE_URL` to your production origin (e.g. `https://chairside.app`) in web hosting env vars so absolute links work in the native app Account screen.

```bash
pnpm export:web
# Deploy apps/mobile/dist per docs/WEB_DEPLOY.md
```

## 2. EAS environment variables

Local `.env` is not uploaded to EAS. Create production and preview variables:

```bash
cd apps/mobile

eas env:create --environment production --name EXPO_PUBLIC_SUPABASE_URL --value 'https://<ref>.supabase.co'
eas env:create --environment production --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value '<anon-key>'
eas env:create --environment production --name EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN --value '<mapbox-token>'
eas env:create --environment production --name EXPO_PUBLIC_PINGRAM_CLIENT_ID --value '<environment-id-or-pingram_pk_...>'
eas env:create --environment production --name EXPO_PUBLIC_WEB_BASE_URL --value 'https://chairside.app'
eas env:create --environment production --name EXPO_PUBLIC_REVENUECAT_IOS_API_KEY --value '<revenuecat-ios-public-key>'

# Repeat for --environment preview (TestFlight)
```

List and verify:

```bash
eas env:list --environment production
```

## 3. Apple Developer

1. Register App ID `com.chairside.app` with capabilities:
   - Push Notifications
   - Sign in with Apple
2. Create an APNs Auth Key (`.p8`) if you do not have one.
3. Configure EAS iOS credentials:

```bash
cd apps/mobile
eas credentials --platform ios
```

Answer **Yes** to push notifications / APNs when prompted.

## 4. Supabase production

### Migrations

Apply every file in `supabase/migrations/` in numeric order through the latest (`081`+).

### Edge Functions

```bash
# From repo root
supabase functions deploy delete-account --use-api
supabase functions deploy notify --use-api
supabase functions deploy support-contact --no-verify-jwt --use-api
supabase functions deploy revenuecat-sync --use-api
supabase functions deploy revenuecat-webhook --no-verify-jwt --use-api
```

### Secrets

```bash
supabase secrets set PINGRAM_API_KEY=pingram_sk_...
supabase secrets set NOTIFY_WEBHOOK_SECRET=$(openssl rand -hex 32)
supabase secrets set SUPPORT_INBOX_EMAIL='your-inbox@example.com'
supabase secrets set SUPPORT_SENDER_EMAIL='noreply@pingram.io'
supabase secrets set SUPPORT_SENDER_NAME='Chairside Support'
supabase secrets set REVENUECAT_SECRET_API_KEY=sk_...
supabase secrets set REVENUECAT_WEBHOOK_SECRET=$(openssl rand -hex 32)
# Optional: PINGRAM_API_URL=https://api.ca.pingram.io
```

`REVENUECAT_SECRET_API_KEY` is used by `revenuecat-sync` and `revenuecat-webhook` to verify subscribers. Configure the webhook URL in RevenueCat to `https://<project-ref>.supabase.co/functions/v1/revenuecat-webhook` with Authorization `Bearer <REVENUECAT_WEBHOOK_SECRET>`.

`SUPPORT_INBOX_EMAIL` is server-only and never appears in the app. See [SUPPORT_CONTACT.md](./SUPPORT_CONTACT.md).

### Auth redirect URLs

In Supabase → Authentication → URL Configuration:

- **Site URL:** `chairside://auth/callback` (native) and `https://<web-domain>/auth/callback` (web)
- **Redirect URLs:** `chairside://**`, `exp://**`, `https://<web-domain>/**`

### Database webhooks

Point to `https://<project-ref>.supabase.co/functions/v1/notify` with header `x-supabase-webhook-secret`:

| Table | Events |
| ----- | ------ |
| `applications` | INSERT, UPDATE |
| `shift_posts` | INSERT, UPDATE |
| `job_posts` | INSERT, UPDATE |
| `messages` | INSERT |

Full details: [NOTIFICATIONS.md](./NOTIFICATIONS.md)

## 5. Pingram (notifications + push)

1. Create notification types per [NOTIFICATIONS.md](./NOTIFICATIONS.md).
2. Configure APNs in Pingram — see [PUSH_IOS_PRODUCTION.md](./PUSH_IOS_PRODUCTION.md).
3. Enable Mobile Push on each type that should send banners.
4. Register SMS sender with Pingram support if using fill-in SMS.

Verify APNs via API (optional):

```bash
./scripts/configure-pingram-apn.sh
```

## 6. Build and submit

```bash
# From repo root
pnpm build:ios

# Or from apps/mobile
eas build --profile production --platform ios

# After build succeeds
cd apps/mobile
eas submit --profile production --platform ios
```

`apps/mobile/eas.json` uses `autoIncrement` for production build numbers and `appVersionSource: remote`.

## 7. App Store Connect

See [APP_STORE_CONNECT.md](./APP_STORE_CONNECT.md) for listing copy, privacy answers, screenshots, and review notes.

### Clinic subscriptions (RevenueCat)

When you are ready to sell plans in-app:

1. Accept the Paid Apps agreement and complete banking/tax in App Store Connect.
2. Create subscription group **Clinic Plans** with products:
   - `clinic_starter_monthly_v2` / `clinic_starter_yearly_v2` (Starter — CA$59.99/mo · CA$599.99/yr)
   - `clinic_pro_monthly_v2` / `clinic_pro_yearly_v2` (Pro — CA$99.99/mo · CA$999.99/yr)
3. Create subscription group **Group Plans** with products:
   - `group_starter_monthly` / `group_starter_yearly_v2` (Group Starter — CA$129.99/mo · CA$1,199.99/yr)
   - `group_pro_monthly` / `group_pro_yearly` (Group Pro — CA$199.99/mo · CA$1,399.99/yr)
4. In RevenueCat, map products to entitlements:
   - `clinic_starter`, `clinic_pro`, `clinic_group_starter`, `clinic_group_pro`
5. Add all **8 packages** to the default offering.
6. Enable In-App Purchase capability on the iOS App ID if EAS credentials do not add it automatically.
7. Attach **both** subscription groups to the app version you submit for review.
8. Test purchase, restore, group trial caps, cross-platform sync, and Phase B/C feature gates on TestFlight.

Full ASC localization (display names + descriptions for all 8 SKUs): [APP_STORE_CONNECT.md](./APP_STORE_CONNECT.md#localization-english--canada).

For web clinic checkout on `chairside.app`, configure RevenueCat Web Billing for all 8 products. See [WEB_BILLING.md](./WEB_BILLING.md). Web purchases use the same entitlements and Supabase sync path.

Current tier summary:

- **Free:** 1 active role + 1 fill-in (individual) or Free group trial (2 loc, 1 mgr, 1+1 posts)
- **Clinic Starter:** 5/5 posts, screening, CRM, outreach, SMS, Discover (single location)
- **Clinic Pro:** Unlimited posts, priority listing, insights, bulk outreach, unlimited screening
- **Group Starter:** 5 loc / 3 mgr / 5+5 posts org-wide + Clinic Starter hiring features
- **Group Pro:** Unlimited loc/mgr/posts + Clinic Pro premium features org-wide

See [CLINIC_GROUPS.md](./CLINIC_GROUPS.md) for group-specific billing rules.

## 8. TestFlight validation

Before submitting for review, complete [TESTFLIGHT_CHECKLIST.md](./TESTFLIGHT_CHECKLIST.md) on a physical iPhone.

## 9. Auth email via Pingram SMTP (pre-launch, separate)

Password reset and sign-up confirmation emails still use Supabase Auth. Before launch:

1. Verify `chairside.app` in Pingram **Domains**.
2. Pingram **Email Playground → SMTP & Supabase → Integrate with Supabase** (or manual SMTP: `smtp.ca.pingram.io`, port 465).
3. Test from Supabase → Auth → Users → Send password recovery.

## Quick reference

| Item | Value |
| ---- | ----- |
| Bundle ID | `com.chairside.app` |
| EAS project | `apps/mobile` only |
| Privacy URL | `https://<domain>/privacy` |
| Support URL | `https://<domain>/support` (contact form; no public inbox email) |
