import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  buildClinicManagerInviteUrl,
  parseClinicInviteTokenFromUrl,
} from './clinicInviteLinks';

describe('clinicInviteLinks', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('builds HTTPS invite URLs with encoded tokens', () => {
    vi.stubEnv('EXPO_PUBLIC_WEB_BASE_URL', 'https://chairside.app');
    expect(buildClinicManagerInviteUrl('abc+def')).toBe(
      'https://chairside.app/accept-invite?token=abc%2Bdef',
    );
  });

  it('parses tokens from web, custom scheme, and relative URLs', () => {
    expect(
      parseClinicInviteTokenFromUrl('https://chairside.app/accept-invite?token=abc123'),
    ).toBe('abc123');
    expect(
      parseClinicInviteTokenFromUrl('chairside://accept-invite?token=from-app'),
    ).toBe('from-app');
    expect(parseClinicInviteTokenFromUrl('/accept-invite?token=rel')).toBe('rel');
  });

  it('returns null for unrelated or token-less URLs', () => {
    expect(parseClinicInviteTokenFromUrl('https://chairside.app/privacy')).toBeNull();
    expect(parseClinicInviteTokenFromUrl('https://chairside.app/accept-invite')).toBeNull();
    expect(parseClinicInviteTokenFromUrl('')).toBeNull();
  });
});
