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

**Supabase → Authentication → Providers → Apple → Client IDs** must list:

1. Services ID first (web OAuth), e.g. `com.chairside.app.auth`
2. Bundle ID second (native ID token), e.g. `com.chairside.app`

Web uses OAuth; iOS uses native `signInWithIdToken` against the bundle ID audience. If only the Services ID is listed, web Apple works and native Apple fails.

If native Apple still fails with Client IDs correct, check **Supabase → Logs → Auth** for `/token` errors right after a failed attempt (e.g. issuer mismatch / unacceptable audience). Prefer a physical device TestFlight build over the simulator.

Apple only returns the user’s name on the **first** authorization for that Apple ID + app. Later sign-ins send `fullName: null`. Chairside caches the name in SecureStore (keyed by Apple’s user id) and also writes `profiles.first_name` / `last_name` / `display_name`.

To re-test first-time name delivery on TestFlight: **Settings → Apple ID → Sign in with Apple → Chairside → Stop Using**, then Sign in with Apple again.

## Subscriptions (Clinic + Group)

Create **two** auto-renewable subscription groups. Product IDs must match [`packages/config/src/billing.ts`](../packages/config/src/billing.ts).

> **Burned IDs:** Apple permanently reserves deleted **product IDs**. If you created Clinic Plans at old prices, create new **`_v2`** SKUs (below) instead of reusing `clinic_starter_monthly`, etc.
>
> **Reference names** (ASC internal label) must also be **unique app-wide** — including on deleted subscriptions. When recreating SKUs, suffix reference names with **`v2`** (e.g. `Clinic Starter Monthly v2`). Reference names are not used in code; only **product IDs** must match `billing.ts`.

### All product IDs & prices (CAD)

| Product ID | Reference name (ASC internal) | Group | Duration | Price |
| ---------- | ----------------------------- | ----- | -------- | ----- |
| `clinic_starter_monthly_v2` | Clinic Starter Monthly v2 | Clinic Plans | 1 month | $59.99 |
| `clinic_starter_yearly_v2` | Clinic Starter Yearly v2 | Clinic Plans | 1 year | $599.99 |
| `clinic_pro_monthly_v2` | Clinic Pro Monthly v2 | Clinic Plans | 1 month | $99.99 |
| `clinic_pro_yearly_v2` | Clinic Pro Yearly v2 | Clinic Plans | 1 year | $999.99 |
| `group_starter_monthly` | Group Starter Monthly v2 | Group Plans | 1 month | $129.99 |
| `group_starter_yearly_v2` | Group Starter Yearly v2 | Group Plans | 1 year | $1,199.99 |
| `group_pro_monthly` | Group Pro Monthly v2 | Group Plans | 1 month | $199.99 |
| `group_pro_yearly` | Group Pro Yearly v2 | Group Plans | 1 year | $1,399.99 |

### Subscription ranking

**Clinic Plans** (highest → lowest):

1. `clinic_pro_yearly_v2`
2. `clinic_pro_monthly_v2`
3. `clinic_starter_yearly_v2`
4. `clinic_starter_monthly_v2`

**Group Plans** (highest → lowest):

1. `group_pro_yearly`
2. `group_pro_monthly`
3. `group_starter_yearly_v2`
4. `group_starter_monthly`

### Localization (English — Canada)

Set **Subscription Duration** in ASC separately (1 month / 1 year). Use the same **Display Name** for monthly and yearly pairs.

**Description** field is limited to **55 characters** in App Store Connect.

#### Clinic Starter (`clinic_starter_monthly_v2` / `clinic_starter_yearly_v2`)

| Field | Copy |
| ----- | ---- |
| **Reference name** (internal) | **Clinic Starter Monthly v2** / **Clinic Starter Yearly v2** |
| **Display name** | Clinic Starter |
| **Description** (≤55 chars) | `5 roles & fill-ins, screening, CRM & outreach` (45) |

#### Clinic Pro (`clinic_pro_monthly_v2` / `clinic_pro_yearly_v2`)

| Field | Copy |
| ----- | ---- |
| **Reference name** (internal) | **Clinic Pro Monthly v2** / **Clinic Pro Yearly v2** |
| **Display name** | Clinic Pro |
| **Description** (≤55 chars) | `Unlimited posts, insights, bulk outreach & badge` (48) |

#### Group Starter (`group_starter_monthly` / `group_starter_yearly_v2`)

| Field | Copy |
| ----- | ---- |
| **Reference name** (internal) | **Group Starter Monthly v2** / **Group Starter Yearly v2** |
| **Display name** | Group Starter |
| **Description** (≤55 chars) | `5 locations, 3 managers, org-wide hiring tools` (46) |

#### Group Pro (`group_pro_monthly` / `group_pro_yearly`)

| Field | Copy |
| ----- | ---- |
| **Reference name** (internal) | **Group Pro Monthly v2** / **Group Pro Yearly v2** |
| **Display name** | Group Pro |
| **Description** (≤55 chars) | `Unlimited locations, managers & org-wide hiring` (47) |

Attach both groups to the app version you submit. Map all products in RevenueCat to entitlements `clinic_starter`, `clinic_pro`, `clinic_group_starter`, and `clinic_group_pro`. Full runbook: [APP_STORE_RELEASE.md](./APP_STORE_RELEASE.md) and [WEB_BILLING.md](./WEB_BILLING.md).

## After approval

Update `APP_STORE_URL` in [`apps/mobile/src/constants/index.ts`](../apps/mobile/src/constants/index.ts) with the live App Store link and rebuild if the welcome web pitch should link to the store.
