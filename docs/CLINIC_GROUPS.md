# Clinic groups

Clinic accounts can be **individual** (one location) or **group** (multiple locations with invited managers).

## Feature flag

Enabled by default. Disable with:

```bash
EXPO_PUBLIC_CLINIC_GROUPS_ENABLED=0
```

When disabled, clinics use the existing single-location setup path.

## Setup flow

**Individual:** account type → basics → location → practice → about → review

**Group:** account type → group basics → **locations** → team → about → review

### Per location (Locations step)

Each site collects: name, optional **clinic photo**, address, phone, specialty, software, operatories, and team size. Locations are editable (add / edit / remove) during setup and later from **Profile → Locations**. The first / default location is mirrored onto `clinic_profiles` (including its photo) so marketplace completeness and browse stay compatible — this is internal, not a user-facing “primary” badge.

### Org-level (About step)

Shared across the group: practice doctors, description, and website. Specialty, software, and clinic photo are **not** collected again here for groups — those live on each location. Individual clinics still set their logo on About.

Practice doctors stay on the org profile (`practice_doctors` JSON) and can be assigned to **one or more locations** (`location_ids`) during About — useful when a doctor works at multiple sites. When the group has active locations, at least one location is required per doctor.

## Access model

- **Owner** — one primary login with full org access, billing, locations, and invitations.
- **Manager** — invited individual login with location assignments only.

### Manager invitations

Owners invite managers from setup **Team** or **Profile → Team & access**:

1. Owner picks email, optional name/title, and **at least one location** (locations start unselected).
2. Creating a pending invite INSERT triggers the `notify` edge function → Pingram email with link `https://chairside.app/accept-invite?token=…`.
3. Invitee signs in or signs up as a clinic user; the token is preserved through email/password, OAuth, email confirm, and app restarts.
4. Accept screen shows a safe preview (group, inviter, locations, invited email, expiry). Acceptance is explicit (no silent auto-join) and requires an exact email match. Wrong email → **Switch account**.
5. Owner actions on pending invites: **Resend** (fresh token + expiry + new email), **Copy invite link**, **Revoke**. If email delivery is delayed, copy-link remains available.

Manual code entry remains a secondary fallback on the accept screen.

Security rules (SQL RPC): exact invited-email match, 7-day expiry, one-time accept, revoke, and preview that never returns raw tokens. See `096_fix_manager_invitation_rpc.sql` and `097_clinic_manager_invitation_preview_resend.sql`.

## Universal / App Links

Installed apps should open invitation HTTPS links via:

- iOS Associated Domains: `applinks:chairside.app`
- Android verified intent filter for `https://chairside.app/accept-invite`

Host from web static assets (served without SPA rewrite):

- `/.well-known/apple-app-site-association` (Team ID `K456XRWT8C`, bundle `com.chairside.app`)
- `/.well-known/assetlinks.json` (`com.chairside.app`)

**Required before production:** replace `REPLACE_WITH_PLAY_APP_SIGNING_SHA256` in `apps/mobile/public/.well-known/assetlinks.json` with the Play App Signing certificate SHA-256. Keep `chairside://` as a development/fallback scheme.

## Billing

Subscriptions and posting limits remain organization-scoped (owner / `clinic_id`). Managers can read billing state but cannot purchase or restore.

## Schema

See `supabase/migrations/092_clinic_organizations.sql` (and follow-ups `093`–`097`) for organizations, locations, memberships, invitations, preview/resend RPCs, and post attribution columns.
