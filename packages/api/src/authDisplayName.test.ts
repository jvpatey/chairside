import { describe, expect, it } from 'vitest';

import {
  formatAppleFullName,
  getUserMetadataDisplayName,
  resolveAppleNameToPersist,
  resolveAuthDisplayName,
} from './authDisplayName';

describe('formatAppleFullName', () => {
  it('joins given, middle, and family names', () => {
    expect(
      formatAppleFullName({
        givenName: 'Jane',
        middleName: 'Q',
        familyName: 'Doe',
      }),
    ).toBe('Jane Q Doe');
  });

  it('skips missing parts', () => {
    expect(formatAppleFullName({ givenName: 'Jane', familyName: 'Doe' })).toBe('Jane Doe');
  });

  it('returns empty string when name is missing', () => {
    expect(formatAppleFullName(null)).toBe('');
    expect(formatAppleFullName(undefined)).toBe('');
    expect(formatAppleFullName({})).toBe('');
  });
});

describe('getUserMetadataDisplayName', () => {
  it('prefers full_name over name', () => {
    expect(
      getUserMetadataDisplayName({
        full_name: 'Jane Doe',
        name: 'Other',
      }),
    ).toBe('Jane Doe');
  });

  it('falls back to name', () => {
    expect(getUserMetadataDisplayName({ name: 'Jane Doe' })).toBe('Jane Doe');
  });

  it('returns empty when metadata has no usable name', () => {
    expect(getUserMetadataDisplayName(null)).toBe('');
    expect(getUserMetadataDisplayName({})).toBe('');
    expect(getUserMetadataDisplayName({ full_name: '  ' })).toBe('');
  });
});

describe('resolveAuthDisplayName', () => {
  it('prefers profile display_name', () => {
    expect(
      resolveAuthDisplayName('Profile Name', {
        full_name: 'Meta Name',
      }),
    ).toBe('Profile Name');
  });

  it('falls back to user metadata when profile name is empty', () => {
    expect(resolveAuthDisplayName(null, { full_name: 'Meta Name' })).toBe('Meta Name');
    expect(resolveAuthDisplayName('  ', { name: 'Meta Name' })).toBe('Meta Name');
  });

  it('returns empty string when neither source has a name', () => {
    expect(resolveAuthDisplayName(null, null)).toBe('');
  });
});

describe('resolveAppleNameToPersist', () => {
  it('uses Apple credential name when present', () => {
    expect(
      resolveAppleNameToPersist(
        { givenName: 'Jane', familyName: 'Doe' },
        { full_name: 'Old Name' },
      ),
    ).toBe('Jane Doe');
  });

  it('falls back to metadata when Apple omits name on subsequent sign-in', () => {
    expect(
      resolveAppleNameToPersist(null, {
        full_name: 'Jane Doe',
      }),
    ).toBe('Jane Doe');
  });

  it('returns empty when neither Apple nor metadata has a name', () => {
    expect(resolveAppleNameToPersist(null, {})).toBe('');
  });
});
