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
    },
  };
});

import {
  defaultClinicListingViewMode,
  loadStoredClinicListingViewMode,
  parseClinicListingViewMode,
  saveStoredClinicListingViewMode,
} from './clinicListingViewStorage';

describe('clinicListingViewStorage', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    vi.clearAllMocks();
  });

  it('parses known view modes', () => {
    expect(parseClinicListingViewMode('cards')).toBe('cards');
    expect(parseClinicListingViewMode('list')).toBe('list');
    expect(parseClinicListingViewMode('map')).toBeNull();
    expect(parseClinicListingViewMode(null)).toBeNull();
  });

  it('defaults to list on wide web and cards otherwise', () => {
    expect(defaultClinicListingViewMode(true)).toBe('list');
    expect(defaultClinicListingViewMode(false)).toBe('cards');
  });

  it('persists view mode per user, org, and surface', async () => {
    await saveStoredClinicListingViewMode('user-1', 'org-1', 'roles', 'list');
    await saveStoredClinicListingViewMode('user-1', 'org-2', 'roles', 'cards');

    await expect(loadStoredClinicListingViewMode('user-1', 'org-1', 'roles')).resolves.toBe('list');
    await expect(loadStoredClinicListingViewMode('user-1', 'org-2', 'roles')).resolves.toBe('cards');
    await expect(loadStoredClinicListingViewMode('user-1', 'org-1', 'role-history')).resolves.toBe(
      null,
    );
  });

  it('ignores invalid stored values', async () => {
    await AsyncStorage.setItem('clinic_listing_view:user-1:org-1:roles', 'grid');
    await expect(loadStoredClinicListingViewMode('user-1', 'org-1', 'roles')).resolves.toBeNull();
  });
});
