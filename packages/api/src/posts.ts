import type { RoleType } from '@chairside/config';
import { getSupabaseClient } from './client';

export type { RoleType } from '@chairside/config';
export type PostStatus = 'draft' | 'live' | 'filled' | 'closed';
export type EmploymentType = 'permanent' | 'part-time' | 'temp' | 'fill-in';
export type ShiftUrgency = 'normal' | 'urgent' | 'same_day';

export type JobPost = {
  id: string;
  clinic_id: string;
  role_type: RoleType;
  employment_type: EmploymentType;
  title: string;
  wage_range: string | null;
  schedule: string | null;
  description: string | null;
  required_qualifications: string[];
  preferred_qualifications: string[];
  specialty: string;
  software_used: string[];
  start_date: string | null;
  benefits: string | null;
  offerings: string[];
  status: PostStatus;
  created_at: string;
  updated_at: string;
};

export type ShiftPost = {
  id: string;
  clinic_id: string;
  role_type: RoleType;
  shift_date: string;
  start_time: string;
  end_time: string;
  compensation: string | null;
  urgency: ShiftUrgency;
  description: string | null;
  status: PostStatus;
  created_at: string;
  updated_at: string;
};

export type ClinicDashboardCounts = {
  openRoles: number;
  fillInsPosted: number;
  newApplications: number;
};

export type CreateJobPostInput = {
  role_type: RoleType;
  employment_type: EmploymentType;
  title: string;
  wage_range?: string;
  schedule?: string;
  description?: string;
  specialty?: string;
  software_used?: string[];
  start_date?: string;
  benefits?: string;
  offerings?: string[];
  status?: PostStatus;
};

export type CreateShiftPostInput = {
  role_type: RoleType;
  shift_date: string;
  start_time: string;
  end_time: string;
  compensation?: string;
  urgency?: ShiftUrgency;
  description?: string;
  status?: PostStatus;
};

export async function listJobPosts(clinicId: string): Promise<JobPost[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('job_posts')
    .select('*')
    .eq('clinic_id', clinicId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data ?? []) as JobPost[];
}

export async function listShiftPosts(clinicId: string): Promise<ShiftPost[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('shift_posts')
    .select('*')
    .eq('clinic_id', clinicId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data ?? []) as ShiftPost[];
}

export async function createJobPost(
  clinicId: string,
  input: CreateJobPostInput,
): Promise<JobPost> {
  const supabase = getSupabaseClient();
  const now = new Date().toISOString();

  let specialty = input.specialty;
  let softwareUsed = input.software_used;

  if (specialty === undefined || softwareUsed === undefined) {
    const { data: clinicProfile, error: profileError } = await supabase
      .from('clinic_profiles')
      .select('specialty, software_used')
      .eq('id', clinicId)
      .maybeSingle();

    if (profileError) throw profileError;

    if (specialty === undefined) {
      specialty = clinicProfile?.specialty ?? 'general';
    }
    if (softwareUsed === undefined) {
      softwareUsed = clinicProfile?.software_used ?? [];
    }
  }

  const { data, error } = await supabase
    .from('job_posts')
    .insert({
      clinic_id: clinicId,
      role_type: input.role_type,
      employment_type: input.employment_type,
      title: input.title,
      wage_range: input.wage_range ?? null,
      schedule: input.schedule ?? null,
      description: input.description ?? null,
      specialty,
      software_used: softwareUsed,
      start_date: input.start_date ?? null,
      benefits: input.benefits ?? null,
      offerings: input.offerings ?? [],
      status: input.status ?? 'live',
      updated_at: now,
    })
    .select('*')
    .single();

  if (error) throw error;
  return data as JobPost;
}

export async function createShiftPost(
  clinicId: string,
  input: CreateShiftPostInput,
): Promise<ShiftPost> {
  const supabase = getSupabaseClient();
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from('shift_posts')
    .insert({
      clinic_id: clinicId,
      role_type: input.role_type,
      shift_date: input.shift_date,
      start_time: input.start_time,
      end_time: input.end_time,
      compensation: input.compensation ?? null,
      urgency: input.urgency ?? 'normal',
      description: input.description ?? null,
      status: input.status ?? 'live',
      updated_at: now,
    })
    .select('*')
    .single();

  if (error) throw error;
  return data as ShiftPost;
}

export async function getClinicDashboardCounts(clinicId: string): Promise<ClinicDashboardCounts> {
  const supabase = getSupabaseClient();

  const [jobsResult, shiftsResult, applicationsResult] = await Promise.all([
    supabase
      .from('job_posts')
      .select('id', { count: 'exact', head: true })
      .eq('clinic_id', clinicId)
      .eq('status', 'live'),
    supabase
      .from('shift_posts')
      .select('id', { count: 'exact', head: true })
      .eq('clinic_id', clinicId)
      .eq('status', 'live'),
    supabase.from('applications').select('id, job_post_id, shift_post_id, status'),
  ]);

  if (jobsResult.error) throw jobsResult.error;
  if (shiftsResult.error) throw shiftsResult.error;
  if (applicationsResult.error) throw applicationsResult.error;

  const jobIds = new Set(
    (
      await supabase.from('job_posts').select('id').eq('clinic_id', clinicId)
    ).data?.map((row) => row.id) ?? [],
  );
  const shiftIds = new Set(
    (
      await supabase.from('shift_posts').select('id').eq('clinic_id', clinicId)
    ).data?.map((row) => row.id) ?? [],
  );

  const newApplications =
    applicationsResult.data?.filter((application) => {
      if (application.status !== 'applied') return false;
      if (application.job_post_id && jobIds.has(application.job_post_id)) return true;
      if (application.shift_post_id && shiftIds.has(application.shift_post_id)) return true;
      return false;
    }).length ?? 0;

  return {
    openRoles: jobsResult.count ?? 0,
    fillInsPosted: shiftsResult.count ?? 0,
    newApplications,
  };
}
