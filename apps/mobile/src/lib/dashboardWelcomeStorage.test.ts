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

import { getDashboardWelcomeCopy } from './dashboardWelcomeCopy';
import {
  getDashboardWelcomeStorageKey,
  hasDashboardWelcomeBeenShown,
  markDashboardWelcomeShown,
  parseWelcomeQueryParam,
  shouldShowDashboardWelcome,
} from './dashboardWelcomeStorage';

describe('dashboardWelcomeCopy', () => {
  it('returns role-specific welcome copy', () => {
    const workerCopy = getDashboardWelcomeCopy('worker');
    const clinicCopy = getDashboardWelcomeCopy('clinic');

    expect(workerCopy.title).toBe('Welcome to Chairside');
    expect(workerCopy.subtitle).toContain('before you apply');
    expect(workerCopy.bullets[0]).toContain('application profile');
    expect(workerCopy.bullets).toHaveLength(3);
    expect(workerCopy.ctaLabel).toBe('Explore dashboard');

    expect(clinicCopy.subtitle).toContain('clinic profile is live');
    expect(clinicCopy.bullets).toHaveLength(3);
    expect(clinicCopy.ctaLabel).toBe('Go to dashboard');
  });
});

describe('dashboardWelcomeStorage', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    vi.clearAllMocks();
  });

  it('builds per-user per-role storage keys', () => {
    expect(getDashboardWelcomeStorageKey('worker', 'user-1')).toBe(
      'dashboard_welcome_shown_v1_worker_user-1',
    );
    expect(getDashboardWelcomeStorageKey('clinic', 'user-2')).toBe(
      'dashboard_welcome_shown_v1_clinic_user-2',
    );
  });

  it('persists and reads shown state', async () => {
    await expect(hasDashboardWelcomeBeenShown('worker', 'user-1')).resolves.toBe(false);

    await markDashboardWelcomeShown('worker', 'user-1');
    await expect(hasDashboardWelcomeBeenShown('worker', 'user-1')).resolves.toBe(true);
    await expect(hasDashboardWelcomeBeenShown('clinic', 'user-1')).resolves.toBe(false);
  });

  it('parses welcome query param', () => {
    expect(parseWelcomeQueryParam('1')).toBe(true);
    expect(parseWelcomeQueryParam(['1'])).toBe(true);
    expect(parseWelcomeQueryParam(undefined)).toBe(false);
    expect(parseWelcomeQueryParam('0')).toBe(false);
  });

  it('shows welcome only when param is present and not dismissed', () => {
    expect(
      shouldShowDashboardWelcome({
        welcomeParam: '1',
        hasShown: false,
        isHydrated: true,
        userId: 'user-1',
      }),
    ).toBe(true);

    expect(
      shouldShowDashboardWelcome({
        welcomeParam: '1',
        hasShown: true,
        isHydrated: true,
        userId: 'user-1',
      }),
    ).toBe(false);

    expect(
      shouldShowDashboardWelcome({
        welcomeParam: undefined,
        hasShown: false,
        isHydrated: true,
        userId: 'user-1',
      }),
    ).toBe(false);

    expect(
      shouldShowDashboardWelcome({
        welcomeParam: '1',
        hasShown: false,
        isHydrated: false,
        userId: 'user-1',
      }),
    ).toBe(false);

    expect(
      shouldShowDashboardWelcome({
        welcomeParam: '1',
        hasShown: false,
        isHydrated: true,
        userId: null,
      }),
    ).toBe(false);
  });
});
