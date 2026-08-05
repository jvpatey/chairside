# Web billing (RevenueCat + Stripe)

Use this when enabling clinic subscriptions on `chairside.app`. Native iOS continues to use App Store IAP through the same RevenueCat project and entitlements.

## Prerequisites

- RevenueCat project with iOS App Store products mapped to all four entitlements:
  - `clinic_starter`, `clinic_pro`
  - `clinic_group_starter`, `clinic_group_pro`
- Supabase edge functions deployed: `revenuecat-sync`, `revenuecat-webhook`
- Secrets set: `REVENUECAT_SECRET_API_KEY`, `REVENUECAT_WEBHOOK_SECRET`

## RevenueCat dashboard setup

1. **Connect Stripe** in RevenueCat → Account settings → Stripe.
2. **Create Web Billing app** in RevenueCat → Web → create RevenueCat Billing config (Stripe gateway).
3. **Create web products** mirroring App Store tiers (8 total):
   - Clinic Starter monthly / yearly
   - Clinic Pro monthly / yearly
   - Group Starter monthly / yearly
   - Group Pro monthly / yearly
4. **Map web products to entitlements** (same as iOS):

   | Entitlement | Plans |
   | ----------- | ----- |
   | `clinic_starter` | Clinic Starter |
   | `clinic_pro` | Clinic Pro |
   | `clinic_group_starter` | Group Starter |
   | `clinic_group_pro` | Group Pro |

5. **Add all 8 products to your default offering** alongside iOS packages (RevenueCat supports mixed store products in one offering).
6. **Copy the Web Billing public API key** (`rcb_…` sandbox or production).
7. **Confirm webhook** points to:
   - `https://<project-ref>.supabase.co/functions/v1/revenuecat-webhook`
   - Authorization: `Bearer <REVENUECAT_WEBHOOK_SECRET>`

## Package identifiers

The app resolves packages by identifier and product ID. Prefer matching App Store IDs where possible.

### Clinic plans (single location)

| Plan    | Monthly                  | Yearly                   |
| ------- | ------------------------ | ------------------------ |
| Starter | `clinic_starter_monthly_v2` | `clinic_starter_yearly_v2` |
| Pro     | `clinic_pro_monthly_v2`     | `clinic_pro_yearly_v2`     |

### Group plans (multi-location orgs)

| Plan          | Monthly                  | Yearly                   |
| ------------- | ------------------------ | ------------------------ |
| Group Starter | `group_starter_monthly`  | `group_starter_yearly_v2` |
| Group Pro     | `group_pro_monthly`      | `group_pro_yearly`       |

RevenueCat standard package types (`$rc_monthly`, `$rc_annual`, `$rc_monthly_group_starter`, etc.) are also supported. See [`packages/config/src/billing.ts`](../packages/config/src/billing.ts) for the full lookup list.

## Target pricing (CAD)

| Plan          | Monthly   | Yearly     |
| ------------- | --------- | ---------- |
| Clinic Starter | $59.99  | $599.99    |
| Clinic Pro     | $99.99  | $999.99    |
| Group Starter  | $129.99 | $1,199.99  |
| Group Pro      | $199.99 | $1,399.99  |

Set these in App Store Connect and RevenueCat Web Billing. The in-app billing screen shows live prices from RevenueCat offerings when configured.

**Clinic plans:** use **`_v2` product IDs** if original Clinic Plans SKUs were created at old prices — Apple does not allow price changes by deleting/recreating the same product ID.

**Group Starter yearly:** use **`group_starter_yearly_v2`** at **CA$1,199.99** — keeps a **$200/yr** step below Group Pro annual.

**Group Pro yearly:** use **CA$1,399.99** — App Store Connect’s default CAD tiers top out around this amount.

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

Plan resolution order: Group Pro → Group Starter → Clinic Pro → Clinic Starter → Free.

After checkout, the web app also calls `revenuecat-sync` for immediate UI refresh; the webhook remains the async source of truth.

## Billing UI behavior

- **Individual clinics** see Clinic plans only (Free / Starter / Pro).
- **Group accounts** see Group plans first (locations & managers), then Clinic plans (hiring tools only).
- Group plan cards become purchasable automatically when the default offering includes group packages.

## Testing checklist

1. Clinic signs in on web → Plans & billing shows live prices for clinic and (for groups) group tiers.
2. Purchase Clinic Starter monthly → `clinic_subscriptions` updates; posting limits unlock.
3. Group account purchases Group Starter → plan `group_starter`; location/manager caps unlock.
4. Same clinic account on TestFlight/iOS → plan matches without a new iOS build.
5. iOS App Store purchase → web reflects the plan on refresh.
6. Web **Manage subscription** opens RevenueCat/Stripe customer portal.
7. Worker account cannot access clinic billing purchase flows.

## App Store review note

The first web billing release is **web-only**. The iOS binary in review does not need changes. Do not add external web checkout links inside the native iOS app until you intentionally adopt Apple's external purchase rules.
