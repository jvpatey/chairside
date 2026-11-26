# Clinic groups

Clinic accounts are either a **single clinic** (org + one location) or a **group** (org + named locations + optional managers). Owners choose at signup on the name screen (default: single clinic). A single clinic that later adds a second clinic under Settings → **Clinics** is auto-promoted to **group**.

## Feature flag

Enabled by default. Disable with:

```bash
EXPO_PUBLIC_CLINIC_GROUPS_ENABLED=0
```

When disabled, clinics stay on the single-location path (no Clinics / Team settings).

## Setup flow (one path)

**OTP signup** (phone or email) → focused onboarding capture screens (no clinic-setup sidebar/wizard): **clinic or group name → phone → physical address** → clinic tabs (soft). No manager/dentist name requirement, no mandatory review.

**Name screen:** a two-option control, **Single clinic** (default) or **Group of clinics**. Single asks “What’s your clinic called?”; group asks “What’s your group called?” (group name is the organization name, never a location). Choosing group sets `account_type = group` up front. The control is hidden once a clinic address has been saved.

**Address screen**
- **Single:** one address, saved on the practice profile (the DB mirrors it to the clinic’s only location). No add-another link; footnote points to Settings → Clinics for more clinics later.
- **Group:** each clinic is a named location (**Clinic name** + address) created with `createClinicLocation`, with a list of saved clinics and **Save and add another clinic**. The group name is not reused as a location name. The DB trigger only auto-creates/renames locations for individual accounts, so group locations are managed entirely by the app.
- Free group accounts include up to **2 clinics**; a 3rd opens the upgrade prompt and keeps the clinics already entered.

After signup, single-clinic owners with a complete profile see an **Add a clinic** nudge on the dashboard (dismissible with “Not now”, remembered on device). A single clinic that adds a second clinic is promoted to group before the insert (so the plan limit trigger counts the right family; rolled back if the insert is rejected). In **Settings → Clinics**, once there are 2+ clinics, if the first site still uses the original clinic name, a **Rename first clinic** prompt appears.

Analytics: `clinic_signup_account_type_selected`, `clinic_signup_address_saved`, `clinic_signup_add_another_tapped`, `clinic_signup_address_skipped`, `clinic_signup_location_added`, `clinic_signup_location_limit_hit`, `clinic_add_clinic_nudge_tapped`, `clinic_add_clinic_nudge_dismissed`, `clinic_location_added_later` (`apps/mobile/src/lib/analytics/events.ts`).

Posting soft-gates until name + phone + complete address are present (Continue opens the next capture screen). Practice / about / team enrichment stay in Settings.

### Adding clinics later

Owners open **Settings → Clinics** to add another site (name + address + optional practice fields). The second active location promotes the account to group. When 2+ clinics exist, the fill-in post form shows a clinic picker.

Each site can include: name, optional **clinic photo**, address, phone, specialty, software, operatories, and team size. The first / default location is mirrored onto `clinic_profiles` for marketplace compatibility — internal, not a user-facing “primary” badge.

### Viewing one clinic at a time

Groups always view **exactly one clinic** — there is no combined “all locations” view. The first accessible clinic (primary first) is selected by default; the choice is remembered per user + organization (a stale or legacy `all` value is ignored). `ClinicProfileContext` resolves this via `resolveActiveLocationId`, so `locationScope` is always a location id for groups and `scopedLocationIds` is `[id]`.

The group name is always the dashboard hero title. A solid location pill (`ClinicLocationScopeSwitcher`) sits under the hero title on the dashboard and under the page title on Fill-ins, Roles, Calendar and Applications; it switches the clinic (dropdown on web, bottom sheet on native). The post fill-in / post role forms default to the selected clinic.

### Org-level (About / Group profile)

Shared across multi-site accounts: practice doctors, description, and website. Specialty, software, and clinic photo live on each clinic row. Practice doctors (`practice_doctors` JSON) can be assigned to one or more `location_ids`.

## Profile hub

- **Clinics** — owners add/edit sites (individuals included so they can grow into a group). Managers see assigned clinics only.
- **Your profile** — group owners/managers edit membership name, title, bio, photo.
- **Practice details** — single-site clinics; multi-site uses Clinics.
- **Team & access** — group owners invite managers after multi-location exists.
- **About / Group profile** — owners only for story, website, doctors.

## Access model

- **Owner** — one primary login with full org access, billing, locations, and invitations.
- **Manager** — invited individual login with location assignments only. Sets personal profile after join via **Profile → Your profile**.

## Free group trial caps

Free group accounts (plan `free` + `account_type=group`) can use up to **2 locations** and **1 manager per location** (2 managers). Hitting either cap shows an upgrade prompt toward Group Starter / Group Pro. Paid hiring tools (screening, CRM follow-ups, PDF export, Discover, general candidate messaging) stay locked on Free the same as individual Free clinics.

### Manager invitations

Owners invite managers from **Settings → Team & access** after multi-location exists:

1. Owner picks email, optional name/title, and **at least one location** (locations start unselected).
2. Creating a pending invite INSERT triggers the `notify` edge function → Pingram email with link `https://chairside.app/accept-invite?token=…`.
3. Invitee signs in or signs up as a clinic user; the token is preserved through email/password, OAuth, email confirm, and app restarts.
4. Accept screen shows a safe preview (group, inviter, locations, invited email, expiry). Acceptance is explicit (no silent auto-join) and requires an exact email match. Wrong email → **Switch account**.
5. On accept, assigned locations from the invite are copied to the membership — **that’s the full setup**. The group owner gets an in-app + push notification (`clinic_manager_joined`) linking to Team & access.
6. Owner actions on pending invites: **Resend** (fresh token + expiry + new email), **Copy invite link**, **Revoke**. If email delivery is delayed, copy-link remains available.

Manual code entry remains a secondary fallback on the accept screen.

Security rules (SQL RPC): exact invited-email match, 7-day expiry, one-time accept, revoke, and preview that never returns raw tokens. See `096_fix_manager_invitation_rpc.sql` and `097_clinic_manager_invitation_preview_resend.sql`.

## Universal / App Links

Installed apps should open invitation HTTPS links via:

- iOS Associated Domains: `applinks:chairside.app`
- Android verified intent filters for `https://chairside.app/accept-invite`, `/f` (fill-in listings), and `/j` (job listings)

Host from web static assets (served without SPA rewrite):

- `/.well-known/apple-app-site-association` (Team ID `K456XRWT8C`, bundle `com.chairside.app`)
- `/.well-known/assetlinks.json` (`com.chairside.app`)

**Required before production:** replace `REPLACE_WITH_PLAY_APP_SIGNING_SHA256` in `apps/mobile/public/.well-known/assetlinks.json` with the Play App Signing certificate SHA-256. Keep `chairside://` as a development/fallback scheme.

## Billing

Subscriptions and posting limits remain organization-scoped (owner / `clinic_id`). Managers can read billing state but cannot purchase or restore.

> **Interim — everything is unlimited.** Tiered plans are being reworked. Migration `143_unlimited_plans_interim.sql` redefines the limit helpers (`clinic_active_*_limit`, `clinic_max_locations`, `clinic_max_managers`, `clinic_custom_screening_limit`) as unlimited and `clinic_can_use_feature` as unlocked for all clinics (except `priority_listing`, which stays a paid placement perk). Posting, location and manager triggers, `get_clinic_billing_state` and the app all read through these helpers, so no app change is needed to re-enable limits — redefine them in the next migration. The matrices below describe the previous behaviour.

### Plan families

Chairside has two product lines:

| Family | Plans | Best for |
| ------ | ----- | -------- |
| **Clinic** | Free, Starter, Pro | Single-location clinics |
| **Group** | Free trial, Group Starter, Group Pro | Multi-location orgs and DSOs |

**Free group trial:** up to 2 locations, 1 manager per location (2 managers), 1 active role + 1 fill-in org-wide. Same hiring-tool gates as individual Free.

**Clinic Starter / Pro on a group account** unlock hiring tools (screening, CRM, outreach, etc.) but **do not** increase location or manager limits. For more sites or managers, upgrade to **Group Starter** or **Group Pro**.

**Clinic Pro ≠ multi-location.** A single-location Pro subscriber who adds a second location must move to a Group plan (Free trial or paid).

### Group plan caps (paid)

| Plan | Locations | Managers | Active roles / fill-ins |
| ---- | --------- | -------- | ----------------------- |
| Group Starter | 5 | 3 | 5 / 5 org-wide |
| Group Pro | Unlimited | Unlimited | Unlimited org-wide |

Group Pro also includes priority listing, hiring insights (with per-location breakdown), bulk fill-in outreach, and unlimited custom screening.

### Purchasing

- Owners purchase from **Profile → Plans & billing** (or the billing modal during setup).
- iOS: App Store IAP via RevenueCat. Web: Stripe via RevenueCat Web Billing.
- Product IDs and entitlements: see [WEB_BILLING.md](./WEB_BILLING.md).

## Schema

See `supabase/migrations/092_clinic_organizations.sql` (and follow-ups `093`–`100`) for organizations, locations, memberships (including bio/photo), invitations, preview/resend RPCs, and post attribution columns.
