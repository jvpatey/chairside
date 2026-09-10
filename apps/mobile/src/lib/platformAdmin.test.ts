import { describe, expect, it } from 'vitest';

import { isPlatformAdminEmail } from './platformAdmin';

describe('isPlatformAdminEmail', () => {
  it('matches the allowlisted email case-insensitively', () => {
    expect(isPlatformAdminEmail('jeffreyvpatey@gmail.com')).toBe(true);
    expect(isPlatformAdminEmail('JeffreyVPatey@gmail.com')).toBe(true);
    expect(isPlatformAdminEmail('  jeffreyvpatey@gmail.com  ')).toBe(true);
  });

  it('rejects other emails', () => {
    expect(isPlatformAdminEmail('other@example.com')).toBe(false);
    expect(isPlatformAdminEmail(null)).toBe(false);
    expect(isPlatformAdminEmail(undefined)).toBe(false);
    expect(isPlatformAdminEmail('')).toBe(false);
  });
});
