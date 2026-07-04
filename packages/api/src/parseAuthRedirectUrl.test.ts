import { describe, expect, it } from 'vitest';

import {
  getWebAuthCallbackHref,
  hasAuthCallbackParams,
  isPasswordRecoveryRedirect,
  isPasswordRecoveryUrl,
  parseAuthRedirectUrl,
} from './parseAuthRedirectUrl';

describe('isPasswordRecoveryRedirect', () => {
  it('returns true when type=recovery in query params', () => {
    expect(isPasswordRecoveryRedirect({ type: 'recovery' })).toBe(true);
  });

  it('returns true when type=recovery is in hash params', () => {
    const url = 'chairside://auth/callback#access_token=abc&type=recovery';
    expect(isPasswordRecoveryUrl(url)).toBe(true);
  });

  it('returns true for PKCE callback URLs with type=recovery', () => {
    const url = 'https://chairside.app/auth/callback?code=abc123&type=recovery';
    expect(isPasswordRecoveryUrl(url)).toBe(true);
  });

  it('returns true when event=password_recovery is present', () => {
    expect(isPasswordRecoveryRedirect({ event: 'password_recovery' })).toBe(true);
  });

  it('returns false for normal sign-in callbacks', () => {
    const url = 'chairside://auth/callback?code=abc123';
    expect(isPasswordRecoveryUrl(url)).toBe(false);
  });

  it('returns false for OAuth callbacks without recovery markers', () => {
    const url =
      'chairside://auth/callback#access_token=abc&refresh_token=def&token_type=bearer';
    expect(isPasswordRecoveryUrl(url)).toBe(false);
  });
});

describe('parseAuthRedirectUrl', () => {
  it('merges query and hash params', () => {
    const url = 'https://example.com/auth/callback?type=signup#access_token=token';
    const { params } = parseAuthRedirectUrl(url);

    expect(params.type).toBe('signup');
    expect(params.access_token).toBe('token');
  });

  it('extracts errorCode from query params', () => {
    const url = 'https://example.com/auth/callback?errorCode=access_denied';
    const { errorCode, params } = parseAuthRedirectUrl(url);

    expect(errorCode).toBe('access_denied');
    expect(params.errorCode).toBeUndefined();
  });
});

describe('hasAuthCallbackParams', () => {
  it('returns true for recovery tokens on the site root', () => {
    const url = 'https://chairside.app/#access_token=abc&type=recovery';
    expect(hasAuthCallbackParams(url)).toBe(true);
  });

  it('returns true for PKCE codes on the site root', () => {
    const url = 'https://chairside.app/?code=abc123&type=recovery';
    expect(hasAuthCallbackParams(url)).toBe(true);
  });

  it('returns false for normal pages', () => {
    expect(hasAuthCallbackParams('https://chairside.app/welcome')).toBe(false);
  });
});

describe('getWebAuthCallbackHref', () => {
  it('preserves query and hash on the callback path', () => {
    const url = 'https://chairside.app/?code=abc123&type=recovery';
    expect(getWebAuthCallbackHref(url)).toBe('/auth/callback?code=abc123&type=recovery');
  });

  it('preserves hash tokens on the callback path', () => {
    const url = 'https://chairside.app/#access_token=abc&type=recovery';
    expect(getWebAuthCallbackHref(url)).toBe('/auth/callback#access_token=abc&type=recovery');
  });
});
