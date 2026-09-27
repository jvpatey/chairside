import { describe, expect, it, vi } from 'vitest';

vi.mock('@chairside/api', () => ({
  ADMIN_DELETE_NO_EMAIL_CONFIRMATION: 'DELETE',
}));

import {
  getAdminDeleteConfirmationPhrase,
  isAdminDeleteConfirmationMatch,
} from './adminDeleteConfirmation';

describe('adminDeleteConfirmation', () => {
  it('uses the account email as the phrase', () => {
    expect(getAdminDeleteConfirmationPhrase(' clinic@example.com ')).toBe('clinic@example.com');
  });

  it('falls back to DELETE when there is no email', () => {
    expect(getAdminDeleteConfirmationPhrase(null)).toBe('DELETE');
    expect(getAdminDeleteConfirmationPhrase('  ')).toBe('DELETE');
  });

  it('matches the email case-insensitively and ignores surrounding spaces', () => {
    expect(isAdminDeleteConfirmationMatch(' Clinic@Example.com ', 'clinic@example.com')).toBe(true);
  });

  it('rejects empty, partial, or different emails', () => {
    expect(isAdminDeleteConfirmationMatch('', 'clinic@example.com')).toBe(false);
    expect(isAdminDeleteConfirmationMatch('clinic@example', 'clinic@example.com')).toBe(false);
    expect(isAdminDeleteConfirmationMatch('other@example.com', 'clinic@example.com')).toBe(false);
  });

  it('requires DELETE for accounts without an email', () => {
    expect(isAdminDeleteConfirmationMatch('delete', null)).toBe(true);
    expect(isAdminDeleteConfirmationMatch('yes', null)).toBe(false);
  });
});
