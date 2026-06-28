import { describe, expect, it } from 'vitest';

import {
  isNotificationTabRootRoute,
  normalizeNotificationRoute,
  WORKER_FILLINS,
} from './routing';

describe('normalizeNotificationRoute', () => {
  it('maps worker shift detail links to the fill-ins tab', () => {
    expect(normalizeNotificationRoute('/(tabs)/shift/shift-123')).toBe(WORKER_FILLINS);
  });

  it('preserves other routes', () => {
    expect(normalizeNotificationRoute('/(tabs)/application/app-1')).toBe(
      '/(tabs)/application/app-1',
    );
  });
});

describe('isNotificationTabRootRoute', () => {
  it('recognizes fill-ins tab routes', () => {
    expect(isNotificationTabRootRoute('/(tabs)/fillins')).toBe(true);
    expect(isNotificationTabRootRoute('/(clinic-tabs)/fill-ins')).toBe(true);
  });

  it('treats detail routes as non-tab roots', () => {
    expect(isNotificationTabRootRoute('/(tabs)/shift/shift-1')).toBe(false);
    expect(isNotificationTabRootRoute('/(clinic-tabs)/shift-applicants/shift-1')).toBe(false);
  });
});
