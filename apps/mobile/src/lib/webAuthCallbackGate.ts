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
  authLinkHandled = true;
}

export function resetWebAuthGateForTests() {
  status = 'idle';
  authLinkHandled = false;
  listeners.clear();
}
