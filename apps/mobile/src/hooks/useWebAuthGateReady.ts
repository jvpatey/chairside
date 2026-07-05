import { hasAuthCallbackParams } from '@chairside/api';
import { Platform } from 'react-native';
import { useSyncExternalStore } from 'react';

import {
  getWebAuthGateStatus,
  hasWebAuthLinkBeenHandled,
  subscribeWebAuthGate,
} from '@/lib/webAuthCallbackGate';

function getWebAuthGateSnapshot(): boolean {
  if (Platform.OS !== 'web') return true;
  if (typeof window === 'undefined') return false;
  if (hasWebAuthLinkBeenHandled()) return true;
  if (!hasAuthCallbackParams(window.location.href)) return true;
  return getWebAuthGateStatus() === 'idle';
}

export function useWebAuthGateReady(): boolean {
  return useSyncExternalStore(subscribeWebAuthGate, getWebAuthGateSnapshot, () => false);
}
