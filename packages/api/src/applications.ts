import { getSupabaseClient } from './client';

export type ApplicationStatus = 'applied' | 'reviewed' | 'rejected' | 'hired';

export type Application = {
  id: string;
  job_post_id: string | null;
  shift_post_id: string | null;
  worker_id: string;
  status: ApplicationStatus;
  match_score: number | null;
  cover_message: string | null;
  years_of_experience: number | null;
  education: string | null;
  role_type: string | null;
  license_type: string | null;
  resume_storage_path: string | null;
  worker_display_name: string | null;
  worker_address: string | null;
  worker_photo_storage_path: string | null;
  software_used: string[];
  practice_types: string[];
  created_at: string;
  updated_at: string;
};

export type ClinicApplication = Application & {
  post_title: string;
  post_type: 'job' | 'shift';
  post_role_type: string;
};

export type WorkerApplication = Application & {
  post_title: string;
  post_type: 'job' | 'shift';
  clinic_name: string;
  clinic_city: string | null;
};

export type CreateApplicationInput = {
  jobPostId?: string;
  shiftPostId?: string;
  coverMessage?: string;
};

export type JobApplicationSummary = {
  job_post_id: string;
  post_title: string;
  applicant_count: number;
  pending_count: number;
};

export async function listClinicApplications(clinicId: string): Promise<ClinicApplication[]> {
  const supabase = getSupabaseClient();

  const [jobsResult, shiftsResult] = await Promise.all([
    supabase.from('job_posts').select('id, title, role_type').eq('clinic_id', clinicId),
    supabase
      .from('shift_posts')
      .select('id, role_type, shift_date')
      .eq('clinic_id', clinicId),
  ]);

  if (jobsResult.error) throw jobsResult.error;
  if (shiftsResult.error) throw shiftsResult.error;

  const jobMap = new Map(
    (jobsResult.data ?? []).map((job) => [job.id, { title: job.title, role_type: job.role_type }]),
  );
  const shiftMap = new Map(
    (shiftsResult.data ?? []).map((shift) => [
      shift.id,
      { title: `Fill-in · ${shift.shift_date}`, role_type: shift.role_type },
    ]),
  );

  const postIds = [...jobMap.keys(), ...shiftMap.keys()];
  if (postIds.length === 0) return [];

  const { data, error } = await supabase
    .from('applications')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;

  const applications: ClinicApplication[] = [];

  for (const row of data ?? []) {
    const application = row as Application;

    if (row.job_post_id && jobMap.has(row.job_post_id)) {
      const job = jobMap.get(row.job_post_id)!;
      applications.push({
        ...application,
        post_title: job.title,
        post_type: 'job',
        post_role_type: job.role_type,
      });
    } else if (row.shift_post_id && shiftMap.has(row.shift_post_id)) {
      const shift = shiftMap.get(row.shift_post_id)!;
      applications.push({
        ...application,
        post_title: shift.title,
        post_type: 'shift',
        post_role_type: shift.role_type,
      });
    }
  }

  return applications;
}

export async function listWorkerApplications(workerId: string): Promise<WorkerApplication[]> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from('applications')
    .select('*')
    .eq('worker_id', workerId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  if (!data?.length) return [];

  const jobIds = data.map((row) => row.job_post_id).filter(Boolean) as string[];
  const shiftIds = data.map((row) => row.shift_post_id).filter(Boolean) as string[];

  const [jobsResult, shiftsResult] = await Promise.all([
    jobIds.length > 0
      ? supabase.from('job_posts').select('id, title, clinic_id').in('id', jobIds)
      : Promise.resolve({ data: [], error: null }),
    shiftIds.length > 0
      ? supabase.from('shift_posts').select('id, shift_date, clinic_id').in('id', shiftIds)
      : Promise.resolve({ data: [], error: null }),
  ]);

  if (jobsResult.error) throw jobsResult.error;
  if (shiftsResult.error) throw shiftsResult.error;

  const jobMap = new Map(
    (jobsResult.data ?? []).map((job) => [job.id, { title: job.title, clinic_id: job.clinic_id }]),
  );
  const shiftMap = new Map(
    (shiftsResult.data ?? []).map((shift) => [
      shift.id,
      { title: `Fill-in · ${shift.shift_date}`, clinic_id: shift.clinic_id },
    ]),
  );

  const clinicIds = [
    ...new Set([
      ...(jobsResult.data ?? []).map((job) => job.clinic_id),
      ...(shiftsResult.data ?? []).map((shift) => shift.clinic_id),
    ]),
  ];

  const { data: clinics, error: clinicsError } =
    clinicIds.length > 0
      ? await supabase
          .from('clinic_profiles')
          .select('id, clinic_name, city')
          .in('id', clinicIds)
      : { data: [], error: null };

  if (clinicsError) throw clinicsError;

  const clinicMap = new Map((clinics ?? []).map((clinic) => [clinic.id, clinic]));

  const applications: WorkerApplication[] = [];

  for (const row of data) {
    const application = row as Application;

    if (row.job_post_id && jobMap.has(row.job_post_id)) {
      const job = jobMap.get(row.job_post_id)!;
      const clinic = clinicMap.get(job.clinic_id);
      applications.push({
        ...application,
        post_title: job.title,
        post_type: 'job',
        clinic_name: clinic?.clinic_name ?? 'Clinic',
        clinic_city: clinic?.city ?? null,
      });
    } else if (row.shift_post_id && shiftMap.has(row.shift_post_id)) {
      const shift = shiftMap.get(row.shift_post_id)!;
      const clinic = clinicMap.get(shift.clinic_id);
      applications.push({
        ...application,
        post_title: shift.title,
        post_type: 'shift',
        clinic_name: clinic?.clinic_name ?? 'Clinic',
        clinic_city: clinic?.city ?? null,
      });
    }
  }

  return applications;
}

async function enrichWorkerApplication(application: Application): Promise<WorkerApplication | null> {
  const supabase = getSupabaseClient();

  if (application.job_post_id) {
    const { data: job, error: jobError } = await supabase
      .from('job_posts')
      .select('id, title, clinic_id')
      .eq('id', application.job_post_id)
      .maybeSingle();

    if (jobError) throw jobError;
    if (!job) return null;

    const { data: clinic, error: clinicError } = await supabase
      .from('clinic_profiles')
      .select('clinic_name, city')
      .eq('id', job.clinic_id)
      .maybeSingle();

    if (clinicError) throw clinicError;

    return {
      ...application,
      post_title: job.title,
      post_type: 'job',
      clinic_name: clinic?.clinic_name ?? 'Clinic',
      clinic_city: clinic?.city ?? null,
    };
  }

  if (application.shift_post_id) {
    const { data: shift, error: shiftError } = await supabase
      .from('shift_posts')
      .select('id, shift_date, clinic_id')
      .eq('id', application.shift_post_id)
      .maybeSingle();

    if (shiftError) throw shiftError;
    if (!shift) return null;

    const { data: clinic, error: clinicError } = await supabase
      .from('clinic_profiles')
      .select('clinic_name, city')
      .eq('id', shift.clinic_id)
      .maybeSingle();

    if (clinicError) throw clinicError;

    return {
      ...application,
      post_title: `Fill-in · ${shift.shift_date}`,
      post_type: 'shift',
      clinic_name: clinic?.clinic_name ?? 'Clinic',
      clinic_city: clinic?.city ?? null,
    };
  }

  return null;
}

export async function getWorkerApplication(
  workerId: string,
  applicationId: string,
): Promise<WorkerApplication | null> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('applications')
    .select('*')
    .eq('id', applicationId)
    .eq('worker_id', workerId)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  return enrichWorkerApplication(data as Application);
}

export async function deleteApplication(workerId: string, applicationId: string): Promise<void> {
  const supabase = getSupabaseClient();
  const { error } = await supabase
    .from('applications')
    .delete()
    .eq('id', applicationId)
    .eq('worker_id', workerId);

  if (error) throw error;
}

export async function listWorkerJobApplications(workerId: string): Promise<WorkerApplication[]> {
  const applications = await listWorkerApplications(workerId);
  return applications.filter((application) => application.post_type === 'job');
}

export async function listWorkerShiftApplications(workerId: string): Promise<WorkerApplication[]> {
  const applications = await listWorkerApplications(workerId);
  return applications.filter((application) => application.post_type === 'shift');
}

export async function listWorkerAppliedJobPostIds(workerId: string): Promise<string[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('applications')
    .select('job_post_id')
    .eq('worker_id', workerId)
    .not('job_post_id', 'is', null);

  if (error) throw error;
  return (data ?? []).map((row) => row.job_post_id).filter(Boolean) as string[];
}

export async function getJobPostApplicationCountsMap(
  clinicId: string,
): Promise<Record<string, number>> {
  const supabase = getSupabaseClient();
  const { data: jobs, error: jobsError } = await supabase
    .from('job_posts')
    .select('id')
    .eq('clinic_id', clinicId);

  if (jobsError) throw jobsError;

  const jobIds = (jobs ?? []).map((job) => job.id);
  if (jobIds.length === 0) return {};

  const { data: applications, error: applicationsError } = await supabase
    .from('applications')
    .select('job_post_id')
    .in('job_post_id', jobIds);

  if (applicationsError) throw applicationsError;

  const counts: Record<string, number> = {};
  for (const row of applications ?? []) {
    if (row.job_post_id) {
      counts[row.job_post_id] = (counts[row.job_post_id] ?? 0) + 1;
    }
  }
  return counts;
}

export async function listJobApplicationSummaries(
  clinicId: string,
): Promise<JobApplicationSummary[]> {
  const applications = await listClinicApplications(clinicId);
  const summaries = new Map<string, JobApplicationSummary>();

  for (const application of applications) {
    if (application.post_type !== 'job' || !application.job_post_id) continue;

    const existing = summaries.get(application.job_post_id);
    if (existing) {
      existing.applicant_count += 1;
      if (application.status === 'applied') {
        existing.pending_count += 1;
      }
    } else {
      summaries.set(application.job_post_id, {
        job_post_id: application.job_post_id,
        post_title: application.post_title,
        applicant_count: 1,
        pending_count: application.status === 'applied' ? 1 : 0,
      });
    }
  }

  return [...summaries.values()].sort((a, b) => {
    if (b.pending_count !== a.pending_count) {
      return b.pending_count - a.pending_count;
    }
    return b.applicant_count - a.applicant_count;
  });
}

export async function listClinicApplicationsForJob(
  clinicId: string,
  jobPostId: string,
): Promise<ClinicApplication[]> {
  const applications = await listClinicApplications(clinicId);
  return applications.filter(
    (application) => application.post_type === 'job' && application.job_post_id === jobPostId,
  );
}

export async function createApplication(
  workerId: string,
  input: CreateApplicationInput,
): Promise<Application> {
  const supabase = getSupabaseClient();
  const now = new Date().toISOString();

  if (!input.jobPostId && !input.shiftPostId) {
    throw new Error('Application requires a job or shift post');
  }
  if (input.jobPostId && input.shiftPostId) {
    throw new Error('Application cannot reference both job and shift posts');
  }

  const { data, error } = await supabase
    .from('applications')
    .insert({
      worker_id: workerId,
      job_post_id: input.jobPostId ?? null,
      shift_post_id: input.shiftPostId ?? null,
      cover_message: input.coverMessage?.trim() || null,
      status: 'applied',
      updated_at: now,
    })
    .select('*')
    .single();

  if (error) {
    if (error.code === '23505') {
      throw new Error('You have already applied to this posting.');
    }
    throw error;
  }
  return data as Application;
}

export async function hasAppliedToJob(workerId: string, jobPostId: string): Promise<boolean> {
  const supabase = getSupabaseClient();
  const { count, error } = await supabase
    .from('applications')
    .select('id', { count: 'exact', head: true })
    .eq('worker_id', workerId)
    .eq('job_post_id', jobPostId);

  if (error) throw error;
  return (count ?? 0) > 0;
}

export async function hasAppliedToShift(workerId: string, shiftPostId: string): Promise<boolean> {
  const supabase = getSupabaseClient();
  const { count, error } = await supabase
    .from('applications')
    .select('id', { count: 'exact', head: true })
    .eq('worker_id', workerId)
    .eq('shift_post_id', shiftPostId);

  if (error) throw error;
  return (count ?? 0) > 0;
}

export async function updateApplicationStatus(
  applicationId: string,
  status: ApplicationStatus,
): Promise<Application> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('applications')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', applicationId)
    .select('*')
    .single();

  if (error) throw error;
  return data as Application;
}
