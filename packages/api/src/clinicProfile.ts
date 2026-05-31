import type { ClinicSpecialty, TeamSizeRange } from '@chairside/config';
import { getSupabaseClient } from './client';
import type { Database } from './types';

export type ClinicProfile = Database['public']['Tables']['clinic_profiles']['Row'];

export type ClinicProfileUpdate = Partial<
  Omit<ClinicProfile, 'id' | 'created_at' | 'updated_at' | 'province'>
> & {
  province?: string;
};

const VALID_SPECIALTIES: ClinicSpecialty[] = [
  'general',
  'ortho',
  'pediatric',
  'periodontics',
  'endodontics',
  'oral_surgery',
  'other',
];

function normalizeSpecialty(value: string | null | undefined): ClinicSpecialty {
  if (value && VALID_SPECIALTIES.includes(value as ClinicSpecialty)) {
    return value as ClinicSpecialty;
  }
  return 'general';
}

export function isClinicProfileComplete(profile: ClinicProfile | null): boolean {
  if (!profile) return false;

  const hasContact = Boolean(profile.phone?.trim() || profile.contact_name?.trim());

  return (
    Boolean(profile.clinic_name?.trim()) &&
    Boolean(profile.address_line1?.trim()) &&
    Boolean(profile.city?.trim()) &&
    Boolean(profile.postal_code?.trim()) &&
    profile.software_used.length > 0 &&
    hasContact
  );
}

export function getMissingClinicProfileFields(profile: ClinicProfile | null): string[] {
  if (!profile) {
    return [
      'Clinic name',
      'Street address',
      'City',
      'Postal code',
      'Software used',
      'Phone or contact name',
    ];
  }

  const missing: string[] = [];
  if (!profile.clinic_name?.trim()) missing.push('Clinic name');
  if (!profile.address_line1?.trim()) missing.push('Street address');
  if (!profile.city?.trim()) missing.push('City');
  if (!profile.postal_code?.trim()) missing.push('Postal code');
  if (profile.software_used.length === 0) missing.push('Software used');
  if (!profile.phone?.trim() && !profile.contact_name?.trim()) {
    missing.push('Phone or contact name');
  }
  return missing;
}

export async function getClinicProfile(userId: string): Promise<ClinicProfile | null> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('clinic_profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function upsertClinicProfile(
  userId: string,
  partial: ClinicProfileUpdate,
): Promise<ClinicProfile> {
  const supabase = getSupabaseClient();
  const now = new Date().toISOString();

  const payload: Database['public']['Tables']['clinic_profiles']['Insert'] = {
    id: userId,
    updated_at: now,
  };

  if (partial.clinic_name !== undefined) payload.clinic_name = partial.clinic_name;
  if (partial.contact_name !== undefined) payload.contact_name = partial.contact_name;
  if (partial.phone !== undefined) payload.phone = partial.phone;
  if (partial.address_line1 !== undefined) payload.address_line1 = partial.address_line1;
  if (partial.address_line2 !== undefined) payload.address_line2 = partial.address_line2;
  if (partial.city !== undefined) payload.city = partial.city;
  if (partial.province !== undefined) payload.province = partial.province;
  if (partial.postal_code !== undefined) payload.postal_code = partial.postal_code;
  if (partial.latitude !== undefined) payload.latitude = partial.latitude;
  if (partial.longitude !== undefined) payload.longitude = partial.longitude;
  if (partial.specialty !== undefined) payload.specialty = normalizeSpecialty(partial.specialty);
  if (partial.software_used !== undefined) payload.software_used = partial.software_used;
  if (partial.operatories_count !== undefined) payload.operatories_count = partial.operatories_count;
  if (partial.team_size_range !== undefined) {
    payload.team_size_range = partial.team_size_range;
  }
  if (partial.website !== undefined) payload.website = partial.website;
  if (partial.description !== undefined) payload.description = partial.description;
  if (partial.logo_storage_path !== undefined) payload.logo_storage_path = partial.logo_storage_path;
  if (partial.logo_uploaded_at !== undefined) payload.logo_uploaded_at = partial.logo_uploaded_at;
  if (partial.setup_completed_at !== undefined) {
    payload.setup_completed_at = partial.setup_completed_at;
  }
  if (partial.accepts_general_candidate_messages !== undefined) {
    payload.accepts_general_candidate_messages = partial.accepts_general_candidate_messages;
  }

  const { data, error } = await supabase
    .from('clinic_profiles')
    .upsert(payload, { onConflict: 'id' })
    .select('*')
    .single();

  if (error) throw error;

  if (partial.clinic_name?.trim()) {
    await supabase
      .from('profiles')
      .update({ display_name: partial.clinic_name.trim(), updated_at: now })
      .eq('id', userId);
  }

  return data;
}

export async function completeClinicSetup(userId: string): Promise<ClinicProfile> {
  const profile = await getClinicProfile(userId);
  if (!isClinicProfileComplete(profile)) {
    throw new Error('Clinic profile is incomplete');
  }

  return upsertClinicProfile(userId, {
    setup_completed_at: new Date().toISOString(),
  });
}
