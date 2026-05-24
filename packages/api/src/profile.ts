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

export async function updateProfileDisplayName(userId: string, displayName: string) {
  const supabase = getSupabaseClient();
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from('profiles')
    .update({ display_name: displayName.trim(), updated_at: now })
    .eq('id', userId)
    .select('*')
    .single();

  if (error) throw error;
  return data;
}
