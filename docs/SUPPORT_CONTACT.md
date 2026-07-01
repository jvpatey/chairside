# Support contact form (Pingram)

The `/support` page submits messages via the `support-contact` Supabase Edge Function, which sends email through Pingram `POST /email`.

## Pingram dashboard setup

1. Open [app.ca.pingram.io](https://app.ca.pingram.io) → **Email Playground**.
2. Create notification type **`support_contact`** with the **Email** channel enabled (`type` is required on `POST /email`).
3. **Domains** — verify `chairside.app` before production so `fromAddress` can be `support@chairside.app`. Until then use `noreply@pingram.io`.
4. Send a test from **Email Playground** to confirm delivery.

Use **Code samples → Supabase → Custom notifications via Edge Functions** (not the SMTP tab — that is for Supabase Auth emails).

## Supabase secrets

Set after linking the project (never commit real inbox addresses):

```bash
supabase secrets set SUPPORT_INBOX_EMAIL='your-inbox@example.com'
supabase secrets set SUPPORT_SENDER_EMAIL='noreply@pingram.io'
supabase secrets set SUPPORT_SENDER_NAME='Chairside Support'
# PINGRAM_API_KEY and optional PINGRAM_API_URL should already exist
```

`SUPPORT_INBOX_EMAIL` is server-only and not shown in the app.

## Deploy

```bash
supabase functions deploy support-contact --no-verify-jwt --use-api
```

## Smoke test

```bash
curl -X POST "https://<project-ref>.supabase.co/functions/v1/support-contact" \
  -H "Content-Type: application/json" \
  -H "apikey: <anon-key>" \
  -d '{"name":"Test","email":"you@example.com","subject":"General Question","message":"Hello from curl"}'
```

## Auth email (separate, pre-launch)

For password reset / sign-up emails, use Pingram **SMTP & Supabase** in the dashboard after domain verification. See [APP_STORE_RELEASE.md](./APP_STORE_RELEASE.md).
