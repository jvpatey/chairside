import { normalizePhoneToE164 } from '@chairside/config';
import type { Session, User } from '@supabase/supabase-js';

import { getSignupEmailRedirectUrl } from './authSignup';
import { getSupabaseClient } from './client';
import type { PersonNameParts } from './authDisplayName';
import { updateProfileName, setProfileRole } from './profile';
import type { UserRole } from './types';
import { ensureWorkerProfileRow, upsertWorkerProfile } from './workerProfile';

export type OtpChannel = 'email' | 'phone';

export function normalizeAuthPhone(phone: string): string {
  const e164 = normalizePhoneToE164(phone);
  if (!e164) {
    throw new Error('Enter a valid 10-digit mobile number.');
  }
  return e164;
}

/** Digits-only NANP for worker_profiles.phone storage. */
export function authPhoneToStorageDigits(phoneE164: string): string | null {
  const digits = phoneE164.replace(/\D/g, '');
  if (digits.length === 11 && digits.startsWith('1')) return digits.slice(1);
  if (digits.length === 10) return digits;
  return null;
}

export async function signInWithEmailOtp(email: string, role?: UserRole) {
  const supabase = getSupabaseClient();
  const trimmed = email.trim();
  if (!trimmed) throw new Error('Enter your email.');

  const { error } = await supabase.auth.signInWithOtp({
    email: trimmed,
    options: {
      shouldCreateUser: true,
      emailRedirectTo: getSignupEmailRedirectUrl(),
      data: role ? { role } : undefined,
    },
  });

  if (error) throw error;
}

export async function verifyEmailOtp(email: string, token: string): Promise<Session> {
  const supabase = getSupabaseClient();
  const trimmedEmail = email.trim();
  const trimmedToken = token.trim();

  // New emails with "Confirm email" on use the signup template; returning users use magic-link/email.
  const types = ['email', 'signup', 'magiclink'] as const;
  let lastError: unknown = null;

  for (const type of types) {
    const { data, error } = await supabase.auth.verifyOtp({
      email: trimmedEmail,
      token: trimmedToken,
      type,
    });
    if (!error && data.session) {
      return data.session;
    }
    lastError = error;
  }

  if (lastError) throw lastError;
  throw new Error('Could not verify that code. Try again.');
}

export type SignInWithPhoneOtpOptions = {
  /**
   * When false (sign-in), never mint a new Auth user for an unknown number.
   * Sign-up keeps the default true.
   */
  createUser?: boolean;
};

export async function signInWithPhoneOtp(
  phone: string,
  role?: UserRole,
  options?: SignInWithPhoneOtpOptions,
) {
  const supabase = getSupabaseClient();
  const e164 = normalizeAuthPhone(phone);
  const createUser = options?.createUser ?? true;

  const { error } = await supabase.auth.signInWithOtp({
    phone: e164,
    options: {
      shouldCreateUser: createUser,
      data: role ? { role } : undefined,
    },
  });

  if (error) throw error;
  return e164;
}

export async function verifyPhoneOtp(phone: string, token: string): Promise<Session> {
  const supabase = getSupabaseClient();
  const e164 = normalizeAuthPhone(phone);
  const { data, error } = await supabase.auth.verifyOtp({
    phone: e164,
    token: token.trim(),
    type: 'sms',
  });

  if (error) throw error;
  if (!data.session) throw new Error('Could not verify that code. Try again.');
  return data.session;
}

function isPhoneTakenAuthError(error: unknown): boolean {
  const message =
    error && typeof error === 'object' && 'message' in error
      ? String((error as { message?: unknown }).message ?? '')
      : '';
  const lower = message.toLowerCase();
  return (
    (lower.includes('phone') &&
      (lower.includes('already') || lower.includes('registered') || lower.includes('exists'))) ||
    lower.includes('unique') ||
    lower.includes('duplicate')
  );
}

/**
 * Clears empty phone-only Auth shells that stole this number (pre-link bug),
 * or reports that the number is free / already ours.
 */
export async function reclaimAuthPhone(phone: string): Promise<'available' | 'owned' | 'reclaimed'> {
  const supabase = getSupabaseClient();
  const e164 = normalizeAuthPhone(phone);
  const { data, error } = await supabase.functions.invoke('reclaim-auth-phone', {
    body: { phone: e164, action: 'reclaim' },
  });
  if (error) throw error;
  const status = (data as { status?: string; error?: string } | null)?.status;
  if (status === 'available' || status === 'owned' || status === 'reclaimed') {
    return status;
  }
  const message =
    (data as { error?: string } | null)?.error ??
    'That number is already linked to another account.';
  throw new Error(message);
}

/**
 * After phone OTP sign-in: if this session is an empty shell but worker_profiles
 * already owns the number, delete the shell and tell the client to use email.
 */
export async function resolvePhoneShellLogin(phone: string): Promise<void> {
  const supabase = getSupabaseClient();
  const e164 = normalizeAuthPhone(phone);
  const { data, error } = await supabase.functions.invoke('reclaim-auth-phone', {
    body: { phone: e164, action: 'resolve_shell_login' },
  });
  if (error) throw error;
  const payload = data as { status?: string; message?: string; error?: string } | null;
  if (payload?.status === 'conflict') {
    throw new Error(
      payload.message ??
        'That number belongs to an existing account. Sign in with email, then verify your mobile in Profile.',
    );
  }
  if (payload?.error) {
    throw new Error(payload.error);
  }
}

export type AuthPhoneBindResult = {
  e164: string;
  /** False when Auth already confirmed this phone (or project applies phone without OTP). */
  needsOtp: boolean;
};

/**
 * While signed in, start linking this mobile to the current Auth user (SMS OTP).
 * Always follows `updateUser` with a `phone_change` resend so a code is actually
 * delivered when confirmations are enabled. Does not update worker_profiles until
 * `verifyAuthPhoneBind` succeeds (unless needsOtp is false).
 */
export async function requestAuthPhoneBind(phone: string): Promise<AuthPhoneBindResult> {
  const supabase = getSupabaseClient();
  const e164 = normalizeAuthPhone(phone);
  const digits = authPhoneToStorageDigits(e164) ?? '';

  const {
    data: { user: current },
  } = await supabase.auth.getUser();
  if (current && authUserHasVerifiedPhone(current, digits)) {
    return { e164, needsOtp: false };
  }

  const tryUpdate = async () => {
    const { error } = await supabase.auth.updateUser({ phone: e164 });
    if (error) throw error;
  };

  try {
    await tryUpdate();
  } catch (error) {
    if (!isPhoneTakenAuthError(error)) throw error;
    await reclaimAuthPhone(e164);
    await tryUpdate();
  }

  const {
    data: { user: afterUpdate },
  } = await supabase.auth.getUser();
  if (afterUpdate && authUserHasVerifiedPhone(afterUpdate, digits)) {
    // Phone confirmations are off — Auth applied the number with no SMS.
    return { e164, needsOtp: false };
  }

  const { error: resendError } = await supabase.auth.resend({
    type: 'phone_change',
    phone: e164,
  });
  if (resendError) {
    const lower = resendError.message.toLowerCase();
    // updateUser may already have triggered the first SMS; rate limits are OK to surface.
    if (lower.includes('rate') || lower.includes('security') || lower.includes('60')) {
      throw resendError;
    }
    if (lower.includes('disabled') || lower.includes('provider') || lower.includes('hook')) {
      throw resendError;
    }
  }

  return { e164, needsOtp: true };
}

/**
 * Confirm the SMS from `requestAuthPhoneBind`, then write digits to worker_profiles.
 */
export async function verifyAuthPhoneBind(
  userId: string,
  phone: string,
  token: string,
): Promise<string> {
  const supabase = getSupabaseClient();
  const e164 = normalizeAuthPhone(phone);
  const { data, error } = await supabase.auth.verifyOtp({
    phone: e164,
    token: token.trim(),
    type: 'phone_change',
  });
  if (error) throw error;

  // Hosted Auth requires phone_change OTP; some local setups apply updateUser immediately.
  // Either way, persist the verified number on the worker profile for SMS alerts.
  const storagePhone = authPhoneToStorageDigits(e164);
  if (storagePhone) {
    await ensureWorkerProfileRow(userId);
    await upsertWorkerProfile(userId, { phone: storagePhone });
  }

  // Prefer session from verify when present; otherwise keep the existing signed-in session.
  if (!data.session) {
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData.session) {
      throw new Error('Could not verify that code. Try again.');
    }
  }

  return e164;
}

/** True when Auth already has this NANP number on the signed-in user. */
export function authUserHasPhone(authPhone: string | null | undefined, storageDigits: string): boolean {
  if (!authPhone?.trim() || !storageDigits.trim()) return false;
  try {
    return authPhoneToStorageDigits(normalizeAuthPhone(authPhone)) === storageDigits.replace(/\D/g, '');
  } catch {
    return false;
  }
}

/** True when Auth has this number and it is confirmed (safe to skip bind OTP). */
export function authUserHasVerifiedPhone(
  user: Pick<User, 'phone' | 'phone_confirmed_at'> | null | undefined,
  storageDigits: string,
): boolean {
  if (!user?.phone_confirmed_at) return false;
  return authUserHasPhone(user.phone, storageDigits);
}

type FinishWorkerOtpAuthInput = {
  userId: string;
  role: UserRole;
  name?: PersonNameParts | null;
  phoneE164?: string | null;
};

/**
 * After OTP verify: optional name, role, empty worker row, and verified phone on profile.
 */
export async function finishWorkerOtpAuth({
  userId,
  role,
  name,
  phoneE164,
}: FinishWorkerOtpAuthInput) {
  if (name && (name.firstName.trim() || name.lastName.trim())) {
    await updateProfileName(userId, name);
  }
  await setProfileRole(userId, role);

  if (role === 'worker') {
    await ensureWorkerProfileRow(userId);
    const storagePhone = phoneE164 ? authPhoneToStorageDigits(phoneE164) : null;
    if (storagePhone) {
      await upsertWorkerProfile(userId, { phone: storagePhone });
    }
  }
}
