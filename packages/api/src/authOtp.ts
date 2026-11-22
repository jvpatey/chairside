import { normalizePhoneToE164 } from '@chairside/config';
import type { Session } from '@supabase/supabase-js';

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

export async function signInWithPhoneOtp(phone: string, role?: UserRole) {
  const supabase = getSupabaseClient();
  const e164 = normalizeAuthPhone(phone);

  const { error } = await supabase.auth.signInWithOtp({
    phone: e164,
    options: {
      shouldCreateUser: true,
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
