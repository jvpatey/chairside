import type { RoleType } from '@chairside/config';
import { isMatchableSoftware } from '@chairside/core';
import { getSupabaseClient } from './client';
import {
  getJobPostScreeningQuestions,
  replaceJobPostScreeningQuestions,
  type ScreeningQuestion,
  type ScreeningQuestionInput,
} from './screening';

export type { RoleType } from '@chairside/config';
export type JobPostStatus = 'live' | 'paused' | 'filled' | 'closed';
export type ShiftPostStatus = 'draft' | 'live' | 'filled' | 'closed';
/** @deprecated Use JobPostStatus or ShiftPostStatus */
export type PostStatus = ShiftPostStatus;
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
  screening_enabled: boolean;
  status: JobPostStatus;
  created_at: string;
  updated_at: string;
};

export type JobPostWithScreening = JobPost & {
  screening_questions: ScreeningQuestion[];
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
  status: ShiftPostStatus;
  created_at: string;
  updated_at: string;
};

export type ClinicDashboardCounts = {
  openRoles: number;
  fillInsPosted: number;
  /** Active role applications (excludes hidden and fill-in cover requests). */
  totalApplications: number;
  /** Unviewed role applications (status applied). */
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
  screening_enabled?: boolean;
  screeningQuestions?: ScreeningQuestionInput[];
  status?: JobPostStatus;
};

export type CreateShiftPostInput = {
  role_type: RoleType;
  shift_date: string;
  start_time: string;
  end_time: string;
  compensation?: string;
  urgency?: ShiftUrgency;
  description?: string;
  status?: ShiftPostStatus;
};

export type UpdateJobPostInput = Partial<CreateJobPostInput>;

export type UpdateShiftPostInput = Partial<CreateShiftPostInput>;

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

export async function getJobPost(clinicId: string, jobId: string): Promise<JobPost | null> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('job_posts')
    .select('*')
    .eq('id', jobId)
    .eq('clinic_id', clinicId)
    .maybeSingle();

  if (error) throw error;
  return data as JobPost | null;
}

export async function getJobPostWithScreening(
  clinicId: string,
  jobId: string,
): Promise<JobPostWithScreening | null> {
  const job = await getJobPost(clinicId, jobId);
  if (!job) return null;

  let screeningQuestions: ScreeningQuestion[] = [];
  if (job.screening_enabled) {
    const supabase = getSupabaseClient();
    const { data: clinic, error: clinicError } = await supabase
      .from('clinic_profiles')
      .select('province')
      .eq('id', clinicId)
      .maybeSingle();

    if (clinicError) throw clinicError;
    screeningQuestions = await getJobPostScreeningQuestions(jobId, {
      province: clinic?.province ?? null,
    });
  }

  return { ...job, screening_questions: screeningQuestions };
}

export async function updateJobPost(
  clinicId: string,
  jobId: string,
  input: UpdateJobPostInput,
): Promise<JobPost> {
  const supabase = getSupabaseClient();
  const now = new Date().toISOString();

  const patch: Record<string, unknown> = { updated_at: now };

  if (input.role_type !== undefined) patch.role_type = input.role_type;
  if (input.employment_type !== undefined) patch.employment_type = input.employment_type;
  if (input.title !== undefined) patch.title = input.title;
  if (input.wage_range !== undefined) patch.wage_range = input.wage_range || null;
  if (input.schedule !== undefined) patch.schedule = input.schedule || null;
  if (input.description !== undefined) patch.description = input.description || null;
  if (input.specialty !== undefined) patch.specialty = input.specialty;
  if (input.software_used !== undefined) patch.software_used = input.software_used;
  if (input.start_date !== undefined) patch.start_date = input.start_date || null;
  if (input.benefits !== undefined) patch.benefits = input.benefits || null;
  if (input.offerings !== undefined) patch.offerings = input.offerings;
  if (input.screening_enabled !== undefined) patch.screening_enabled = input.screening_enabled;
  if (input.status !== undefined) patch.status = input.status;

  const { data, error } = await supabase
    .from('job_posts')
    .update(patch)
    .eq('id', jobId)
    .eq('clinic_id', clinicId)
    .select('*')
    .single();

  if (error) throw error;

  if (input.screeningQuestions !== undefined || input.screening_enabled !== undefined) {
    const enabled = input.screening_enabled ?? (data as JobPost).screening_enabled;
    await replaceJobPostScreeningQuestions(
      clinicId,
      jobId,
      enabled,
      input.screeningQuestions ?? [],
    );
  }

  return data as JobPost;
}

export async function updateJobPostStatus(
  clinicId: string,
  jobId: string,
  status: JobPostStatus,
): Promise<JobPost> {
  return updateJobPost(clinicId, jobId, { status });
}

export async function deleteJobPost(clinicId: string, jobId: string): Promise<void> {
  const supabase = getSupabaseClient();
  const { error } = await supabase
    .from('job_posts')
    .delete()
    .eq('id', jobId)
    .eq('clinic_id', clinicId);

  if (error) throw error;
}

export async function getJobPostApplicationCount(clinicId: string, jobId: string): Promise<number> {
  const supabase = getSupabaseClient();

  const { data: job, error: jobError } = await supabase
    .from('job_posts')
    .select('id')
    .eq('id', jobId)
    .eq('clinic_id', clinicId)
    .maybeSingle();

  if (jobError) throw jobError;
  if (!job) return 0;

  const { count, error } = await supabase
    .from('applications')
    .select('id', { count: 'exact', head: true })
    .eq('job_post_id', jobId);

  if (error) throw error;
  return count ?? 0;
}

export async function createJobPost(clinicId: string, input: CreateJobPostInput): Promise<JobPost> {
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
      softwareUsed = (clinicProfile?.software_used ?? []).filter(isMatchableSoftware);
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
      screening_enabled: input.screening_enabled ?? false,
      status: input.status ?? 'live',
      updated_at: now,
    })
    .select('*')
    .single();

  if (error) throw error;

  const job = data as JobPost;
  if (input.screening_enabled && input.screeningQuestions?.length) {
    await replaceJobPostScreeningQuestions(clinicId, job.id, true, input.screeningQuestions);
  }

  return job;
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

export async function getShiftPost(clinicId: string, shiftId: string): Promise<ShiftPost | null> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('shift_posts')
    .select('*')
    .eq('id', shiftId)
    .eq('clinic_id', clinicId)
    .maybeSingle();

  if (error) throw error;
  return data as ShiftPost | null;
}

export async function updateShiftPost(
  clinicId: string,
  shiftId: string,
  input: UpdateShiftPostInput,
): Promise<ShiftPost> {
  const supabase = getSupabaseClient();
  const now = new Date().toISOString();

  const patch: Record<string, unknown> = { updated_at: now };

  if (input.role_type !== undefined) patch.role_type = input.role_type;
  if (input.shift_date !== undefined) patch.shift_date = input.shift_date;
  if (input.start_time !== undefined) patch.start_time = input.start_time;
  if (input.end_time !== undefined) patch.end_time = input.end_time;
  if (input.compensation !== undefined) patch.compensation = input.compensation || null;
  if (input.urgency !== undefined) patch.urgency = input.urgency;
  if (input.description !== undefined) patch.description = input.description || null;
  if (input.status !== undefined) patch.status = input.status;

  const { data, error } = await supabase
    .from('shift_posts')
    .update(patch)
    .eq('id', shiftId)
    .eq('clinic_id', clinicId)
    .select('*')
    .single();

  if (error) throw error;
  return data as ShiftPost;
}

export async function updateShiftPostStatus(
  clinicId: string,
  shiftId: string,
  status: ShiftPostStatus,
): Promise<ShiftPost> {
  return updateShiftPost(clinicId, shiftId, { status });
}

export async function deleteShiftPost(clinicId: string, shiftId: string): Promise<void> {
  const supabase = getSupabaseClient();
  const { error } = await supabase
    .from('shift_posts')
    .delete()
    .eq('id', shiftId)
    .eq('clinic_id', clinicId);

  if (error) throw error;
}

export async function getShiftPostApplicationCount(
  clinicId: string,
  shiftId: string,
): Promise<number> {
  const supabase = getSupabaseClient();

  const { data: shift, error: shiftError } = await supabase
    .from('shift_posts')
    .select('id')
    .eq('id', shiftId)
    .eq('clinic_id', clinicId)
    .maybeSingle();

  if (shiftError) throw shiftError;
  if (!shift) return 0;

  const { count, error } = await supabase
    .from('applications')
    .select('id', { count: 'exact', head: true })
    .eq('shift_post_id', shiftId);

  if (error) throw error;
  return count ?? 0;
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
      .eq('status', 'live')
      .gte('shift_date', new Date().toISOString().slice(0, 10)),
    supabase
      .from('applications')
      .select('id, job_post_id, status, clinic_hidden_at')
      .not('job_post_id', 'is', null)
      .is('clinic_hidden_at', null),
  ]);

  if (jobsResult.error) throw jobsResult.error;
  if (shiftsResult.error) throw shiftsResult.error;
  if (applicationsResult.error) throw applicationsResult.error;

  const jobIds = new Set(
    (await supabase.from('job_posts').select('id').eq('clinic_id', clinicId)).data?.map(
      (row) => row.id,
    ) ?? [],
  );

  const clinicApplications =
    applicationsResult.data?.filter(
      (application) =>
        application.job_post_id != null && jobIds.has(application.job_post_id),
    ) ?? [];

  const totalApplications = clinicApplications.length;
  const newApplications = clinicApplications.filter(
    (application) => application.status === 'applied',
  ).length;

  return {
    openRoles: jobsResult.count ?? 0,
    fillInsPosted: shiftsResult.count ?? 0,
    totalApplications,
    newApplications,
  };
}

export type ClinicSummary = {
  clinic_id: string;
  clinic_name: string;
  city: string | null;
  province: string;
  specialty: string;
  software_used: string[];
  latitude: number | null;
  longitude: number | null;
  logo_storage_path: string | null;
};

export type LiveJobPost = JobPost & {
  clinic: ClinicSummary;
  screening_questions: ScreeningQuestion[];
};

export type LiveShiftPost = ShiftPost & {
  clinic: ClinicSummary;
};

export type WorkerAppliedShiftClinic = ClinicSummary & {
  address_line1: string | null;
  address_line2: string | null;
  postal_code: string | null;
  phone: string | null;
  contact_name: string | null;
  website: string | null;
  team_size_range: string | null;
};

export type WorkerAppliedShiftPost = ShiftPost & {
  clinic: WorkerAppliedShiftClinic;
};

export type WorkerDashboardCounts = {
  openRolesInProvince: number;
  openFillInsInProvince: number;
  pendingApplications: number;
};

async function listClinicSummariesInProvince(
  province: string,
): Promise<Map<string, ClinicSummary>> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('clinic_profiles')
    .select(
      'id, clinic_name, city, province, specialty, software_used, latitude, longitude, logo_storage_path',
    )
    .eq('province', province);

  if (error) throw error;

  return new Map(
    (data ?? []).map((row) => [
      row.id,
      {
        clinic_id: row.id,
        clinic_name: row.clinic_name,
        city: row.city,
        province: row.province,
        specialty: row.specialty,
        software_used: row.software_used ?? [],
        latitude: row.latitude,
        longitude: row.longitude,
        logo_storage_path: row.logo_storage_path ?? null,
      },
    ]),
  );
}

function attachClinic<T extends { clinic_id: string }>(
  posts: T[],
  clinicMap: Map<string, ClinicSummary>,
): Array<T & { clinic: ClinicSummary }> {
  return posts
    .map((post) => {
      const clinic = clinicMap.get(post.clinic_id);
      if (!clinic) return null;
      return { ...post, clinic };
    })
    .filter((post): post is T & { clinic: ClinicSummary } => post != null);
}

export async function listLiveJobPosts(province: string): Promise<LiveJobPost[]> {
  const supabase = getSupabaseClient();
  const clinicMap = await listClinicSummariesInProvince(province);
  const clinicIds = [...clinicMap.keys()];
  if (clinicIds.length === 0) return [];

  const { data, error } = await supabase
    .from('job_posts')
    .select('*')
    .eq('status', 'live')
    .in('clinic_id', clinicIds)
    .order('created_at', { ascending: false });

  if (error) throw error;
  const posts = attachClinic((data ?? []) as JobPost[], clinicMap);
  return posts.map((post) => ({ ...post, screening_questions: [] }));
}

export async function listLiveShiftPosts(province: string): Promise<LiveShiftPost[]> {
  const supabase = getSupabaseClient();
  const clinicMap = await listClinicSummariesInProvince(province);
  const clinicIds = [...clinicMap.keys()];
  if (clinicIds.length === 0) return [];

  const today = new Date().toISOString().slice(0, 10);

  const { data, error } = await supabase
    .from('shift_posts')
    .select('*')
    .eq('status', 'live')
    .in('clinic_id', clinicIds)
    .gte('shift_date', today)
    .order('shift_date', { ascending: true });

  if (error) throw error;
  return attachClinic((data ?? []) as ShiftPost[], clinicMap);
}

function shiftWeekday(shiftDate: string): number {
  const date = new Date(`${shiftDate}T12:00:00`);
  return date.getDay();
}

/** Live shifts matching worker role and availability weekdays (mirrors notify fill-in recipient logic). */
export async function getMatchingLiveShiftPosts(
  province: string,
  roleType: string | null,
  availabilityDaySet: number[],
): Promise<LiveShiftPost[]> {
  if (!roleType || availabilityDaySet.length === 0) {
    return [];
  }

  const daySet = new Set(availabilityDaySet);
  const liveShifts = await listLiveShiftPosts(province);
  return liveShifts.filter((shift) => {
    if (shift.role_type !== roleType) return false;
    return daySet.has(shiftWeekday(shift.shift_date));
  });
}

export async function getLiveJobPost(jobId: string): Promise<LiveJobPost | null> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('job_posts')
    .select('*')
    .eq('id', jobId)
    .eq('status', 'live')
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  const { data: clinic, error: clinicError } = await supabase
    .from('clinic_profiles')
    .select(
      'id, clinic_name, city, province, specialty, software_used, latitude, longitude, logo_storage_path',
    )
    .eq('id', data.clinic_id)
    .maybeSingle();

  if (clinicError) throw clinicError;
  if (!clinic) return null;

  const screeningQuestions = (data as JobPost).screening_enabled
    ? await getJobPostScreeningQuestions(jobId, { province: clinic.province })
    : [];

  return {
    ...(data as JobPost),
    clinic: {
      clinic_id: clinic.id,
      clinic_name: clinic.clinic_name,
      city: clinic.city,
      province: clinic.province,
      specialty: clinic.specialty,
      software_used: clinic.software_used ?? [],
      latitude: clinic.latitude,
      longitude: clinic.longitude,
      logo_storage_path: clinic.logo_storage_path ?? null,
    },
    screening_questions: screeningQuestions,
  };
}

export async function getLiveShiftPost(shiftId: string): Promise<LiveShiftPost | null> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('shift_posts')
    .select('*')
    .eq('id', shiftId)
    .eq('status', 'live')
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  const { data: clinic, error: clinicError } = await supabase
    .from('clinic_profiles')
    .select(
      'id, clinic_name, city, province, specialty, software_used, latitude, longitude, logo_storage_path',
    )
    .eq('id', data.clinic_id)
    .maybeSingle();

  if (clinicError) throw clinicError;
  if (!clinic) return null;

  return {
    ...(data as ShiftPost),
    clinic: {
      clinic_id: clinic.id,
      clinic_name: clinic.clinic_name,
      city: clinic.city,
      province: clinic.province,
      specialty: clinic.specialty,
      software_used: clinic.software_used ?? [],
      latitude: clinic.latitude,
      longitude: clinic.longitude,
      logo_storage_path: clinic.logo_storage_path ?? null,
    },
  };
}

export async function getWorkerAppliedShiftPost(
  shiftId: string,
): Promise<WorkerAppliedShiftPost | null> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('shift_posts')
    .select('*')
    .eq('id', shiftId)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  const { data: clinic, error: clinicError } = await supabase
    .from('clinic_profiles')
    .select(
      'id, clinic_name, city, province, specialty, software_used, latitude, longitude, logo_storage_path, address_line1, address_line2, postal_code, phone, contact_name, website, team_size_range',
    )
    .eq('id', data.clinic_id)
    .maybeSingle();

  if (clinicError) throw clinicError;
  if (!clinic) return null;

  return {
    ...(data as ShiftPost),
    clinic: {
      clinic_id: clinic.id,
      clinic_name: clinic.clinic_name,
      city: clinic.city,
      province: clinic.province,
      specialty: clinic.specialty,
      software_used: clinic.software_used ?? [],
      latitude: clinic.latitude,
      longitude: clinic.longitude,
      logo_storage_path: clinic.logo_storage_path ?? null,
      address_line1: clinic.address_line1 ?? null,
      address_line2: clinic.address_line2 ?? null,
      postal_code: clinic.postal_code ?? null,
      phone: clinic.phone ?? null,
      contact_name: clinic.contact_name ?? null,
      website: clinic.website ?? null,
      team_size_range: clinic.team_size_range ?? null,
    },
  };
}

export async function getWorkerDashboardCounts(
  workerId: string,
  province: string,
): Promise<WorkerDashboardCounts> {
  const [jobs, shifts, applicationsResult] = await Promise.all([
    listLiveJobPosts(province),
    listLiveShiftPosts(province),
    getSupabaseClient()
      .from('applications')
      .select('id, status, job_post_id, shift_post_id')
      .eq('worker_id', workerId),
  ]);

  if (applicationsResult.error) throw applicationsResult.error;

  const pendingApplications =
    applicationsResult.data?.filter(
      (row) => row.job_post_id && ['applied', 'reviewed', 'in_progress'].includes(row.status),
    ).length ?? 0;

  return {
    openRolesInProvince: jobs.length,
    openFillInsInProvince: shifts.length,
    pendingApplications,
  };
}
