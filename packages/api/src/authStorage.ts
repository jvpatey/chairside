import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import type { SupportedStorage } from '@supabase/supabase-js';

/** Browser localStorage adapter for Supabase auth on web. */
const webAuthStorage: SupportedStorage = {
  getItem(key: string) {
    if (typeof window === 'undefined') return null;
    try {
      return window.localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  setItem(key: string, value: string) {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(key, value);
    } catch {
      // Storage blocked (privacy mode, security policy, quota, etc.)
    }
  },
  removeItem(key: string) {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.removeItem(key);
    } catch {
      // Storage blocked (privacy mode, security policy, quota, etc.)
    }
  },
};

export function getAuthStorage(): SupportedStorage {
  return Platform.OS === 'web' ? webAuthStorage : AsyncStorage;
}

export function isWebAuth(): boolean {
  return Platform.OS === 'web';
}
