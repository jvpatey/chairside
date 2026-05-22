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
