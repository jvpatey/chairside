# Notifications (Supabase in-app + Expo Push + Pingram email/SMS)

Chairside notification channels:

| Channel | Provider |
| ------- | -------- |
| In-app bell / history | Supabase `user_notifications` |
| Native mobile push | [Expo Push](https://docs.expo.dev/push-notifications/overview/) via `user_push_tokens` |
| SMS (fill-ins / outreach) | [Pingram](https://www.pingram.io/) `POST /sms` |
| Email (manager invites, support) | Pingram |

Pingram is **not** used for in-app or mobile push.

## Pingram dashboard setup (email + SMS only)

1. Create a Pingram environment (Canada region recommended).
2. Create notification types used for **SMS / email**:
   - `fill_in_posted` (SMS template + opt-out text)
   - `fill_in_outreach_sms` (SMS-only outreach text alerts)
   - `clinic_manager_invitation` (email)
   - `support_contact` (Support form email — see [SUPPORT_CONTACT.md](./SUPPORT_CONTACT.md))
3. Copy **Secret API key** → Supabase Edge Function secret `PINGRAM_API_KEY`.
4. Configure **APNs** in **EAS credentials** (not Pingram) — see [PUSH_IOS_PRODUCTION.md](./PUSH_IOS_PRODUCTION.md). **FCM** (Android) via EAS when you ship Android push.
5. Register SMS sender / campaign with Pingram support if using fill-in SMS.
6. Verify SMS channel: `export PINGRAM_API_KEY='pingram_sk_...' && ./scripts/verify-pingram-sms.sh`
7. Run migrations:
   - [`121_user_push_tokens.sql`](../supabase/migrations/121_user_push_tokens.sql) — Expo push tokens
   - [`123_user_notifications.sql`](../supabase/migrations/123_user_notifications.sql) — in-app inbox

Fill-in SMS is sent via Pingram `POST /sms` (not the multi-channel `/send` API). The posting clinic must be on a paid plan (`starter`, `pro`, `group_starter`, or `group_pro` — `clinic_can_use_feature(..., 'fill_in_sms')`). The worker must have `fill_in_sms_opt_in=true`, a normalizable phone, `short_notice_available`, a non-`off` fill-in mode, completed setup, and a role match for the shift. Free clinics still get in-app + push alerts; SMS is skipped.

Other event type ids (`application_received`, `message_received`, etc.) remain in `packages/config/src/notifications.ts` as Chairside type ids for the Supabase inbox + Expo push payloads. They do **not** need Pingram templates.

After deploy, smoke-test fill-in dispatch:

```bash
export NOTIFY_WEBHOOK_SECRET='...'  # from Supabase Edge Function secrets
./scripts/test-fill-in-notify.sh [shift_id] [clinic_id] [role_type] [shift_date]
```

## Supabase

### Migration

Run [`supabase/migrations/033_worker_notification_prefs.sql`](../supabase/migrations/033_worker_notification_prefs.sql) after prior migrations.

Run [`supabase/migrations/070_outreach_message_notification_cleanup.sql`](../supabase/migrations/070_outreach_message_notification_cleanup.sql) for outreach message notification suppression.

Run [`supabase/migrations/123_user_notifications.sql`](../supabase/migrations/123_user_notifications.sql) before expecting the in-app bell to populate.

### Edge Function

```bash
supabase secrets set PINGRAM_API_KEY=pingram_sk_...
supabase secrets set NOTIFY_WEBHOOK_SECRET=$(openssl rand -hex 32)
# Optional override (defaults to https://api.ca.pingram.io):
# PINGRAM_API_URL=https://api.ca.pingram.io
# Optional Expo Push access token (higher rate limits):
# EXPO_ACCESS_TOKEN=...

supabase functions deploy notify --no-verify-jwt --use-api
```

`notify` must be deployed with JWT verification off (`supabase/config.toml` sets `verify_jwt = false`). Database webhooks authenticate with `x-supabase-webhook-secret`, not a user JWT. A JWT-gated deploy returns 401 and drops every notification, including shortlists.

Secrets (auto-set when linked): `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`.

### Database webhooks

In Supabase → Database → Webhooks, create HTTP webhooks pointing to:

`https://<project-ref>.supabase.co/functions/v1/notify`

HTTP headers:

- `x-supabase-webhook-secret: <NOTIFY_WEBHOOK_SECRET>`
- `Content-Type: application/json`

| Table           | Events              |
| --------------- | ------------------- |
| `applications`  | INSERT, UPDATE      |
| `shift_posts`   | INSERT, UPDATE      |
| `job_posts`     | INSERT, UPDATE      |
| `messages`      | INSERT              |
| `clinic_invitations` | INSERT         |

Use `application/json` body (default Supabase webhook payload). Shortlisting is an `applications` **UPDATE** (`applied`/`reviewed` → `in_progress`). If that webhook is INSERT-only, candidates never get a shortlist notification.

#### Manager invitation emails

`clinic_invitations` INSERT (pending only) sends a Pingram **email** (`POST /email`) with type `clinic_manager_invitation`. Invitees may not have a Chairside account yet, so this path is email-only.

Required ops steps:

1. Run migrations through `097_clinic_manager_invitation_preview_resend.sql`.
2. Create Pingram notification type `clinic_manager_invitation` (`./scripts/setup-pingram-notification-types.sh`).
3. Deploy `notify` and add the `clinic_invitations` INSERT webhook above.
4. Set edge secrets as needed:
   - `APP_WEB_BASE_URL` (defaults to `https://chairsidedental.app`) for accept links
   - optional `INVITE_SENDER_EMAIL` / `INVITE_SENDER_NAME`

Smoke test (token redacted from script stdout):

```bash
export NOTIFY_WEBHOOK_SECRET='...'
./scripts/test-clinic-manager-invite-notify.sh [invitation_id] [organization_id] [email]
```

Idempotency key: `clinic_manager_invitation:{invitation_id}`. Invitation tokens must never appear in edge-function logs or analytics payloads.

## Mobile

- In-app bell: reads `user_notifications` (works in Expo Go when signed in against production/staging Supabase).
- Push: requires an **EAS build** on a **physical device** (not Expo Go). See **[PUSH_IOS_PRODUCTION.md](./PUSH_IOS_PRODUCTION.md)** for APNs in EAS + Expo Push + `eas build --profile production`.
- SMS: worker opts in on the **Fill-ins** tab (or Profile → Alerts); enter mobile number inline when enabling "Text me for fill-ins".
- Push preferences: candidates and clinics can mute push by category under **Profile → Notifications**. In-app notification history still records muted categories.
- Tapping a push notification navigates to the deep link and marks matching in-app items read when possible.
- Tab badges (Applications, Fill-ins, Messages) are separate from the notification bell and clear when the user visits the relevant screen.

Run migration [`supabase/migrations/057_notification_preferences.sql`](../supabase/migrations/057_notification_preferences.sql) before relying on preference toggles in production.

After changing `notify`, redeploy:

```bash
supabase functions deploy notify --no-verify-jwt --use-api
```

Shortlist smoke test (uses real `application_id` + `worker_id` from your project):

```bash
export NOTIFY_WEBHOOK_SECRET='...'
./scripts/test-application-notify.sh [application_id] [worker_id]
```

```bash
cd apps/mobile
eas build --profile production --platform ios
```

## Event summary

| Event | Recipient | Type id | Channels | Push pref category |
| ----- | --------- | ------------ | -------- | ------------------ |
| Application submitted | Clinic group: **owner + managers assigned to the post’s location** (all managers if `location_id` is null); each user’s prefs. Individual: org/owner id. | `application_received` | in-app + Expo push | `applications_interviews` |
| Status → reviewed/in_progress/rejected/selected/hired | Worker | matching `application_*` | in-app + Expo push | `applications_interviews` |
| Clinic requests full application kit | Worker | `application_kit_requested` | in-app + Expo push | `applications_interviews` |
| Interview offered / scheduled / cancelled / reschedule | Worker, or clinic (applicant-driven events): same location-aware clinic fan-out as applications | matching `application_interview_*` | in-app + Expo push | `applications_interviews` |
| Fill-in post → live | Eligible workers | `fill_in_posted` | in-app + Expo push; + SMS if clinic has `fill_in_sms` and worker opted in | `fill_in_alerts` |
| Fill-in post updated while live | Eligible workers | `fill_in_posted` (update copy) | in-app + Expo push; + SMS if clinic has `fill_in_sms` and worker opted in | `fill_in_alerts` |
| Job post → live | Eligible workers | `job_posted` | in-app + Expo push | `job_alerts` |
| New message | Worker ↔ clinic: clinic recipients are **owner + managers for the application post’s location** (general/outreach / null location → owner + all managers); each user’s `messages` pref; skip sender. Clinic-side sends notify the worker only. | `message_received` | in-app + Expo push | `messages` |
| Clinic fill-in outreach (with optional text alert) | Worker | `message_received` + optional `fill_in_outreach_sms` | in-app/Expo push for message; SMS-only for text alert | `messages` (message); SMS uses worker opt-in |
| Auto shift-details message in outreach thread | — | — | suppressed (no send) | — |
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

- `message_received:{messageId}:{recipientUserId}` (per recipient; location-aware clinic fan-out)
- `fill_in_outreach_sms:{messageId}` (SMS-only outreach text alert)
- `fill_in_posted:{shiftId}:{workerId}:{updatedAt}`
- `application_{status}:{applicationId}:{status}` (worker status updates)
- `application_kit_requested:{applicationId}:kit_requested` (clinic requested full application)
- `application_received:{applicationId}:{recipientUserId}` (clinic new applicant / cover request)
- `application_interview_*:{applicationId}:{recipientUserId}` (clinic-side interview alerts)
- `clinic_manager_invitation:{invitationId}` (manager invite email)

Outreach SMS also has a DB-side 24h rate limit per clinic→worker pair before the message is inserted (`outreach_sms:{clinicId}:{workerId}:…`).
