import AsyncStorage from '@react-native-async-storage/async-storage';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const getProfile = vi.fn();
const getWorkerProfile = vi.fn();

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

vi.mock('@chairside/api', () => ({
  getProfile: (...args: unknown[]) => getProfile(...args),
  getWorkerProfile: (...args: unknown[]) => getWorkerProfile(...args),
  getWorkerRoleTypes: (profile: { role_types?: string[] | null; role_type?: string | null } | null) => {
    if (!profile) return [];
    if (Array.isArray(profile.role_types) && profile.role_types.length > 0) {
      return profile.role_types;
    }
    return profile.role_type ? [profile.role_type] : [];
  },
}));

import {
  clearWorkerPostAuthCaptureSkip,
  getNextWorkerPostAuthCaptureStep,
  getWorkerPostAuthCaptureHref,
  markWorkerPostAuthCaptureSkipped,
  workerNeedsLocationFromProfile,
  workerNeedsNameFromProfile,
  workerNeedsPhoneFromProfile,
} from './workerPostAuthCapture';

describe('workerPostAuthCapture helpers', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    await AsyncStorage.clear();
  });

  it('detects missing name / phone / city or roles', () => {
    expect(workerNeedsNameFromProfile({ role: 'worker' } as never)).toBe(true);
    expect(
      workerNeedsNameFromProfile({ role: 'worker', first_name: 'Ada' } as never),
    ).toBe(false);
    expect(workerNeedsPhoneFromProfile({ phone: null } as never)).toBe(true);
    expect(workerNeedsPhoneFromProfile({ phone: '9025550100' } as never)).toBe(false);
    expect(workerNeedsLocationFromProfile({ city: null, role_types: [] } as never)).toBe(true);
    expect(
      workerNeedsLocationFromProfile({ city: 'Halifax', role_types: [] } as never),
    ).toBe(true);
    expect(
      workerNeedsLocationFromProfile({
        city: 'Halifax',
        role_types: ['hygienist'],
      } as never),
    ).toBe(false);
  });

  it('routes name → phone → location and honors skip', async () => {
    getProfile.mockResolvedValue({ role: 'worker', first_name: 'Ada' });
    getWorkerProfile.mockResolvedValue({ phone: null, city: null, role_types: [] });

    expect(await getNextWorkerPostAuthCaptureStep('u1')).toBe('phone');
    expect(getWorkerPostAuthCaptureHref('phone')).toBe('/(onboarding)/capture-phone');

    await markWorkerPostAuthCaptureSkipped('u1', 'phone');
    expect(await getNextWorkerPostAuthCaptureStep('u1')).toBe('location');

    await markWorkerPostAuthCaptureSkipped('u1', 'location');
    expect(await getNextWorkerPostAuthCaptureStep('u1')).toBe(null);

    await clearWorkerPostAuthCaptureSkip('u1', 'phone');
    expect(await getNextWorkerPostAuthCaptureStep('u1')).toBe('phone');
  });

  it('asks for name first when missing', async () => {
    getProfile.mockResolvedValue({ role: 'worker' });
    getWorkerProfile.mockResolvedValue({
      phone: '9025550100',
      city: 'Halifax',
      role_types: ['assistant'],
    });
    expect(await getNextWorkerPostAuthCaptureStep('u1')).toBe('name');
  });

  it('asks for role+area when phone exists but roles are missing', async () => {
    getProfile.mockResolvedValue({ role: 'worker', first_name: 'Ada' });
    getWorkerProfile.mockResolvedValue({
      phone: '9025550100',
      city: 'Halifax',
      role_types: [],
    });
    expect(await getNextWorkerPostAuthCaptureStep('u1')).toBe('location');
  });

  it('skips the chain for non-workers', async () => {
    getProfile.mockResolvedValue({ role: 'clinic' });
    expect(await getNextWorkerPostAuthCaptureStep('u1')).toBe(null);
    expect(getWorkerProfile).not.toHaveBeenCalled();
  });
});
