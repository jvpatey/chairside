import { describe, expect, it } from 'vitest';

import {
  applePartsToPersonName,
  formatAppleFullName,
  getUserMetadataDisplayName,
  getUserMetadataNameParts,
  joinDisplayName,
  resolveAppleNamePartsToPersist,
  resolveAppleNameToPersist,
  resolveAuthDisplayName,
  resolveAuthNameParts,
  splitDisplayName,
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

describe('splitDisplayName / joinDisplayName', () => {
  it('splits on the first space', () => {
    expect(splitDisplayName('Jane Doe')).toEqual({ firstName: 'Jane', lastName: 'Doe' });
    expect(splitDisplayName('Jane Q Doe')).toEqual({ firstName: 'Jane', lastName: 'Q Doe' });
  });

  it('handles single-token and empty names', () => {
    expect(splitDisplayName('Jane')).toEqual({ firstName: 'Jane', lastName: '' });
    expect(splitDisplayName('')).toEqual({ firstName: '', lastName: '' });
    expect(splitDisplayName(null)).toEqual({ firstName: '', lastName: '' });
  });

  it('joins first and last', () => {
    expect(joinDisplayName('Jane', 'Doe')).toBe('Jane Doe');
    expect(joinDisplayName('Jane', '')).toBe('Jane');
    expect(joinDisplayName('', 'Doe')).toBe('Doe');
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

describe('getUserMetadataNameParts', () => {
  it('uses given_name and family_name when present', () => {
    expect(
      getUserMetadataNameParts({
        given_name: 'Jane',
        family_name: 'Doe',
        full_name: 'Other',
      }),
    ).toEqual({ firstName: 'Jane', lastName: 'Doe' });
  });

  it('falls back to splitting full_name', () => {
    expect(getUserMetadataNameParts({ full_name: 'Jane Doe' })).toEqual({
      firstName: 'Jane',
      lastName: 'Doe',
    });
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

describe('resolveAuthNameParts', () => {
  it('prefers profile first/last', () => {
    expect(
      resolveAuthNameParts({
        firstName: 'Jane',
        lastName: 'Doe',
        displayName: 'Other',
        userMetadata: { given_name: 'Meta', family_name: 'Data' },
      }),
    ).toEqual({ firstName: 'Jane', lastName: 'Doe' });
  });

  it('splits profile display_name when first/last are empty', () => {
    expect(
      resolveAuthNameParts({
        displayName: 'Jane Doe',
        userMetadata: { given_name: 'Meta', family_name: 'Data' },
      }),
    ).toEqual({ firstName: 'Jane', lastName: 'Doe' });
  });

  it('falls back to Apple metadata given/family', () => {
    expect(
      resolveAuthNameParts({
        userMetadata: { given_name: 'Jane', family_name: 'Doe' },
      }),
    ).toEqual({ firstName: 'Jane', lastName: 'Doe' });
  });
});

describe('applePartsToPersonName', () => {
  it('maps Apple credential parts to first/last', () => {
    expect(
      applePartsToPersonName({
        givenName: 'Jane',
        middleName: 'Q',
        familyName: 'Doe',
      }),
    ).toEqual({ firstName: 'Jane Q', lastName: 'Doe' });
  });
});

describe('resolveAppleNamePartsToPersist', () => {
  it('uses Apple credential name when present', () => {
    expect(
      resolveAppleNamePartsToPersist({
        appleFullName: { givenName: 'Jane', familyName: 'Doe' },
        cachedName: { firstName: 'Cached', lastName: 'Name' },
        userMetadata: { full_name: 'Old Name' },
      }),
    ).toEqual({ firstName: 'Jane', lastName: 'Doe' });
  });

  it('falls back to SecureStore cache when Apple omits name', () => {
    expect(
      resolveAppleNamePartsToPersist({
        appleFullName: null,
        cachedName: { firstName: 'Jane', lastName: 'Doe' },
        userMetadata: {},
      }),
    ).toEqual({ firstName: 'Jane', lastName: 'Doe' });
  });

  it('falls back to metadata when credential and cache miss', () => {
    expect(
      resolveAppleNamePartsToPersist({
        appleFullName: null,
        cachedName: null,
        userMetadata: { given_name: 'Jane', family_name: 'Doe' },
      }),
    ).toEqual({ firstName: 'Jane', lastName: 'Doe' });
  });

  it('returns empty parts when all sources miss', () => {
    expect(
      resolveAppleNamePartsToPersist({
        appleFullName: null,
        cachedName: null,
        userMetadata: {},
      }),
    ).toEqual({ firstName: '', lastName: '' });
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

  it('uses cache before metadata', () => {
    expect(
      resolveAppleNameToPersist(null, { full_name: 'Meta Name' }, { firstName: 'Jane', lastName: 'Doe' }),
    ).toBe('Jane Doe');
  });

  it('returns empty when neither Apple nor metadata has a name', () => {
    expect(resolveAppleNameToPersist(null, {})).toBe('');
  });
});
