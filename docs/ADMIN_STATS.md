# Internal admin stats dashboard

Web-only internal dashboard for platform metrics. Not part of the App Store / native product surface.

## Access

- Desktop / tablet web sidebar: **Admin** (near Settings) — opens inside the app shell so the sidebar stays visible
- Mobile web: **Admin** row in Settings (profile hub) for the same allowlisted login — bottom dock stays unchanged
- Mobile layout: stacked cards for the directory (not a wide table), 2-up KPIs, and bottom inset clearing the floating tab dock
- Deep link: `/admin` (redirects into clinic/worker tabs admin route)
- Allowlisted email (UI + server): `jeffreyvpatey@gmail.com`
- Directory tabs: Clinics and Professionals (name + login email). Operator-only; keep `ADMIN_EMAILS` tight.

Native builds redirect away. Other accounts never see the entry points; the Edge Function returns 403.

## Deploy (web only)

1. Set the Supabase Edge Function secret (authoritative gate):

   ```bash
   supabase secrets set ADMIN_EMAILS=jeffreyvpatey@gmail.com
   ```

2. Deploy the functions:

   ```bash
   supabase functions deploy admin-stats --use-api
   supabase functions deploy admin-delete-account --use-api
   ```

3. Deploy web as usual (`pnpm export:web` / Vercel). No App Store / EAS submission is required to use this dashboard.

## Notes

- Client helper: `apps/mobile/src/lib/platformAdmin.ts` (visibility only). Keep it in sync with `ADMIN_EMAILS`.
- Data is loaded via `admin-stats` using the service role after JWT + email allowlist checks.
- Do not put the allowlist in `EXPO_PUBLIC_*` env vars.

## Deleting accounts

- Each directory row has a delete action (trash icon in the table, "Delete account" on mobile cards).
- The confirmation dialog requires typing the account's email (or `DELETE` if it has none) before the button enables.
- `admin-delete-account` re-checks the admin allowlist and the typed email server-side, refuses to delete the caller or any allowlisted admin, then runs the same teardown as in-app "Delete account" (`supabase/functions/_shared/accountDeletion.ts`: storage cleanup, `deactivate_*_account`, auth user delete).
- It does not cancel App Store / Google Play subscriptions; the dialog warns when a clinic is on a paid plan.
