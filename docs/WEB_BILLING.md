# Web billing (RevenueCat + Stripe)

Use this when enabling clinic subscriptions on `chairside.app`. Native iOS continues to use App Store IAP through the same RevenueCat project and entitlements.

## Prerequisites

- RevenueCat project with iOS App Store products already mapped to `clinic_starter` and `clinic_pro`
- Supabase edge functions deployed: `revenuecat-sync`, `revenuecat-webhook`
- Secrets set: `REVENUECAT_SECRET_API_KEY`, `REVENUECAT_WEBHOOK_SECRET`

## RevenueCat dashboard setup

1. **Connect Stripe** in RevenueCat → Account settings → Stripe.
2. **Create Web Billing app** in RevenueCat → Web → create RevenueCat Billing config (Stripe gateway).
3. **Create web products** mirroring App Store tiers:
   - Starter monthly / yearly
   - Pro monthly / yearly
4. **Map web products to entitlements** (same as iOS):
   - `clinic_starter`
   - `clinic_pro`
5. **Add web products to your default offering** alongside iOS packages (RevenueCat supports mixed store products in one offering).
6. **Copy the Web Billing public API key** (`rcb_…` sandbox or production).
7. **Confirm webhook** points to:
   - `https://<project-ref>.supabase.co/functions/v1/revenuecat-webhook`
   - Authorization: `Bearer <REVENUECAT_WEBHOOK_SECRET>`

## Package identifiers

The app resolves packages by identifier and product ID. Prefer matching App Store IDs where possible:

| Plan    | Monthly                 | Yearly                 |
| ------- | ----------------------- | ---------------------- |
| Starter | `clinic_starter_monthly` | `clinic_starter_yearly` |
| Pro     | `clinic_pro_monthly`    | `clinic_pro_yearly`    |

RevenueCat standard package types (`$rc_monthly`, `$rc_annual`) are also supported.

## Environment variables

### Local web dev (`apps/mobile/.env`)

```bash
EXPO_PUBLIC_REVENUECAT_WEB_API_KEY=rcb_...
```

### Production hosting (Vercel / Netlify / Cloudflare)

Set `EXPO_PUBLIC_REVENUECAT_WEB_API_KEY` at **build time** when running `pnpm export:web`. See [WEB_DEPLOY.md](./WEB_DEPLOY.md).

Do **not** add the web key to iOS EAS env unless you later ship a build that needs it on web views inside the native shell.

## How sync works

```text
Web checkout (Stripe via RevenueCat)
  → RevenueCat entitlements on clinic Supabase user ID
  → revenuecat-webhook → clinic_subscriptions
  → get_clinic_billing_state (web + iOS)

iOS App Store purchase
  → same path
```

After checkout, the web app also calls `revenuecat-sync` for immediate UI refresh; the webhook remains the async source of truth.

## Testing checklist

1. Clinic signs in on web → Plans & billing shows live prices.
2. Purchase Starter monthly → `clinic_subscriptions` updates; posting limits unlock.
3. Same clinic account on TestFlight/iOS → plan matches without a new iOS build.
4. iOS App Store purchase → web reflects the plan on refresh.
5. Web **Manage subscription** opens RevenueCat/Stripe customer portal.
6. Worker account cannot access clinic billing purchase flows.

## App Store review note

The first web billing release is **web-only**. The iOS binary in review does not need changes. Do not add external web checkout links inside the native iOS app until you intentionally adopt Apple's external purchase rules.
