import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import type { SupportedStorage } from '@supabase/supabase-js';

/** Browser localStorage adapter for Supabase auth on web. */
const webAuthStorage: SupportedStorage = {
  getItem(key: string) {
    if (typeof window === 'undefined') return null;
    return window.localStorage.getItem(key);
  },
  setItem(key: string, value: string) {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(key, value);
  },
  removeItem(key: string) {
    if (typeof window === 'undefined') return;
    window.localStorage.removeItem(key);
  },
};

export function getAuthStorage(): SupportedStorage {
  return Platform.OS === 'web' ? webAuthStorage : AsyncStorage;
}

export function isWebAuth(): boolean {
  return Platform.OS === 'web';
}
