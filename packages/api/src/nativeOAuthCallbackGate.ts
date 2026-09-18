/**
 * Native Google OAuth completes the session inside `signInWithGoogle` via
 * `openAuthSessionAsync`, then Expo Router may still open `/auth/callback` from
 * the same redirect URL. This gate lets the callback screen skip a duplicate
 * paint/process when the in-app flow already owns navigation.
 */

let handled = false;

export function markNativeOAuthCallbackHandled() {
  handled = true;
}

export function clearNativeOAuthCallbackHandled() {
  handled = false;
}

/** Returns true once, then clears the flag. */
export function consumeNativeOAuthCallbackHandled(): boolean {
  if (!handled) return false;
  handled = false;
  return true;
}

export function peekNativeOAuthCallbackHandled(): boolean {
  return handled;
}

export function resetNativeOAuthCallbackGateForTests() {
  handled = false;
}
