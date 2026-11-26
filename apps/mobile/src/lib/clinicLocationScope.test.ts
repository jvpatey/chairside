import { describe, expect, it } from 'vitest';

import { resolveActiveLocationId } from './clinicLocationScope';

const locations = [{ id: 'a' }, { id: 'b' }];

describe('resolveActiveLocationId', () => {
  it('defaults to the first accessible location', () => {
    expect(resolveActiveLocationId(null, locations)).toBe('a');
  });

  it('keeps a stored selection that is still accessible', () => {
    expect(resolveActiveLocationId('b', locations)).toBe('b');
  });

  it('ignores the legacy "all" value and unknown ids', () => {
    expect(resolveActiveLocationId('all', locations)).toBe('a');
    expect(resolveActiveLocationId('gone', locations)).toBe('a');
  });

  it('returns null when there are no accessible locations', () => {
    expect(resolveActiveLocationId('a', [])).toBeNull();
  });
});
