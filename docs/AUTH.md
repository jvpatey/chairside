# Auth (workers)

## Worker sign-up / sign-in

Workers sign up with **name + phone or email**, verified by a one-time code (OTP). Google and Apple remain available. Existing accounts can still sign in with **email + password**.

Clinic accounts (including invites) keep email/password for now.

After auth, workers get focused capture screens only for what’s missing — **name → phone (if none) → role + area (city/province)** — then land in the main app. Phone and role/area are skippable (“Skip for now”); name is required. Apply / cover still soft-gate on a complete worker profile. Fill-in SMS still requires `setup_completed_at` (set automatically once core profile fields are saved).

**Phone must be linked on Supabase Auth** (not only `worker_profiles.phone`) for phone OTP sign-in to find the same account. Adding a number after email sign-up sends a verify SMS (`updateUser` + `phone_change` OTP). Sign-in phone OTP uses `shouldCreateUser: false` so unknown numbers do not mint empty accounts.

If a phone-only **shell** Auth user was created before linking existed, `reclaim-auth-phone` deletes that empty user when the real account binds the number, and phone sign-in into a shell that belongs to another profile is rejected with a sign-in-with-email message.

Profile / capture bind calls `updateUser({ phone })` then `resend({ type: 'phone_change' })` so a code is actually sent when confirmations are on.

```bash
supabase db push   # or apply migration 138_reclaim_auth_phone.sql
supabase functions deploy reclaim-auth-phone --use-api
```

## Phone OTP via Pingram (not Twilio)

Auth OTP SMS is sent by **Pingram** through Supabase’s **Send SMS** Auth hook. Do **not** configure Twilio for this.

Built-in SMS provider fields in **Authentication → Providers → Phone** stay unused once the hook is enabled.

### 1. Create the Pingram type (terminal)

Use the **Canada** key (same as fill-in SMS):

```bash
export PINGRAM_API_KEY='pingram_sk_...'
# optional if already set as edge secret:
# export PINGRAM_API_URL='https://api.ca.pingram.io'

./scripts/setup-pingram-notification-types.sh
./scripts/verify-pingram-sms.sh
# optional real send:
# TEST_PHONE='+19025551234' ./scripts/verify-pingram-sms.sh
```

That ensures type `auth_otp` exists with an SMS channel.

### 2. Deploy the Auth hook function

```bash
supabase functions deploy send-auth-sms --no-verify-jwt --use-api
```

`supabase/config.toml` already sets `verify_jwt = false` for this function (Auth calls it before a user JWT exists).

Secrets (reuse existing Pingram secrets; add the hook secret):

```bash
# already used by notify — keep these
supabase secrets set PINGRAM_API_KEY='pingram_sk_...'
supabase secrets set PINGRAM_API_URL='https://api.ca.pingram.io'

# from Authentication → Hooks → Send SMS (format v1,whsec_...)
supabase secrets set SEND_SMS_HOOK_SECRET='v1,whsec_...'
```

### 3. Enable the Send SMS hook (dashboard) — do this before Phone

1. Supabase → **Authentication → Hooks**
2. Enable **Send SMS**
3. URI: `https://<project-ref>.supabase.co/functions/v1/send-auth-sms`
4. Copy the hook secret into `SEND_SMS_HOOK_SECRET` (step 2) if you have not already
5. Save

### 4. Enable Phone provider (dashboard) — after the hook

1. **Authentication → Providers → Phone**
2. Turn **Enable Phone provider** On
3. Twilio fields should be disabled / not required (hook is active). If Save still demands Twilio SIDs, enter dummy `AC…` / `MG…` values, Save, then confirm the Send SMS hook is still on.
4. Keep OTP length **6** and expiry **60** (or your preference)
5. Turn **Enable phone confirmations** On — required so `updateUser({ phone })` sends an SMS (profile / capture bind). If this is off, Auth may apply the number with no text.
6. Save

### 5. Smoke test

1. App → worker sign-up → phone → Send code
2. Text arrives via Pingram; code signs you in
3. Confirm the send under Pingram Canada **Logs** (`auth_otp`)

## Email OTP / OAuth

Email OTP and Google/Apple do not use the Send SMS hook. Delivery uses **Pingram SMTP** (same as confirm / reset). Keep email auth enabled.

### New emails use Confirm signup when “Confirm email” is on

Worker email auth calls `signInWithOtp` and the app asks for a **numeric code**.

- **Existing / confirmed users** → **Magic Link** template
- **Brand-new emails** while **Confirm email** is enabled → **Confirm signup** template (this was sending a link-only message)

Both templates must include `{{ .Token }}`. Prefer **Confirm email** off (`mailer_autoconfirm`) so first-time OTP uses Magic Link like phone OTP. Clinic password signup still works; confirmation is implicit.

1. Supabase → **Authentication → Providers → Email** → turn **Confirm email** **Off** (or leave On only if you need link confirm for clinics)
2. **Emails → Magic Link** → [`supabase/templates/magic-link.html`](../supabase/templates/magic-link.html) · subject `Your Chairside sign-in code`
3. **Emails → Confirm signup** → [`supabase/templates/confirm-signup.html`](../supabase/templates/confirm-signup.html) · subject `Your Chairside confirmation code` (code first; link optional)
4. **Email OTP length** = **6**
5. Custom SMTP still on (Pingram `smtp.ca.pingram.io`)
6. Smoke test: new worker email → Send code → inbox shows a 6-digit code (not only a Confirm button)

Google / Apple OAuth are unchanged.

## Related code

- Hook: `supabase/functions/send-auth-sms/index.ts`
- OTP helpers: `packages/api/src/authOtp.ts`
- Worker signup/sign-in UI: `apps/mobile/app/(onboarding)/sign-up.tsx`, `sign-in.tsx`
- Soft tab access: `apps/mobile/src/lib/setupCompletion.ts` (`canAccessWorkerTabs`)
- Product SMS (fill-ins): [NOTIFICATIONS.md](./NOTIFICATIONS.md)
