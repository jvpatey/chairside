# Analytics (PostHog)

Chairside uses **PostHog** for product analytics across:

- Native iOS / Android (`posthog-react-native`)
- Web / `chairside.app` (`posthog-js` + Expo Router pageviews)
- Edge SMS paths (`notify`, `pingram-sms-inbound` via HTTP capture)

Vercel Analytics remains enabled on web for anonymous page metrics.

Session replay is **off**.

## Environment

### Client (EAS native + Vercel web)

```bash
# Local: apps/mobile/.env
EXPO_PUBLIC_POSTHOG_KEY=phc_...
EXPO_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com

# EAS
cd apps/mobile
eas env:create --environment production --name EXPO_PUBLIC_POSTHOG_KEY --value 'phc_...'
eas env:create --environment production --name EXPO_PUBLIC_POSTHOG_HOST --value 'https://us.i.posthog.com'
# Repeat for --environment preview

# Vercel (web export / hosting): set the same EXPO_PUBLIC_POSTHOG_* vars for production
```

If `EXPO_PUBLIC_POSTHOG_KEY` is unset, the client no-ops (safe for local dev).

### Server (Supabase secrets)

```bash
supabase secrets set POSTHOG_API_KEY=phc_...
# optional
supabase secrets set POSTHOG_HOST=https://us.i.posthog.com
```

Redeploy after setting secrets:

```bash
supabase functions deploy notify --no-verify-jwt --use-api
supabase functions deploy pingram-sms-inbound --no-verify-jwt --use-api
```

Use the **same PostHog project** for client and server so SMS → listing → apply funnels stitch by `distinct_id` (user id).

## Client events

| Event | When |
|-------|------|
| `$pageview` | Web Expo Router path changes |
| Autocaptured screens | Native (PostHog provider) |
| `listing_opened` | Public `/f` or `/j` listing loaded (`source`: `sms` \| `share` \| `direct`) |
| `listing_contact_tapped` | Sourced Call / Email / Open |
| `listing_sign_in_to_apply_tapped` | Clinic public listing CTA |
| `apply_started` | Worker starts apply / cover flow |
| `cover_requested` / `apply_submitted` | Successful cover request or job application |
| `auth_signed_in` | After successful auth routing (`role` only) |

Persons are identified with the Supabase user id and `role`. Sign-out calls `reset()`.

SMS fill-in links include `?src=sms` (`buildFillInListingUrl` in `notify`).

Do **not** send phones, emails, invite tokens, or message bodies.

## Server events

| Event | Source |
|-------|--------|
| `sms_sent` | `pingramSendSms` success (`type`, `tracking_id`, optional props) |
| `sms_failed` | `pingramSendSms` failure |
| `sms_reply_yes` | Inbound YES cover request (`shift_post_id`, `outcome`) |
| `sms_help` | Inbound HELP |
| `sms_opt_out` / `sms_opt_in` | STOP / START subscription sync |

## Code map

- Client helpers: `apps/mobile/src/lib/analytics/`
- Providers: `apps/mobile/src/components/analytics/PostHogApp.tsx` (+ `.web.tsx`)
- Edge helper: `supabase/functions/_shared/posthog.ts`
