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
  created_at: string;
  updated_at: string;
};

export type ClinicApplication = Application & {
  post_title: string;
  post_type: 'job' | 'shift';
  role_type: string;
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
    if (row.job_post_id && jobMap.has(row.job_post_id)) {
      const job = jobMap.get(row.job_post_id)!;
      applications.push({
        ...(row as Application),
        post_title: job.title,
        post_type: 'job',
        role_type: job.role_type,
      });
    } else if (row.shift_post_id && shiftMap.has(row.shift_post_id)) {
      const shift = shiftMap.get(row.shift_post_id)!;
      applications.push({
        ...(row as Application),
        post_title: shift.title,
        post_type: 'shift',
        role_type: shift.role_type,
      });
    }
  }

  return applications;
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
