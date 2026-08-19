# iOS push notifications (production)

Chairside delivers **native push** via [Expo Push Notification Service](https://docs.expo.dev/push-notifications/overview/). The app registers an Expo push token in Supabase (`user_push_tokens`); the `notify` edge function sends banners through Expo. **Pingram** still handles in-app, SMS, and email — not Mobile Push.

## 1. Apple Developer

1. App ID `com.chairside.app` with **Push Notifications** capability enabled.
2. Create an APNs Auth Key (`.p8`) if you do not have one — download once and store securely.

## 2. EAS credentials (APNs lives here, not in Pingram)

From `apps/mobile`:

```bash
# Link project (first time)
eas init

# Configure iOS push for production — answer Yes to push notifications / APNs key
eas credentials --platform ios

# TestFlight / App Store build (preview or production profile)
eas build --profile preview --platform ios
# or
eas build --profile production --platform ios
```

Upload the same APNs `.p8` Key ID / Team ID / key into EAS when prompted. Expo Push uses those credentials to reach APNs.

`app.config.ts` sets `aps-environment` to `production` for **preview** and **production** EAS profiles (TestFlight and App Store). Only the **development** dev-client profile uses sandbox APNs.

### Android (when shipping Android push)

Configure FCM in EAS credentials (`eas credentials --platform android`). The app still registers Expo push tokens; no client-side FCM wiring beyond `expo-notifications`.

### EAS environment variables

Local `.env` files are not uploaded to EAS. For TestFlight builds, set Supabase (and Pingram for in-app) vars on EAS so they are baked into the binary:

```bash
cd apps/mobile
eas env:create --environment preview --name EXPO_PUBLIC_SUPABASE_URL --value 'https://…'
eas env:create --environment preview --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value '…'
eas env:create --environment preview --name EXPO_PUBLIC_PINGRAM_CLIENT_ID --value 'your_environment_id_or_pingram_pk_...'
```

Repeat for production. The EAS `projectId` in `app.json` (`extra.eas.projectId`) is required for `getExpoPushTokenAsync` — it is already set for this app.

## 3. Database + notify

1. Run migration [`supabase/migrations/121_user_push_tokens.sql`](../supabase/migrations/121_user_push_tokens.sql).
2. Redeploy notify:

```bash
supabase functions deploy notify --use-api
```

Optional: set `EXPO_ACCESS_TOKEN` (Expo account access token) as a Supabase Edge Function secret for higher Expo Push rate limits.

```bash
supabase secrets set EXPO_ACCESS_TOKEN=…
```

## 4. Verify on a physical iPhone

Push does **not** work on the iOS Simulator or Expo Go.

1. Install the production or development EAS build.
2. Sign in and complete onboarding (worker or clinic).
3. Allow notifications when prompted.
4. In Supabase → Table Editor → `user_push_tokens`, confirm a row for your user with an `ExponentPushToken[…]` value.
5. Trigger an event (e.g. worker applies → clinic user) and confirm a banner arrives.

## Troubleshooting

| Issue | Check |
| ----- | ----- |
| No permission prompt | EAS build (not Expo Go); onboarding complete |
| No row in `user_push_tokens` | Physical device; notification permission granted; `extra.eas.projectId` present; migration applied |
| In-app works, no banner | APNs key in EAS credentials; `notify` deployed; user push prefs enabled for that category |
| TestFlight, no push | Rebuild with **preview** or **production** profile (`aps-environment: production`); confirm EAS has the production APNs key |
| Expo ticket errors in notify logs | Invalid/expired token (re-open app to re-register); APNs misconfigured in EAS |
