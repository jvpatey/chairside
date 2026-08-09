import type { Session, User } from '@supabase/supabase-js';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { Platform } from 'react-native';

import { getAppleCachedName, setAppleCachedName } from './appleNameCache';
import {
  applePartsToPersonName,
  joinDisplayName,
  resolveAppleNamePartsToPersist,
} from './authDisplayName';
import { getAuthStorage } from './authStorage';
import { getSupabaseClient, getSupabaseConfig } from './client';
import { getErrorMessage } from './errors';
import { parseAuthRedirectUrl, isPasswordRecoveryRedirect } from './parseAuthRedirectUrl';
import { ensureProfileName } from './profile';
import type { UserRole } from './types';

export const PASSWORD_MIN_LENGTH = 8;

WebBrowser.maybeCompleteAuthSession();

function getOAuthRedirectUrl() {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    return `${window.location.origin}/auth/callback`;
  }

  return Linking.createURL('auth/callback');
}

export async function createSessionFromUrl(url: string) {
  const supabase = getSupabaseClient();
  const { params, errorCode } = parseAuthRedirectUrl(url);
  const isPasswordRecovery = isPasswordRecoveryRedirect(params);

  if (errorCode) {
    throw new Error(errorCode);
  }

  if (params.code) {
    const { data, error } = await supabase.auth.exchangeCodeForSession(params.code);
    if (error) throw error;
    return { session: data.session, isPasswordRecovery };
  }

  const { access_token, refresh_token } = params;

  if (!access_token) {
    return { session: null, isPasswordRecovery };
  }

  const { data, error } = await supabase.auth.setSession({
    access_token,
    refresh_token,
  });

  if (error) throw error;
  return { session: data.session, isPasswordRecovery };
}

export async function signInWithEmail(email: string, password: string) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim(),
    password,
  });

  if (error) throw error;
  return data;
}

export async function signUpWithEmail(email: string, password: string, role: UserRole) {
  const supabase = getSupabaseClient();
  const emailRedirectTo = getOAuthRedirectUrl();
  const { data, error } = await supabase.auth.signUp({
    email: email.trim(),
    password,
    options: {
      data: { role },
      emailRedirectTo,
    },
  });

  if (error) throw error;
  return data;
}

/**
 * signUp sometimes omits session even when the account is immediately usable
 * (e.g. confirm-email disabled). Fall back to storage, then password sign-in.
 * Returns null when the account exists but email confirmation is still required.
 */
export async function establishSessionAfterSignUp(
  email: string,
  password: string,
  signUpData: { session: Session | null; user: User | null },
): Promise<Session | null> {
  if (signUpData.session) {
    return signUpData.session;
  }

  const supabase = getSupabaseClient();
  const {
    data: { session: storedSession },
  } = await supabase.auth.getSession();
  if (storedSession) {
    return storedSession;
  }

  if (!signUpData.user) {
    return null;
  }

  try {
    const { session } = await signInWithEmail(email, password);
    return session;
  } catch (error) {
    const message = getErrorMessage(error, '').toLowerCase();
    if (message.includes('email not confirmed')) {
      return null;
    }
    throw error;
  }
}

/** Mirrors the supabase-js default: sb-<project-ref>-auth-token. */
function getAuthStorageKey(): string {
  const { url } = getSupabaseConfig();
  return `sb-${new URL(url).hostname.split('.')[0]}-auth-token`;
}

/**
 * supabase-js keeps the persisted session when it cannot reach /logout or when
 * the token can no longer be refreshed — which is exactly the state right after
 * the account is deleted. Left behind, that session is restored on the next
 * load and the app looks signed in against a dead account.
 */
async function discardPersistedSession() {
  const storage = getAuthStorage();
  const storageKey = getAuthStorageKey();

  try {
    await storage.removeItem(storageKey);
    await storage.removeItem(`${storageKey}-code-verifier`);
  } catch {
    // Storage unavailable (privacy mode, quota) — nothing else we can do.
  }
}

export async function signOut() {
  const supabase = getSupabaseClient();
  // Clear local session immediately; avoids races with in-flight token refresh.
  const { error } = await supabase.auth.signOut({ scope: 'local' });

  // Signing out locally must always succeed from the caller's perspective, so a
  // failed revoke falls back to dropping the stored session by hand.
  if (error) {
    await discardPersistedSession();
  }
}

/** functions.invoke only reports a generic message — read the response body. */
async function resolveFunctionErrorMessage(
  error: unknown,
  fallback: string,
): Promise<string> {
  const context = (error as { context?: { json?: () => Promise<unknown> } })?.context;

  if (context && typeof context.json === 'function') {
    try {
      const body = await context.json();
      if (body && typeof body === 'object' && 'error' in body) {
        const message = (body as { error: unknown }).error;
        if (message) return String(message);
      }
    } catch {
      // Body was empty or not JSON — fall back to the generic message.
    }
  }

  return getErrorMessage(error, fallback);
}

export async function deleteAccount() {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.functions.invoke('delete-account');

  if (error) {
    throw new Error(
      await resolveFunctionErrorMessage(
        error,
        'Could not delete your account. Please try again or contact support.',
      ),
    );
  }

  if (data && typeof data === 'object' && 'error' in data && data.error) {
    throw new Error(String(data.error));
  }

  return data;
}

export async function resetPasswordForEmail(email: string) {
  const supabase = getSupabaseClient();
  const redirectTo = getOAuthRedirectUrl();
  const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
    redirectTo,
  });

  if (error) throw error;
}

export async function updatePassword(newPassword: string) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.auth.updateUser({ password: newPassword });

  if (error) throw error;
  return data.user;
}

export async function signInWithGoogle() {
  const supabase = getSupabaseClient();
  const redirectTo = getOAuthRedirectUrl();

  if (Platform.OS === 'web') {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo,
      },
    });

    if (error) throw error;
    if (!data.url) {
      throw new Error('Google sign-in URL was not returned.');
    }

    window.location.assign(data.url);
    return null;
  }

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo,
      skipBrowserRedirect: true,
    },
  });

  if (error) throw error;
  if (!data.url) {
    throw new Error('Google sign-in URL was not returned.');
  }

  const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);

  if (result.type === 'cancel' || result.type === 'dismiss') {
    throw new Error('Sign in was cancelled.');
  }

  if (result.type !== 'success') {
    throw new Error('Google sign-in failed.');
  }

  const { session } = await createSessionFromUrl(result.url);
  if (!session) {
    throw new Error('No session returned from Google sign-in.');
  }

  return session;
}

function isAppleCancelError(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code?: unknown }).code === 'ERR_REQUEST_CANCELED'
  );
}

export async function signInWithApple() {
  if (Platform.OS === 'web') {
    const supabase = getSupabaseClient();
    const redirectTo = getOAuthRedirectUrl();
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'apple',
      options: {
        redirectTo,
      },
    });

    if (error) throw error;
    if (!data.url) {
      throw new Error('Apple sign-in URL was not returned.');
    }

    window.location.assign(data.url);
    return null;
  }

  if (Platform.OS !== 'ios') {
    throw new Error('Sign in with Apple is only available on iOS.');
  }

  let credential: AppleAuthentication.AppleAuthenticationCredential;

  try {
    credential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
    });
  } catch (error) {
    if (isAppleCancelError(error)) {
      throw new Error('Sign in was cancelled.');
    }

    throw new Error(
      getErrorMessage(error, 'Apple sign-in failed. Check Sign in with Apple is enabled for this build.'),
    );
  }

  if (!credential.identityToken) {
    throw new Error('No identity token returned from Apple.');
  }

  const supabase = getSupabaseClient();
  const { data, error } = await supabase.auth.signInWithIdToken({
    provider: 'apple',
    token: credential.identityToken,
  });

  if (error) {
    throw new Error(getErrorMessage(error, 'Apple sign-in failed when verifying with Supabase.'));
  }

  const appleUserId = credential.user;
  const fromCredential = applePartsToPersonName(credential.fullName);
  if (fromCredential.firstName || fromCredential.lastName) {
    // Apple only returns fullName on first authorization — cache for later sign-ins.
    await setAppleCachedName(appleUserId, fromCredential);
  }

  const cachedName = await getAppleCachedName(appleUserId);
  const nameParts = resolveAppleNamePartsToPersist({
    appleFullName: credential.fullName,
    cachedName,
    userMetadata: data.user?.user_metadata as Record<string, unknown> | undefined,
  });
  const appleName = joinDisplayName(nameParts.firstName, nameParts.lastName);

  if (appleName) {
    await supabase.auth.updateUser({
      data: {
        full_name: appleName,
        given_name: nameParts.firstName || undefined,
        family_name: nameParts.lastName || undefined,
      },
    });
  }

  const userId = data.user?.id;
  if (userId && appleName) {
    // Copy Apple identity into the app profile so setup does not re-ask for name.
    await ensureProfileName(userId, nameParts);
  }

  // Refresh so AuthContext sees updated metadata before setup screens mount.
  const { data: refreshed, error: refreshError } = await supabase.auth.refreshSession();
  if (!refreshError && refreshed) {
    return refreshed;
  }

  return data;
}

export function getAuthErrorMessage(error: unknown): string {
  const message = getErrorMessage(error, 'Something went wrong. Please try again.');

  if (message === 'Sign in was cancelled.') {
    return message;
  }

  const lower = message.toLowerCase();

  if (lower.includes('json parse error') || lower.includes('unexpected end of input')) {
    return 'Could not reach Supabase. Check that EXPO_PUBLIC_SUPABASE_URL uses https:// in apps/mobile/.env, then restart Expo.';
  }

  if (lower.includes('invalid login credentials')) {
    return 'Incorrect email or password.';
  }

  if (lower.includes('user already registered')) {
    return 'An account with this email already exists.';
  }

  if (lower.includes('email not confirmed')) {
    return 'Please confirm your email before signing in.';
  }

  if (lower.includes('unacceptable audience')) {
    return 'Apple sign-in is misconfigured. Add com.chairside.app to Supabase Apple Client IDs.';
  }

  if (lower.includes('issuer did not match') || lower.includes('account.apple.com')) {
    return 'Apple sign-in failed due to an Apple/Supabase issuer mismatch. Check Supabase Auth logs or contact Supabase support.';
  }

  if (
    lower.includes('pwned') ||
    lower.includes('known to be weak') ||
    lower.includes('weak_password')
  ) {
    return 'That password has appeared in a data breach. Choose a different one.';
  }

  if (lower.includes('password should be at least')) {
    return `Use at least ${PASSWORD_MIN_LENGTH} characters.`;
  }

  return message;
}
