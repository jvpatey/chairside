import { getSupabaseClient } from './client';
import { normalizePracticeDoctors, type PracticeDoctor } from '@chairside/config';
import { getClinicPlanMap } from './billing';
import {
  getJobPostScreeningQuestions,
  type ScreeningQuestion,
} from './screening';
import type { JobPost, ShiftPost } from './posts';
import type { ClinicSummary, LiveJobPost, LiveShiftPost } from './posts';

export type PublicClinicProfile = {
  clinic_id: string;
  clinic_name: string;
  city: string | null;
  province: string;
  address_line1: string | null;
  address_line2: string | null;
  postal_code: string | null;
  latitude: number | null;
  longitude: number | null;
  specialty: string;
  software_used: string[];
  logo_storage_path: string | null;
  description: string | null;
  website: string | null;
  team_size_range: string | null;
  practice_doctors: PracticeDoctor[];
  accepts_general_candidate_messages: boolean;
};

export type PublicClinicPostings = {
  profile: PublicClinicProfile;
  jobs: LiveJobPost[];
  shifts: LiveShiftPost[];
};

const PUBLIC_CLINIC_SELECT =
  'id, clinic_name, city, province, address_line1, address_line2, postal_code, latitude, longitude, specialty, software_used, logo_storage_path, description, website, team_size_range, practice_doctors, accepts_general_candidate_messages, setup_completed_at' as const;

function mapPublicClinicProfile(row: {
  id: string;
  clinic_name: string;
  city: string | null;
  province: string;
  address_line1: string | null;
  address_line2: string | null;
  postal_code: string | null;
  latitude: number | null;
  longitude: number | null;
  specialty: string;
  software_used: string[] | null;
  logo_storage_path: string | null;
  description: string | null;
  website: string | null;
  team_size_range: string | null;
  practice_doctors: unknown;
  accepts_general_candidate_messages: boolean;
}): PublicClinicProfile {
  return {
    clinic_id: row.id,
    clinic_name: row.clinic_name,
    city: row.city,
    province: row.province,
    address_line1: row.address_line1 ?? null,
    address_line2: row.address_line2 ?? null,
    postal_code: row.postal_code ?? null,
    latitude: row.latitude ?? null,
    longitude: row.longitude ?? null,
    specialty: row.specialty,
    software_used: row.software_used ?? [],
    logo_storage_path: row.logo_storage_path ?? null,
    description: row.description,
    website: row.website,
    team_size_range: row.team_size_range,
    practice_doctors: normalizePracticeDoctors(row.practice_doctors),
    accepts_general_candidate_messages: row.accepts_general_candidate_messages,
  };
}

function toClinicSummary(profile: PublicClinicProfile): ClinicSummary {
  return {
    clinic_id: profile.clinic_id,
    clinic_name: profile.clinic_name,
    city: profile.city,
    province: profile.province,
    specialty: profile.specialty,
    software_used: profile.software_used,
    latitude: profile.latitude,
    longitude: profile.longitude,
    logo_storage_path: profile.logo_storage_path,
  };
}

export async function getPublicClinicProfile(
  clinicId: string,
): Promise<PublicClinicProfile | null> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('clinic_profiles')
    .select(PUBLIC_CLINIC_SELECT)
    .eq('id', clinicId)
    .not('setup_completed_at', 'is', null)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  return mapPublicClinicProfile(data);
}

export async function getPublicClinicPostings(
  clinicId: string,
): Promise<PublicClinicPostings | null> {
  const profile = await getPublicClinicProfile(clinicId);
  if (!profile) return null;

  const supabase = getSupabaseClient();
  const clinic = toClinicSummary(profile);
  const today = new Date().toISOString().slice(0, 10);

  const [jobsResult, shiftsResult] = await Promise.all([
    supabase
      .from('job_posts')
      .select('*')
      .eq('clinic_id', clinicId)
      .eq('status', 'live')
      .order('created_at', { ascending: false }),
    supabase
      .from('shift_posts')
      .select('*')
      .eq('clinic_id', clinicId)
      .eq('status', 'live')
      .gte('shift_date', today)
      .order('shift_date', { ascending: true }),
  ]);

  if (jobsResult.error) throw jobsResult.error;
  if (shiftsResult.error) throw shiftsResult.error;

  const planMap = await getClinicPlanMap([clinicId]);
  const hasPriorityListing = planMap.get(clinicId) === 'pro';

  const jobs = await Promise.all(
    ((jobsResult.data ?? []) as JobPost[]).map(async (job) => {
      const screeningQuestions: ScreeningQuestion[] = job.screening_enabled
        ? await getJobPostScreeningQuestions(job.id, { province: profile.province })
        : [];
      return {
        ...job,
        clinic,
        screening_questions: screeningQuestions,
        has_priority_listing: hasPriorityListing,
      } satisfies LiveJobPost;
    }),
  );

  const shifts = ((shiftsResult.data ?? []) as ShiftPost[]).map(
    (shift) =>
      ({
        ...shift,
        clinic,
        has_priority_listing: hasPriorityListing,
      }) satisfies LiveShiftPost,
  );

  return { profile, jobs, shifts };
}
