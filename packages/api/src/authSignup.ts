import type { Session, User } from '@supabase/supabase-js';

import { getSupabaseClient } from './client';
import { getErrorMessage } from './errors';
import type { UserRole } from './types';

export const ACCOUNT_ALREADY_EXISTS_MESSAGE = 'An account with this email already exists.';
export const SIGNUP_CONFIRMATION_REQUIRED_MESSAGE =
  'We sent a confirmation link. Open it to finish setting up your account.';

export type SignUpSessionResult = {
  session: Session | null;
  user: User | null;
  confirmationRequired: boolean;
};

export function hasRealAuthIdentities(user: User | null | undefined): boolean {
  return Boolean(user?.identities && user.identities.length > 0);
}

export function getSignupEmailRedirectUrl(): string {
  const fromEnv = process.env.EXPO_PUBLIC_WEB_BASE_URL?.trim().replace(/\/$/, '');
  return `${fromEnv || 'https://chairsidedental.app'}/auth/callback`;
}

function isEmailNotConfirmedError(error: unknown): boolean {
  return getErrorMessage(error, '').toLowerCase().includes('email not confirmed');
}

function isInvalidLoginError(error: unknown): boolean {
  return getErrorMessage(error, '').toLowerCase().includes('invalid login credentials');
}

function isAlreadyRegisteredError(error: unknown): boolean {
  return getErrorMessage(error, '').toLowerCase().includes('user already registered');
}

function sessionResult(session: Session | null): SignUpSessionResult {
  return {
    session,
    user: session?.user ?? null,
    confirmationRequired: false,
  };
}

export async function signUpWithEmail(email: string, password: string, role: UserRole) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.auth.signUp({
    email: email.trim(),
    password,
    options: {
      data: { role },
      emailRedirectTo: getSignupEmailRedirectUrl(),
    },
  });

  if (error) throw error;
  return data;
}

export async function resendSignupConfirmation(email: string) {
  const supabase = getSupabaseClient();
  const { error } = await supabase.auth.resend({
    type: 'signup',
    email: email.trim(),
    options: {
      emailRedirectTo: getSignupEmailRedirectUrl(),
    },
  });

  if (error) throw error;
}

/**
 * signUp sometimes omits session even when the account is immediately usable
 * (e.g. confirm-email disabled). Fall back to a matching stored session, then
 * password sign-in. Never returns a signup user id that is not session.user.
 */
export async function establishSessionAfterSignUp(
  email: string,
  password: string,
  signUpData: { session: Session | null; user: User | null },
): Promise<SignUpSessionResult> {
  const signupUserIsReal = hasRealAuthIdentities(signUpData.user);

  if (signUpData.session?.user && signupUserIsReal) {
    return sessionResult(signUpData.session);
  }

  const supabase = getSupabaseClient();
  const {
    data: { session: storedSession },
  } = await supabase.auth.getSession();

  if (
    storedSession?.user &&
    signupUserIsReal &&
    signUpData.user &&
    storedSession.user.id === signUpData.user.id
  ) {
    return sessionResult(storedSession);
  }

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    if (error) throw error;
    if (data.session?.user) {
      return sessionResult(data.session);
    }
  } catch (error) {
    if (isEmailNotConfirmedError(error)) {
      return { session: null, user: null, confirmationRequired: true };
    }
    if (!signupUserIsReal && isInvalidLoginError(error)) {
      throw new Error(ACCOUNT_ALREADY_EXISTS_MESSAGE);
    }
    throw error;
  }

  if (signupUserIsReal) {
    return { session: null, user: null, confirmationRequired: true };
  }

  return { session: null, user: null, confirmationRequired: false };
}

export async function completeEmailSignUp(
  email: string,
  password: string,
  role: UserRole,
): Promise<SignUpSessionResult> {
  try {
    const signUpData = await signUpWithEmail(email, password, role);
    return establishSessionAfterSignUp(email, password, signUpData);
  } catch (error) {
    if (isAlreadyRegisteredError(error)) {
      return establishSessionAfterSignUp(email, password, { session: null, user: null });
    }
    throw error;
  }
}
