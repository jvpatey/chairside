import type { ClinicSpecialty, TeamSizeRange } from '@chairside/config';
import { normalizePracticeDoctors } from '@chairside/config';
import { getSupabaseClient } from './client';
import { listClinicLocations, syncPrimaryLocationToClinicProfile } from './clinicOrganization';
import { throwWithMessage } from './errors';
import type { Database } from './types';
import {
  isClinicProfileComplete,
} from './clinicProfileValidation';

export {
  getMissingClinicProfileFields,
  isClinicLocationRecordComplete,
  isClinicProfileComplete,
  type ClinicProfileCompletenessLocation,
  type ClinicProfileCompletenessOptions,
} from './clinicProfileValidation';

export type ClinicProfile = Database['public']['Tables']['clinic_profiles']['Row'];

export type ClinicProfileUpdate = Partial<
  Omit<ClinicProfile, 'id' | 'created_at' | 'updated_at' | 'province'>
> & {
  province?: string;
};

export async function getClinicProfileByOrganizationId(
  organizationId: string,
): Promise<ClinicProfile | null> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('clinic_profiles')
    .select('*')
    .or(`id.eq.${organizationId},organization_id.eq.${organizationId}`)
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data;
}

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
  if (partial.practice_doctors !== undefined) {
    payload.practice_doctors = normalizePracticeDoctors(partial.practice_doctors);
  }
  if (partial.account_type !== undefined) payload.account_type = partial.account_type;
  if (partial.organization_id !== undefined) payload.organization_id = partial.organization_id;

  if (payload.organization_id === undefined) {
    payload.organization_id = userId;
  }

  const { data, error } = await supabase
    .from('clinic_profiles')
    .upsert(payload, { onConflict: 'id' })
    .select('*')
    .single();

  if (error) {
    throwWithMessage(error, 'Could not save clinic profile.');
  }
  if (!data) {
    throw new Error('Could not save clinic profile.');
  }

  if (partial.clinic_name?.trim()) {
    await supabase
      .from('profiles')
      .update({ display_name: partial.clinic_name.trim(), updated_at: now })
      .eq('id', userId);
  }

  return data;
}

export async function completeClinicSetup(userId: string): Promise<ClinicProfile> {
  let profile = await getClinicProfile(userId);
  const organizationId = profile?.organization_id ?? userId;
  const locations =
    profile?.account_type === 'group'
      ? await listClinicLocations(organizationId, { activeOnly: true })
      : [];

  if (profile?.account_type === 'group') {
    const primary = locations.find((location) => location.is_primary) ?? locations[0];
    if (primary) {
      await syncPrimaryLocationToClinicProfile(primary);
      profile = await getClinicProfile(userId);
    }
  }

  if (!isClinicProfileComplete(profile, { locations })) {
    throw new Error('Clinic profile is incomplete');
  }

  return upsertClinicProfile(userId, {
    setup_completed_at: new Date().toISOString(),
  });
}
