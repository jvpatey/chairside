# Notifications (Pingram)

Chairside sends notifications through [Pingram](https://www.pingram.io/) (in-app, mobile push, optional SMS for fill-ins).

## Pingram dashboard setup

1. Create a Pingram environment (Canada region recommended).
2. Create notification types matching `packages/config/src/notifications.ts`:
   - `application_received`
   - `application_reviewed`
   - `application_in_progress`
   - `application_interview_offered`
   - `application_interview_scheduled`
   - `application_interview_accepted`
   - `application_interview_declined`
   - `application_interview_cancelled`
   - `application_interview_reschedule_proposed`
   - `application_interview_reschedule_accepted`
   - `application_interview_reschedule_declined`
   - `application_interview_scheduled_cancelled`
   - `application_selected`
   - `application_rejected`
   - `application_hired`
   - `fill_in_posted` (configure SMS template + opt-out text)
   - `fill_in_outreach_sms` (SMS-only; clinic-initiated fill-in text alerts)
   - `job_posted`
   - `message_received`
   - `support_contact` (Support page form email — see [SUPPORT_CONTACT.md](./SUPPORT_CONTACT.md))
3. Mobile env: set `EXPO_PUBLIC_PINGRAM_CLIENT_ID` to either the **environment client ID** (Environments page) or the **public key** (`pingram_pk_...`). The app resolves `pingram_pk_` JWTs to the environment ID automatically — the SDK must not use the raw public key as `clientId`.
4. Copy **Secret API key** → Supabase Edge Function secret `PINGRAM_API_KEY`.
5. Configure **APNs** (iOS) — often under a notification’s **Mobile Integration** tab (not Settings → Integrations). See [PUSH_IOS_PRODUCTION.md](./PUSH_IOS_PRODUCTION.md). **FCM** (Android) when you ship Android push.
6. Register SMS sender / campaign with Pingram support if using fill-in SMS.
7. Verify SMS channel: `export PINGRAM_API_KEY='pingram_sk_...' && ./scripts/verify-pingram-sms.sh`

After deploy, smoke-test fill-in dispatch:

```bash
export NOTIFY_WEBHOOK_SECRET='...'  # from Supabase Edge Function secrets
./scripts/test-fill-in-notify.sh [shift_id] [clinic_id] [role_type] [shift_date]
```

## Supabase

### Migration

Run [`supabase/migrations/033_worker_notification_prefs.sql`](../supabase/migrations/033_worker_notification_prefs.sql) after prior migrations.

Run [`supabase/migrations/070_outreach_message_notification_cleanup.sql`](../supabase/migrations/070_outreach_message_notification_cleanup.sql) for outreach message notification suppression.

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
| `messages`      | INSERT              | same |
| `clinic_invitations` | INSERT         | same |

Use `application/json` body (default Supabase webhook payload).

#### Manager invitation emails

`clinic_invitations` INSERT (pending only) sends a Pingram **email** (`POST /email`) with type `clinic_manager_invitation`. Invitees may not have Chairside/Pingram users yet, so this path is email-only (not in-app/push).

Required ops steps:

1. Run migrations through `097_clinic_manager_invitation_preview_resend.sql`.
2. Create Pingram notification type `clinic_manager_invitation` (`./scripts/setup-pingram-notification-types.sh`).
3. Deploy `notify` and add the `clinic_invitations` INSERT webhook above.
4. Set edge secrets as needed:
   - `APP_WEB_BASE_URL` (defaults to `https://chairside.app`) for accept links
   - optional `INVITE_SENDER_EMAIL` / `INVITE_SENDER_NAME`

Smoke test (token redacted from script stdout):

```bash
export NOTIFY_WEBHOOK_SECRET='...'
./scripts/test-clinic-manager-invite-notify.sh [invitation_id] [organization_id] [email]
```

Idempotency key: `clinic_manager_invitation:{invitation_id}`. Invitation tokens must never appear in edge-function logs or analytics payloads.

## Mobile

- In-app bell: works in Expo Go when `EXPO_PUBLIC_PINGRAM_CLIENT_ID` is set.
- Push: requires an **EAS build** on a **physical device** (not Expo Go). See **[PUSH_IOS_PRODUCTION.md](./PUSH_IOS_PRODUCTION.md)** for APNs + Pingram + `eas build --profile production`.
- SMS: worker opts in on the **Fill-ins** tab (or Profile → Alerts); enter mobile number inline when enabling "Text me for fill-ins".
- Push preferences: candidates and clinics can mute push by category under **Profile → Notifications**. In-app notification history still records muted categories.
- Tapping a push notification navigates to the deep link and marks matching Pingram in-app items read when possible.
- Tab badges (Applications, Fill-ins, Messages) are separate from the notification bell and clear when the user visits the relevant screen.

Run migration [`supabase/migrations/057_notification_preferences.sql`](../supabase/migrations/057_notification_preferences.sql) before relying on preference toggles in production.

After changing `notify`, redeploy:

```bash
supabase functions deploy notify --use-api
```

```bash
cd apps/mobile
eas build --profile production --platform ios
```

## Event summary

| Event | Recipient | Pingram type | Channels | Push pref category |
| ----- | --------- | ------------ | -------- | ------------------ |
| Application submitted | Clinic | `application_received` | in-app, push | `applications_interviews` |
| Status → reviewed/in_progress/rejected/selected/hired | Worker | matching `application_*` | in-app, push | `applications_interviews` |
| Interview offered / scheduled / cancelled / reschedule | Worker or clinic | matching `application_interview_*` | in-app, push | `applications_interviews` |
| Fill-in post → live | Eligible workers | `fill_in_posted` | in-app, push; + SMS if opted in | `fill_in_alerts` |
| Fill-in post updated while live | Eligible workers | `fill_in_posted` (update copy) | in-app, push; + SMS if opted in | `fill_in_alerts` |
| Job post → live | Eligible workers | `job_posted` | in-app, push | `job_alerts` |
| New message | Other participant | `message_received` | in-app, push | `messages` |
| Clinic fill-in outreach (with optional text alert) | Worker | `message_received` + optional `fill_in_outreach_sms` | in-app/push for message; SMS-only for text alert | `messages` (message); SMS uses worker opt-in |
| Auto shift-details message in outreach thread | — | — | suppressed (no Pingram send) | — |
| Clinic manager invitation created | Invitee email | `clinic_manager_invitation` | email (`POST /email`) | — |

### Deep links

| Conversation / event | Deep link |
| -------------------- | --------- |
| Application thread message | `/(tabs)/application/{application_id}/messages` or clinic equivalent |
| General / outreach message | `/(tabs)/conversation/{conversation_id}` or clinic equivalent |
| Worker application update | `/(tabs)/application/{application_id}` |
| Clinic new applicant | `/(clinic-tabs)/applications` |
| Fill-in alert | `/(tabs)/fillins` |
| Job alert | `/(tabs)/browse` |

### Idempotency

Edge dispatch dedupes via `notification_dispatch_log.idempotency_key`. Common patterns:

- `message_received:{messageId}`
- `fill_in_outreach_sms:{messageId}` (SMS-only outreach text alert)
- `fill_in_posted:{shiftId}:{workerId}:{updatedAt}`
- `application_{status}:{applicationId}:{status}` (worker status updates)
- `application_received:{applicationId}` (clinic new applicant)
- `clinic_manager_invitation:{invitationId}` (manager invite email)

Outreach SMS also has a DB-side 24h rate limit per clinic→worker pair before the message is inserted (`outreach_sms:{clinicId}:{workerId}:…`).
