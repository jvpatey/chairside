# Web deployment

## Build

From the repo root:

```bash
pnpm export:web
```

Output is written to `apps/mobile/dist`.

Public legal pages (`/privacy`, `/support`, `/terms`) are included in the export and should be deployed before App Store submission. Set `EXPO_PUBLIC_WEB_BASE_URL` in hosting env vars to your production origin.

For web clinic subscriptions, also set `EXPO_PUBLIC_REVENUECAT_WEB_API_KEY` at build time. See [WEB_BILLING.md](./WEB_BILLING.md).

## Supabase redirect URLs

Add these under **Authentication → URL Configuration → Redirect URLs**:

- `http://localhost:8081/auth/callback` (local dev)
- `https://<your-production-domain>/auth/callback`

Set **Site URL** to your production web origin when deploying.

## Hosting

### Vercel

- Root directory: `apps/mobile`
- Build command: `pnpm export:web`
- Output directory: `dist`
- [`vercel.json`](apps/mobile/vercel.json) includes SPA fallback rewrites.

### Netlify

- Build command: `pnpm export:web`
- Publish directory: `apps/mobile/dist`
- [`public/_redirects`](apps/mobile/public/_redirects) includes SPA fallback.

### Cloudflare Pages

- Build command: `pnpm export:web`
- Output directory: `apps/mobile/dist`
- Add a `_redirects` or `_routes.json` SPA rule if needed.

## Deep links

Dynamic routes (`/conversation/[id]`, `/job/[id]`, etc.) require SPA fallback so refresh and direct links load the app shell.
