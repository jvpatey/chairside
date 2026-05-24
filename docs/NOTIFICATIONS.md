# Notifications (Pingram)

Chairside sends notifications through [Pingram](https://www.pingram.io/) (in-app, mobile push, optional SMS for fill-ins).

## Pingram dashboard setup

1. Create a Pingram environment (Canada region recommended).
2. Create notification types matching `packages/config/src/notifications.ts`:
   - `application_received`
   - `application_reviewed`
   - `application_rejected`
   - `application_hired`
   - `fill_in_posted` (configure SMS template + opt-out text)
   - `job_posted`
3. Mobile env: set `EXPO_PUBLIC_PINGRAM_CLIENT_ID` to either the **environment client ID** (Environments page) or the **public key** (`pingram_pk_...`). The app resolves `pingram_pk_` JWTs to the environment ID automatically — the SDK must not use the raw public key as `clientId`.
4. Copy **Secret API key** → Supabase Edge Function secret `PINGRAM_API_KEY`.
5. Upload **FCM** (Android) and **APNs** (iOS) credentials for mobile push.
6. Register SMS sender / campaign with Pingram support if using fill-in SMS.

## Supabase

### Migration

Run [`supabase/migrations/033_worker_notification_prefs.sql`](../supabase/migrations/033_worker_notification_prefs.sql) after prior migrations.

### Edge Function

```bash
supabase secrets set PINGRAM_API_KEY=pingram_sk_...
supabase secrets set NOTIFY_WEBHOOK_SECRET=$(openssl rand -hex 32)
# Optional override (defaults to https://api.ca.pingram.io):
# PINGRAM_API_URL=https://api.ca.pingram.io

supabase functions deploy notify --use-api
```

Secrets (auto-set when linked): `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`.

### Database webhooks

In Supabase → Database → Webhooks, create HTTP webhooks pointing to:

`https://<project-ref>.supabase.co/functions/v1/notify`

| Table           | Events              | Header |
| --------------- | ------------------- | ------ |
| `applications`  | INSERT, UPDATE      | `x-supabase-webhook-secret: <NOTIFY_WEBHOOK_SECRET>` |
| `shift_posts`   | INSERT, UPDATE      | same |
| `job_posts`     | INSERT, UPDATE      | same |

Use `application/json` body (default Supabase webhook payload).

## Mobile

- In-app: works in Expo Go when `EXPO_PUBLIC_PINGRAM_CLIENT_ID` is set.
- Push: requires EAS development build (`eas build --profile development`) and native FCM/APNs per Pingram docs.
- SMS: worker opts in on profile; requires `phone` on `worker_profiles`.

```bash
cd apps/mobile
eas build --profile development --platform ios
```

## Event summary

| Event | Recipient | Channels |
| ----- | --------- | -------- |
| Application submitted | Clinic | in-app, push |
| Status → reviewed/rejected/hired | Worker | in-app, push |
| Shift post → live | Workers (fill-in prefs + role) | in-app, push; + SMS if opted in |
| Job post → live | Workers (role + job opt-in) | in-app, push |
