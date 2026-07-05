export function isPasswordRecoveryRedirect(params: Record<string, string>): boolean {
  const type = params.type?.toLowerCase();
  if (type === 'recovery') return true;

  const event = params.event?.toLowerCase();
  if (event === 'password_recovery') return true;

  return false;
}

export function parseAuthRedirectUrl(input: string): {
  errorCode: string | null;
  params: Record<string, string>;
} {
  const url = new URL(input, 'https://phony.example');

  const errorCode = url.searchParams.get('errorCode');
  url.searchParams.delete('errorCode');

  const params = Object.fromEntries(url.searchParams);

  if (url.hash) {
    new URLSearchParams(url.hash.replace(/^#/, '')).forEach((value, key) => {
      params[key] = value;
    });
  }

  return {
    errorCode,
    params,
  };
}

export function isPasswordRecoveryUrl(input: string): boolean {
  const { params } = parseAuthRedirectUrl(input);
  return isPasswordRecoveryRedirect(params);
}

export function hasAuthCallbackParams(input: string): boolean {
  const { params, errorCode } = parseAuthRedirectUrl(input);

  if (errorCode) return true;
  if (params.error || params.error_description) return true;
  if (params.code || params.access_token || params.refresh_token) return true;
  if (params.token_hash) return true;
  if (params.type) return true;

  return false;
}

export function isAuthCallbackPath(pathname: string): boolean {
  return pathname === '/auth/callback' || pathname.endsWith('/auth/callback');
}

/** Web-only: canonical callback path preserving Supabase query + hash params. */
export function getWebAuthCallbackHref(input?: string): string | null {
  const href = input ?? (typeof window !== 'undefined' ? window.location.href : '');

  if (!href || !hasAuthCallbackParams(href)) return null;

  const url = new URL(href, 'https://phony.example');
  return `/auth/callback${url.search}${url.hash}`;
}
