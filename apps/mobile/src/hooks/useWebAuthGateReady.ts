import { Platform } from 'react-native';
import { useSyncExternalStore } from 'react';

import { isWebAuthGateReady, subscribeWebAuthGate } from '@/lib/webAuthCallbackGate';

function getWebAuthGateSnapshot(): boolean {
  if (Platform.OS !== 'web') return true;
  if (typeof window === 'undefined') return false;
  return isWebAuthGateReady(window.location.href);
}

export function useWebAuthGateReady(): boolean {
  return useSyncExternalStore(subscribeWebAuthGate, getWebAuthGateSnapshot, () => false);
}
