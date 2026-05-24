import { getSupabaseClient } from './client';

export type ApplicationStatus =
  | 'applied'
  | 'reviewed'
  | 'shortlisted'
  | 'rejected'
  | 'hired';

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

export async function listWorkerJobApplications(workerId: string): Promise<WorkerApplication[]> {
  const applications = await listWorkerApplications(workerId);
  return applications.filter((application) => application.post_type === 'job');
}

export async function listWorkerShiftApplications(workerId: string): Promise<WorkerApplication[]> {
  const applications = await listWorkerApplications(workerId);
  return applications.filter((application) => application.post_type === 'shift');
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

  if (error) throw error;
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
