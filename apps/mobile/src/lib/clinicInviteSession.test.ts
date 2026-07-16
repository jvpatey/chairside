import AsyncStorage from '@react-native-async-storage/async-storage';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@react-native-async-storage/async-storage', () => {
  const store = new Map<string, string>();
  return {
    default: {
      setItem: vi.fn(async (key: string, value: string) => {
        store.set(key, value);
      }),
      getItem: vi.fn(async (key: string) => store.get(key) ?? null),
      removeItem: vi.fn(async (key: string) => {
        store.delete(key);
      }),
      clear: vi.fn(async () => {
        store.clear();
      }),
      __store: store,
    },
  };
});

import {
  buildClinicInviteAcceptHref,
  buildClinicInviteAcceptPath,
  clearClinicInviteToken,
  consumeClinicInviteToken,
  readClinicInviteToken,
  saveClinicInviteToken,
} from './clinicInviteSession';

describe('clinicInviteSession', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    vi.clearAllMocks();
  });

  it('builds accept paths with encoded tokens', () => {
    expect(buildClinicInviteAcceptPath('abc/def')).toBe('/accept-invite?token=abc%2Fdef');
    expect(buildClinicInviteAcceptHref('tok123')).toBe('/accept-invite?token=tok123');
  });

  it('persists, reads, and clears invite tokens', async () => {
    await saveClinicInviteToken('  invite-token  ');
    await expect(readClinicInviteToken()).resolves.toBe('invite-token');

    await clearClinicInviteToken();
    await expect(readClinicInviteToken()).resolves.toBeNull();
  });

  it('ignores empty tokens', async () => {
    await saveClinicInviteToken('   ');
    await saveClinicInviteToken(null);
    await expect(readClinicInviteToken()).resolves.toBeNull();
  });

  it('consumes the token once', async () => {
    await saveClinicInviteToken('one-time');
    await expect(consumeClinicInviteToken()).resolves.toBe('one-time');
    await expect(consumeClinicInviteToken()).resolves.toBeNull();
  });
});
