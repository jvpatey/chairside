import type { RoleType } from '@chairside/config';
import { formatWorkerEducation } from '@chairside/config';
import { getProfile, setProfileRole } from './profile';
import { getSupabaseClient } from './client';
import type { Database } from './types';
import {
  getMissingWorkerProfileFields,
  getWorkerRoleTypes,
  isWorkerProfileComplete,
} from './workerProfileValidation';

export {
  getMissingWorkerProfileFields,
  getWorkerRoleTypes,
  isWorkerProfileComplete,
} from './workerProfileValidation';

export type WorkerProfile = Database['public']['Tables']['worker_profiles']['Row'];
export type WorkerProfileUpdate = Partial<
  Omit<WorkerProfile, 'id' | 'created_at' | 'updated_at' | 'province'>
> & {
  province?: string;
};

export type FillInNotificationMode = 'off' | 'all' | 'available_days_only';

export type AvailabilityBlock = Database['public']['Tables']['availability_blocks']['Row'];

export type AvailabilityBlockInput = {
  day_of_week: number;
  start_time: string;
  end_time: string;
};

const VALID_ROLE_TYPES: RoleType[] = [
  'hygienist',
  'assistant',
  'admin',
  'office_manager',
  'treatment_coordinator',
  'dentist',
  'other',
];

function normalizeRoleType(value: string | null | undefined): RoleType | null {
  if (value && VALID_ROLE_TYPES.includes(value as RoleType)) {
    return value as RoleType;
  }
  return null;
}

function normalizeRoleTypes(values: string[] | null | undefined): RoleType[] {
  if (!values?.length) return [];

  const seen = new Set<RoleType>();
  for (const value of values) {
    const role = normalizeRoleType(value);
    if (role) seen.add(role);
  }

  return VALID_ROLE_TYPES.filter((role) => seen.has(role));
}

export function hasWorkerRole(profile: WorkerProfile | null, roleType: RoleType): boolean {
  return getWorkerRoleTypes(profile).includes(roleType);
}

async function ensureWorkerRoleForProfile(userId: string): Promise<void> {
  const profile = await getProfile(userId);

  if (!profile) {
    await setProfileRole(userId, 'worker');
    return;
  }

  if (profile.role === 'worker') return;

  if (profile.role === 'clinic') {
    throw new Error('This account is registered as a clinic');
  }

  await setProfileRole(userId, 'worker');
}

export async function getWorkerProfile(userId: string): Promise<WorkerProfile | null> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('worker_profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function upsertWorkerProfile(
  userId: string,
  partial: WorkerProfileUpdate,
): Promise<WorkerProfile> {
  await ensureWorkerRoleForProfile(userId);

  const supabase = getSupabaseClient();
  const now = new Date().toISOString();

  const payload: Database['public']['Tables']['worker_profiles']['Insert'] = {
    id: userId,
    updated_at: now,
  };

  if (partial.role_types !== undefined) {
    const roleTypes = normalizeRoleTypes(partial.role_types);
    payload.role_types = roleTypes;
    payload.role_type = roleTypes[0] ?? null;
  }
  if (partial.role_type !== undefined && partial.role_types === undefined) {
    const roleType = normalizeRoleType(partial.role_type);
    payload.role_type = roleType;
    payload.role_types = roleType ? [roleType] : [];
  }
  if (partial.license_type !== undefined) payload.license_type = partial.license_type;
  if (partial.years_of_experience !== undefined) {
    payload.years_of_experience = partial.years_of_experience;
  }
  if (partial.education_graduation_year !== undefined) {
    payload.education_graduation_year = partial.education_graduation_year;
  }
  if (partial.education_degree_type !== undefined) {
    payload.education_degree_type = partial.education_degree_type;
  }
  if (partial.education_field !== undefined) payload.education_field = partial.education_field;
  if (partial.education_institution !== undefined) {
    payload.education_institution = partial.education_institution;
  }
  if (partial.education !== undefined) payload.education = partial.education;
  if (partial.software_used !== undefined) payload.software_used = partial.software_used;
  if (partial.practice_types !== undefined) payload.practice_types = partial.practice_types;
  if (partial.preferred_employment_types !== undefined) {
    payload.preferred_employment_types = partial.preferred_employment_types;
  }
  if (partial.address_line1 !== undefined) payload.address_line1 = partial.address_line1;
  if (partial.address_line2 !== undefined) payload.address_line2 = partial.address_line2;
  if (partial.city !== undefined) payload.city = partial.city;
  if (partial.province !== undefined) payload.province = partial.province;
  if (partial.postal_code !== undefined) payload.postal_code = partial.postal_code;
  if (partial.latitude !== undefined) payload.latitude = partial.latitude;
  if (partial.longitude !== undefined) payload.longitude = partial.longitude;
  if (partial.travel_radius_km !== undefined) payload.travel_radius_km = partial.travel_radius_km;
  if (partial.travel_radius_range !== undefined) {
    payload.travel_radius_range = partial.travel_radius_range;
  }
  if (partial.bio !== undefined) payload.bio = partial.bio;
  if (partial.short_notice_available !== undefined) {
    payload.short_notice_available = partial.short_notice_available;
  }
  if (partial.fill_in_notification_mode !== undefined) {
    payload.fill_in_notification_mode = partial.fill_in_notification_mode;
  }
  if (partial.phone !== undefined) payload.phone = partial.phone;
  if (partial.fill_in_sms_opt_in !== undefined) {
    payload.fill_in_sms_opt_in = partial.fill_in_sms_opt_in;
  }
  if (partial.accepts_clinic_fill_in_outreach !== undefined) {
    payload.accepts_clinic_fill_in_outreach = partial.accepts_clinic_fill_in_outreach;
  }
  if (partial.accepts_clinic_fill_in_outreach !== undefined) {
    payload.accepts_clinic_fill_in_outreach = partial.accepts_clinic_fill_in_outreach;
  }
  if (partial.job_notification_opt_in !== undefined) {
    payload.job_notification_opt_in = partial.job_notification_opt_in;
  }
  if (partial.setup_completed_at !== undefined) {
    payload.setup_completed_at = partial.setup_completed_at;
  }
  if (partial.resume_storage_path !== undefined) {
    payload.resume_storage_path = partial.resume_storage_path;
  }
  if (partial.resume_file_name !== undefined) payload.resume_file_name = partial.resume_file_name;
  if (partial.resume_uploaded_at !== undefined) {
    payload.resume_uploaded_at = partial.resume_uploaded_at;
  }
  if (partial.default_cover_message !== undefined) {
    payload.default_cover_message = partial.default_cover_message;
  }
  if (partial.photo_storage_path !== undefined) {
    payload.photo_storage_path = partial.photo_storage_path;
  }
  if (partial.photo_uploaded_at !== undefined) {
    payload.photo_uploaded_at = partial.photo_uploaded_at;
  }

  const { data, error } = await supabase
    .from('worker_profiles')
    .upsert(payload, { onConflict: 'id' })
    .select('*')
    .single();

  if (error) throw error;
  return data;
}

export function getWorkerEducationSummary(profile: WorkerProfile | null): string {
  if (!profile) return '';
  return formatWorkerEducation(profile);
}

export async function completeWorkerSetup(userId: string): Promise<WorkerProfile> {
  const profile = await getWorkerProfile(userId);
  if (!isWorkerProfileComplete(profile)) {
    throw new Error('Worker profile is incomplete');
  }

  return upsertWorkerProfile(userId, {
    setup_completed_at: new Date().toISOString(),
  });
}

export async function listAvailabilityBlocks(workerId: string): Promise<AvailabilityBlock[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('availability_blocks')
    .select('*')
    .eq('worker_id', workerId)
    .order('day_of_week')
    .order('start_time');

  if (error) throw error;
  return data ?? [];
}

export async function upsertAvailabilityBlocks(
  workerId: string,
  blocks: AvailabilityBlockInput[],
): Promise<AvailabilityBlock[]> {
  const supabase = getSupabaseClient();
  const now = new Date().toISOString();

  const { error: deleteError } = await supabase
    .from('availability_blocks')
    .delete()
    .eq('worker_id', workerId);

  if (deleteError) throw deleteError;

  if (blocks.length === 0) return [];

  const rows = blocks.map((block) => ({
    worker_id: workerId,
    day_of_week: block.day_of_week,
    start_time: block.start_time,
    end_time: block.end_time,
    updated_at: now,
  }));

  const { data, error } = await supabase.from('availability_blocks').insert(rows).select('*');

  if (error) throw error;
  return data ?? [];
}

const CLINIC_WORKER_PROFILE_COLUMNS =
  'id, role_type, role_types, years_of_experience, education, education_graduation_year, education_degree_type, education_field, education_institution, software_used, practice_types, preferred_employment_types, city, province, travel_radius_km, travel_radius_range, bio, short_notice_available, fill_in_notification_mode, resume_storage_path, resume_file_name, resume_uploaded_at, photo_storage_path, photo_uploaded_at, default_cover_message, setup_completed_at, created_at, updated_at';

/** Worker profile fields exposed to clinics (excludes address, phone, and notification prefs). */
export type ClinicWorkerProfile = Pick<
  WorkerProfile,
  | 'id'
  | 'role_type'
  | 'role_types'
  | 'years_of_experience'
  | 'education'
  | 'education_graduation_year'
  | 'education_degree_type'
  | 'education_field'
  | 'education_institution'
  | 'software_used'
  | 'practice_types'
  | 'preferred_employment_types'
  | 'city'
  | 'province'
  | 'travel_radius_km'
  | 'travel_radius_range'
  | 'bio'
  | 'short_notice_available'
  | 'fill_in_notification_mode'
  | 'accepts_clinic_fill_in_outreach'
  | 'accepts_clinic_fill_in_outreach'
  | 'resume_storage_path'
  | 'resume_file_name'
  | 'resume_uploaded_at'
  | 'photo_storage_path'
  | 'photo_uploaded_at'
  | 'default_cover_message'
  | 'setup_completed_at'
  | 'created_at'
  | 'updated_at'
>;

export async function getWorkerProfileForClinic(
  workerId: string,
): Promise<ClinicWorkerProfile | null> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('worker_profiles')
    .select(CLINIC_WORKER_PROFILE_COLUMNS)
    .eq('id', workerId)
    .maybeSingle();

  if (error) throw error;
  return data as ClinicWorkerProfile | null;
}
