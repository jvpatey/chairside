import * as AppleAuthentication from 'expo-apple-authentication';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { Platform } from 'react-native';

import { getSupabaseClient } from './client';
import { getErrorMessage } from './errors';
import { parseAuthRedirectUrl, isPasswordRecoveryRedirect } from './parseAuthRedirectUrl';
import type { UserRole } from './types';

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

export async function signOut() {
  const supabase = getSupabaseClient();
  // Clear local session immediately; avoids races with in-flight token refresh.
  const { error } = await supabase.auth.signOut({ scope: 'local' });
  if (error) throw error;
}

export async function deleteAccount() {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.functions.invoke('delete-account');

  if (error) throw error;

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

  if (credential.fullName) {
    const nameParts = [
      credential.fullName.givenName,
      credential.fullName.middleName,
      credential.fullName.familyName,
    ].filter(Boolean);

    const fullName = nameParts.join(' ');

    if (fullName) {
      await supabase.auth.updateUser({
        data: {
          full_name: fullName,
          given_name: credential.fullName.givenName ?? undefined,
          family_name: credential.fullName.familyName ?? undefined,
        },
      });
    }
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

  return message;
}
