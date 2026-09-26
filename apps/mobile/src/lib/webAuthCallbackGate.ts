import { hasAuthCallbackParams } from '@chairside/api';

type WebAuthGateStatus = 'idle' | 'checking' | 'processing';

let status: WebAuthGateStatus = 'idle';
let authLinkHandled = false;
const listeners = new Set<() => void>();

function notifyListeners() {
  for (const listener of listeners) {
    listener();
  }
}

export function getWebAuthGateStatus(): WebAuthGateStatus {
  return status;
}

export function setWebAuthGateStatus(next: WebAuthGateStatus) {
  if (status === next) return;
  status = next;
  notifyListeners();
}

export function subscribeWebAuthGate(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function hasWebAuthLinkBeenHandled() {
  return authLinkHandled;
}

export function markWebAuthLinkHandled() {
  if (authLinkHandled) return;
  authLinkHandled = true;
  notifyListeners();
}

/**
 * Whether index (and similar) may safely route from the current session.
 * Pure — safe to call from useSyncExternalStore getSnapshot.
 */
export function isWebAuthGateReady(href: string): boolean {
  // Prefer status over URL params: params are stripped mid-handler, before
  // handleAuthSuccess finishes navigating.
  if (status === 'processing' || status === 'checking') return false;
  if (!hasAuthCallbackParams(href)) return true;
  return authLinkHandled;
}

export function resetWebAuthGateForTests() {
  status = 'idle';
  authLinkHandled = false;
  listeners.clear();
}
