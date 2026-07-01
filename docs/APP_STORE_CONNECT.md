# App Store Connect checklist

Use this when creating or updating the Chairside listing in App Store Connect.

Replace `<domain>` with your production web origin (e.g. `chairside.app`).

## App information

| Field | Suggested value |
| ----- | --------------- |
| Name | Chairside |
| Subtitle | Dental staffing for Canada |
| Bundle ID | `com.chairside.app` |
| SKU | `chairside-ios` (your choice) |
| Primary category | Business |
| Secondary category | Medical (optional) |
| Content rights | Does not contain third-party content requiring rights |
| Age rating | Complete questionnaire — expect 4+ (no restricted content) |

## URLs

| Field | URL |
| ----- | --- |
| Privacy Policy URL | `https://<domain>/privacy` |
| Support URL | `https://<domain>/support` |
| Marketing URL | `https://<domain>` (optional) |

## Description (draft)

**Promotional text (170 chars max)**

> Post fill-in shifts, browse dental roles, and coordinate hiring in one app—built for Canadian clinics and professionals.

**Description**

Chairside connects dental clinics and professionals across Canada.

**For clinics**
- Post permanent roles and same-day fill-in shifts
- Review applicants with built-in screening
- Message candidates and schedule interviews
- Get notified when someone applies

**For dental professionals**
- Browse roles and fill-ins on a map
- Apply with your application kit (resume, photo, profile)
- Get explainable match context on applications
- Turn on fill-in alerts and optional SMS for urgent shifts

Messaging, interviews, and notifications stay in one place—no email threads or phone tag.

**Keywords (100 chars max, comma-separated)**

dental,jobs,staffing,hygienist,assistant,clinic,fill-in,shift,canada,hiring

## Screenshots

Capture on iPhone 6.7" (required) and optionally 6.5", 5.5", iPad if `supportsTablet` matters for marketing.

Suggested screens:

1. Welcome / role selection
2. Worker browse map or job list
3. Application detail / match context
4. Clinic dashboard with postings
5. Messaging thread
6. Fill-in posting or alerts
7. Profile / notifications preferences

Store PNGs outside the repo or in a private `marketing/` folder if desired.

## App Review information

**Notes for reviewer**

```
Chairside is a B2B staffing app for dental clinics and dental professionals in Canada.

Test accounts (provide real credentials before submit):
- Clinic: clinic-review@example.com / <password>
- Worker: worker-review@example.com / <password>

Sign in with Apple and Google are available on iOS. Email/password also works.

Account deletion: Profile → Account → Delete account (two-step confirmation).

Push notifications require physical device; in-app notifications work in simulator.

Support: https://<domain>/support
Privacy: https://<domain>/privacy
```

Create dedicated review accounts with completed onboarding (clinic setup + worker setup + application kit).

## App Privacy (nutrition labels)

Answer based on actual data collection. Summary for Chairside:

| Data type | Collected | Linked to user | Used for | Third-party |
| --------- | --------- | -------------- | -------- | ----------- |
| Email address | Yes | Yes | Account, comms | Supabase |
| Name | Yes | Yes | Profile | Supabase |
| Phone number | Optional | Yes | SMS fill-in alerts | Pingram |
| Physical address | Yes | Yes | Clinic/worker location | Supabase, Mapbox |
| Photos/videos | Yes | Yes | Profile, logos | Supabase storage |
| Other user content | Yes | Yes | Applications, messages | Supabase |
| User ID | Yes | Yes | Account | Supabase |
| Product interaction | Yes | Yes | Notifications | Pingram |
| Crash data | If enabled later | — | — | — |

**Tracking:** No — we do not track users across apps for advertising.

**Third-party SDKs to disclose:** Supabase, Mapbox, Pingram, Apple Sign In, Google Sign In.

## Encryption

`ITSAppUsesNonExemptEncryption` is `false` in [`apps/mobile/app.json`](../apps/mobile/app.json) — select **No** for proprietary encryption beyond standard HTTPS in App Store Connect export compliance, unless your legal review says otherwise.

## Sign in with Apple

Required because the app offers Google sign-in. Confirm the App ID has Sign in with Apple enabled and the capability is in the production build.

## After approval

Update `APP_STORE_URL` in [`apps/mobile/src/constants/index.ts`](../apps/mobile/src/constants/index.ts) with the live App Store link and rebuild if the welcome web pitch should link to the store.
