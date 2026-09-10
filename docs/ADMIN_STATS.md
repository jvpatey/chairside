# Internal admin stats dashboard

Web-only internal dashboard for platform metrics. Not part of the App Store / native product surface.

## Access

- Sidebar: **Admin** (near Settings) — opens inside the app shell so the sidebar stays visible
- Deep link: `/admin` (redirects into clinic/worker tabs admin route)
- Allowlisted email (UI + server): `jeffreyvpatey@gmail.com`
- Directory tabs: Clinics and Professionals (name + email). Operator-only; keep `ADMIN_EMAILS` tight.

Native builds redirect away. Other accounts never see the sidebar item; the Edge Function returns 403.

## Deploy (web only)

1. Set the Supabase Edge Function secret (authoritative gate):

   ```bash
   supabase secrets set ADMIN_EMAILS=jeffreyvpatey@gmail.com
   ```

2. Deploy the function:

   ```bash
   supabase functions deploy admin-stats
   ```

3. Deploy web as usual (`pnpm export:web` / Vercel). No App Store / EAS submission is required to use this dashboard.

## Notes

- Client helper: `apps/mobile/src/lib/platformAdmin.ts` (visibility only). Keep it in sync with `ADMIN_EMAILS`.
- Data is loaded via `admin-stats` using the service role after JWT + email allowlist checks.
- Do not put the allowlist in `EXPO_PUBLIC_*` env vars.
