# iOS push notifications (production)

Chairside uses [Pingram](https://www.pingram.io/) for delivery. The app registers devices with `@notificationapi/react-native`; the `notify` edge function sends `INAPP_WEB` + `PUSH`.

## 1. Pingram APNs credentials (Canada)

The Canada dashboard (`app.ca.pingram.io`) often **does not** show **Settings → Push**. APNs is configured in one of these places:

### Option A — Per-notification “Mobile Integration” (most common in UI)

Pingram’s current UI ties APNs to a notification that includes the **Mobile Push** channel:

1. Open [app.ca.pingram.io](https://app.ca.pingram.io) (region **CA**).
2. Create or open a notification type (e.g. `application_received`).
3. Ensure **Mobile Push** is enabled as a channel for that type (not only Email / SMS / In-App).
4. Open the **Mobile Integration** tab → **Apple Push Notification (APNs)**.
5. Fill in:
   - **Key ID** — [Apple Keys](https://developer.apple.com/account/resources/authkeys/list)
   - **Team ID** — Apple Developer account
   - **Topic** — `com.chairside.app` (must match `bundleIdentifier` in `app.config.ts`)
   - **Key** — full `.p8` file (including `-----BEGIN PRIVATE KEY-----` / `-----END PRIVATE KEY-----`)

Repeat for each type that should send push, or confirm one global/account-level form appears after Mobile Push is enabled.

### Option B — Direct settings URL (if your account has it)

Try: [https://app.ca.pingram.io/settings/push](https://app.ca.pingram.io/settings/push)

Older docs call this “Settings → Push”; some accounts only expose it via URL or the US dashboard.

### Option C — API (account-level, no dashboard UI)

Use your Pingram **secret** key (`pingram_sk_...`, same as `PINGRAM_API_KEY`).

| Field | What it is | Example |
| ----- | ------------ | ------- |
| **KeyId** | 10-character ID on the [Keys](https://developer.apple.com/account/resources/authkeys/list) page (not the key file contents) | `AB12CD34EF` |
| **TeamId** | Membership → Team ID | `K456XRWT8C` |
| **Topic** | App bundle ID | `com.chairside.app` |
| **Key** | Full text of the downloaded `.p8` file | `-----BEGIN PRIVATE KEY-----` … `-----END PRIVATE KEY-----` |

Common mistake: pasting the long base64 block into **KeyId**. That belongs in **Key**.

Use a JSON file so newlines in the `.p8` do not break the shell:

```bash
# apn-config.json — build with jq (do not commit this file)
jq -n \
  --arg keyId "YOUR_10_CHAR_KEY_ID" \
  --arg teamId "K456XRWT8C" \
  --arg topic "com.chairside.app" \
  --rawfile key /path/to/AuthKey_KF8AXB667A.p8 \
  '{ KeyId: $keyId, TeamId: $teamId, Topic: $topic, Key: $key }' \
  > apn-config.json

curl -X PUT 'https://api.ca.pingram.io/settings/push/apn' \
  -H "Authorization: Bearer YOUR_PINGRAM_SECRET_KEY" \
  -H "Content-Type: application/json" \
  -d @apn-config.json
```

Success returns JSON with `KeyId`, `TeamId`, `Topic` (not `{"message":"Invalid request body"}`).

Or use the repo script (see `scripts/configure-pingram-apn.sh`).

### If you still only see Email / SMS

- Ask your Pingram contact to enable **Mobile Push** on your environment, or
- Use **Option C** above, then confirm under **End Users** after a device registers.

Chairside types that need push: `application_received`, `application_reviewed`, `application_rejected`, `application_hired`, `fill_in_posted`, `job_posted` (each should support Mobile Push + In-App where applicable).

## 2. Apple Developer

1. App ID `com.chairside.app` with **Push Notifications** capability enabled.
2. Create an APNs Auth Key (`.p8`) if you do not have one — download once and store securely.

## 3. EAS credentials & production build

From `apps/mobile`:

```bash
# Link project (first time)
eas init

# Configure iOS push for production — answer Yes to push notifications / APNs key
eas credentials --platform ios

# Production build (install via TestFlight or internal distribution)
eas build --profile production --platform ios
```

`app.config.ts` sets `aps-environment` to `production` for the production profile and `development` for dev/preview builds.

## 4. Redeploy notify (server sends PUSH)

```bash
supabase functions deploy notify --use-api
```

## 5. Verify on a physical iPhone

Push does **not** work on the iOS Simulator or Expo Go.

1. Install the production or development EAS build.
2. Sign in and complete onboarding (worker or clinic).
3. Allow notifications when prompted.
4. In Pingram → **End Users**, find your Supabase `user.id` — **Mobile Push** should show an Apple icon (token registered).
5. Trigger an event (e.g. worker applies → clinic user) and confirm a banner arrives.

## Troubleshooting

| Issue | Check |
| ----- | ----- |
| No permission prompt | EAS build (not Expo Go); onboarding complete |
| Token missing in Pingram | `EXPO_PUBLIC_PINGRAM_CLIENT_ID` resolves to environment ID; same `userId` as Supabase auth |
| In-app works, no banner | APNs form in Pingram; `notify` deployed; user allowed notifications |
| Wrong environment | App uses `region: 'ca'`; `PINGRAM_API_URL` is `https://api.ca.pingram.io` |
