import {
  joinDisplayName,
  splitDisplayName,
  type PersonNameParts,
} from './authDisplayName';
import type { UserRole } from './types';
import { getSupabaseClient } from './client';

export async function getProfile(userId: string) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

/** Resolve role after sign-in, including recovery when setup exists but role was not saved. */
export async function resolveAuthProfile(userId: string) {
  const profile = await getProfile(userId);
  if (profile?.role) return profile;

  const supabase = getSupabaseClient();
  const { data: workerProfile, error: workerError } = await supabase
    .from('worker_profiles')
    .select('id')
    .eq('id', userId)
    .maybeSingle();

  if (workerError) throw workerError;

  if (workerProfile) {
    return setProfileRole(userId, 'worker');
  }

  const { data: clinicProfile, error: clinicError } = await supabase
    .from('clinic_profiles')
    .select('id')
    .eq('id', userId)
    .maybeSingle();

  if (clinicError) throw clinicError;

  if (clinicProfile) {
    return setProfileRole(userId, 'clinic');
  }

  return profile;
}

export async function setProfileRole(userId: string, role: UserRole) {
  const supabase = getSupabaseClient();
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from('profiles')
    .upsert({
      id: userId,
      role,
      onboarding_completed_at: now,
      updated_at: now,
    })
    .select('*')
    .single();

  if (error) throw error;
  return data;
}

function normalizeNameParts(input: PersonNameParts): PersonNameParts & { displayName: string } {
  const firstName = input.firstName.trim();
  const lastName = input.lastName.trim();
  return {
    firstName,
    lastName,
    displayName: joinDisplayName(firstName, lastName),
  };
}

/** Write first_name, last_name, and synced display_name. */
export async function updateProfileName(userId: string, name: PersonNameParts) {
  const supabase = getSupabaseClient();
  const now = new Date().toISOString();
  const { firstName, lastName, displayName } = normalizeNameParts(name);
  const existing = await getProfile(userId);

  const payload = {
    first_name: firstName || null,
    last_name: lastName || null,
    display_name: displayName || null,
    updated_at: now,
  };

  if (existing) {
    const { data, error } = await supabase
      .from('profiles')
      .update(payload)
      .eq('id', userId)
      .select('*')
      .single();

    if (error) throw error;
    return data;
  }

  const { data, error } = await supabase
    .from('profiles')
    .insert({
      id: userId,
      ...payload,
      role: 'worker',
    })
    .select('*')
    .single();

  if (error) throw error;
  return data;
}

/** Convenience wrapper: split a single string into first/last and save all three columns. */
export async function updateProfileDisplayName(userId: string, displayName: string) {
  return updateProfileName(userId, splitDisplayName(displayName));
}

/**
 * Seed profile name fields from auth (e.g. Sign in with Apple) without
 * overwriting names the user already set, and without forcing a role.
 */
export async function ensureProfileName(userId: string, name: PersonNameParts) {
  const { firstName, lastName, displayName } = normalizeNameParts(name);
  if (!displayName) return null;

  const existing = await getProfile(userId);
  const supabase = getSupabaseClient();
  const now = new Date().toISOString();

  if (existing) {
    const hasFirst = Boolean(existing.first_name?.trim());
    const hasLast = Boolean(existing.last_name?.trim());
    const hasDisplay = Boolean(existing.display_name?.trim());

    // Fully seeded already — leave alone.
    if (hasFirst && hasLast && hasDisplay) {
      return existing;
    }

    const splitFromDisplay = splitDisplayName(existing.display_name);
    const nextFirst = hasFirst
      ? existing.first_name!.trim()
      : firstName || splitFromDisplay.firstName;
    const nextLast = hasLast
      ? existing.last_name!.trim()
      : lastName || splitFromDisplay.lastName;
    const nextDisplay = hasDisplay
      ? existing.display_name!.trim()
      : joinDisplayName(nextFirst, nextLast);

    if (
      nextFirst === (existing.first_name?.trim() ?? '') &&
      nextLast === (existing.last_name?.trim() ?? '') &&
      nextDisplay === (existing.display_name?.trim() ?? '')
    ) {
      return existing;
    }

    const { data, error } = await supabase
      .from('profiles')
      .update({
        first_name: nextFirst || null,
        last_name: nextLast || null,
        display_name: nextDisplay || null,
        updated_at: now,
      })
      .eq('id', userId)
      .select('*')
      .single();

    if (error) throw error;
    return data;
  }

  const { data, error } = await supabase
    .from('profiles')
    .insert({
      id: userId,
      first_name: firstName || null,
      last_name: lastName || null,
      display_name: displayName,
      updated_at: now,
    })
    .select('*')
    .single();

  if (error) throw error;
  return data;
}

/**
 * @deprecated Prefer ensureProfileName with first/last parts.
 * Seed profiles.display_name from a single string without overwriting.
 */
export async function ensureProfileDisplayName(userId: string, displayName: string) {
  return ensureProfileName(userId, splitDisplayName(displayName));
}
