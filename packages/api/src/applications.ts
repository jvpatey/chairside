import { getSupabaseClient } from './client';
import { throwWithMessage } from './errors';
import { DELETED_CANDIDATE_LABEL, DELETED_CLINIC_LABEL } from '@chairside/config';
import {
  APPLICATION_UPDATE_GRACE_MS,
  FILL_IN_PENDING_STATUSES,
  hasWorkerApplicationClinicUpdate,
  isClinicApplicationUnseen,
  isClinicNewApplication,
  isClinicNewFillInRequest,
  isWorkerApplicationUpdateHighlighted,
  isWorkerApplicationUpdateUnseen,
} from './applicationNotificationPredicates';

export {
  APPLICATION_UPDATE_GRACE_MS,
  FILL_IN_PENDING_STATUSES,
  hasWorkerApplicationClinicUpdate,
  isClinicApplicationUnseen,
  isClinicNewApplication,
  isClinicNewFillInRequest,
  isWorkerApplicationUpdateHighlighted,
  isWorkerApplicationUpdateUnseen,
};
import {
  getApplicationScreening,
  getApplicationScreeningMap,
  insertApplicationScreening,
  type ApplicationScreening,
  type ScreeningSubmissionInput,
} from './screening';
import { listJobPosts } from './posts';

export type ApplicationStatus =
  | 'screening_submitted'
  | 'applied'
  | 'reviewed'
  | 'in_progress'
  | 'interview_offered'
  | 'interview_scheduled'
  | 'selected'
  | 'rejected'
  | 'hired';

/** Non-terminal statuses where the worker may still withdraw. */
export const ACTIVE_APPLICATION_STATUSES: ApplicationStatus[] = [
  'screening_submitted',
  'applied',
  'reviewed',
  'in_progress',
  'interview_offered',
  'interview_scheduled',
];

/** Pending cover requests that block submitting another request for the same shift. */
export const ACTIVE_SHIFT_COVER_STATUSES: ApplicationStatus[] = [
  'applied',
  'reviewed',
  'in_progress',
  'interview_offered',
  'interview_scheduled',
];

export type ScheduleApplicationInterviewInput = {
  interviewAt: string;
  durationMinutes: number;
  details?: string | null;
};

export type Application = {
  id: string;
  job_post_id: string | null;
  shift_post_id: string | null;
  worker_id: string;
  status: ApplicationStatus;
  /** @deprecated Use match_tier for open roles. */
  match_score: number | null;
  match_tier: 'strong' | 'good' | 'partial' | 'none' | null;
  match_breakdown: import('@chairside/core').StoredJobMatchBreakdown | null;
  cover_message: string | null;
  years_of_experience: number | null;
  education: string | null;
  role_type: string | null;
  role_types: string[];
  license_type: string | null;
  resume_storage_path: string | null;
  worker_display_name: string | null;
  worker_address: string | null;
  worker_photo_storage_path: string | null;
  software_used: string[];
  practice_types: string[];
  preferred_employment_types: string[];
  interview_at: string | null;
  interview_duration_minutes: number | null;
  interview_details: string | null;
  interview_proposed_at: string | null;
  interview_proposed_duration_minutes: number | null;
  interview_proposed_details: string | null;
  interview_proposed_by: 'clinic' | 'worker' | null;
  interview_offer_closed_by: 'clinic' | 'worker' | null;
  status_note: string | null;
  status_closed_by: 'clinic' | 'worker' | null;
  worker_hidden_at: string | null;
  clinic_hidden_at: string | null;
  clinic_name: string | null;
  clinic_city: string | null;
  clinic_province: string | null;
  clinic_logo_storage_path: string | null;
  worker_account_deleted_at: string | null;
  clinic_account_deleted_at: string | null;
  application_kit_requested_at: string | null;
  application_kit_submitted_at: string | null;
  worker_attention_at: string;
  worker_last_seen_at: string | null;
  clinic_attention_at: string;
  clinic_last_seen_at: string | null;
  created_at: string;
  updated_at: string;
};

import type { ClinicWorkerCrmRecord } from './clinicWorkerCrm';
import { attachClinicCrmToApplications } from './clinicWorkerCrm';

export type ClinicApplication = Application & {
  post_title: string;
  post_type: 'job' | 'shift';
  post_role_type: string;
  worker_account_deleted: boolean;
  screening: ApplicationScreening | null;
  clinic_crm: ClinicWorkerCrmRecord | null;
};

export type WorkerApplication = Application & {
  post_title: string;
  post_type: 'job' | 'shift';
  post_status?: string | null;
  post_role_type?: string | null;
  shift_date?: string | null;
  shift_start_time?: string | null;
  shift_end_time?: string | null;
  clinic_id: string | null;
  clinic_name: string;
  clinic_city: string | null;
  clinic_province?: string | null;
  clinic_address?: string | null;
  clinic_location?: string | null;
  clinic_latitude?: number | null;
  clinic_longitude?: number | null;
  clinic_logo_storage_path: string | null;
  clinic_account_deleted: boolean;
  screening: ApplicationScreening | null;
};

function formatWorkerClinicLocation(
  clinic:
    | {
        address_line1?: string | null;
        city?: string | null;
        province?: string | null;
      }
    | null
    | undefined,
): string | null {
  if (!clinic) return null;

  const parts = [
    clinic.address_line1?.trim(),
    [clinic.city?.trim(), clinic.province?.trim()].filter(Boolean).join(', '),
  ].filter(Boolean);

  return parts.length > 0 ? parts.join(' · ') : null;
}

export function getApplicantDisplayName(
  application: Pick<Application, 'worker_display_name' | 'worker_account_deleted_at'>,
): string {
  if (application.worker_account_deleted_at) {
    return DELETED_CANDIDATE_LABEL;
  }
  return application.worker_display_name?.trim() || 'Applicant';
}

function resolveWorkerClinicFields(
  application: Application,
  clinic?: {
    clinic_name?: string | null;
    city?: string | null;
    province?: string | null;
    address_line1?: string | null;
    logo_storage_path?: string | null;
    latitude?: number | null;
    longitude?: number | null;
  } | null,
): Pick<
  WorkerApplication,
  | 'clinic_name'
  | 'clinic_city'
  | 'clinic_province'
  | 'clinic_address'
  | 'clinic_location'
  | 'clinic_latitude'
  | 'clinic_longitude'
  | 'clinic_logo_storage_path'
  | 'clinic_account_deleted'
> {
  const clinicDeleted = Boolean(application.clinic_account_deleted_at);

  if (clinicDeleted) {
    return {
      clinic_name: DELETED_CLINIC_LABEL,
      clinic_city: application.clinic_city ?? null,
      clinic_province: application.clinic_province ?? null,
      clinic_address: null,
      clinic_location:
        [application.clinic_city, application.clinic_province].filter(Boolean).join(', ') || null,
      clinic_latitude: null,
      clinic_longitude: null,
      clinic_logo_storage_path: null,
      clinic_account_deleted: true,
    };
  }

  return {
    clinic_name: clinic?.clinic_name ?? application.clinic_name ?? 'Clinic',
    clinic_city: clinic?.city ?? application.clinic_city ?? null,
    clinic_province: clinic?.province ?? application.clinic_province ?? null,
    clinic_address: clinic?.address_line1 ?? null,
    clinic_location: formatWorkerClinicLocation(clinic),
    clinic_latitude: clinic?.latitude ?? null,
    clinic_longitude: clinic?.longitude ?? null,
    clinic_logo_storage_path:
      clinic?.logo_storage_path ?? application.clinic_logo_storage_path ?? null,
    clinic_account_deleted: false,
  };
}

export function isApplicationCounterpartDeleted(
  application: Pick<Application, 'worker_account_deleted_at' | 'clinic_account_deleted_at'>,
  role: 'worker' | 'clinic',
): boolean {
  return role === 'worker'
    ? Boolean(application.clinic_account_deleted_at)
    : Boolean(application.worker_account_deleted_at);
}

export function scrubApplicationPii(application: Application): Application {
  if (!application.worker_account_deleted_at && !application.clinic_account_deleted_at) {
    return application;
  }

  const scrubbed: Application = { ...application };

  if (application.worker_account_deleted_at) {
    scrubbed.worker_display_name = null;
    scrubbed.cover_message = null;
    scrubbed.education = null;
    scrubbed.years_of_experience = null;
    scrubbed.license_type = null;
    scrubbed.worker_address = null;
    scrubbed.resume_storage_path = null;
    scrubbed.worker_photo_storage_path = null;
    scrubbed.software_used = [];
    scrubbed.practice_types = [];
    scrubbed.preferred_employment_types = [];
    scrubbed.interview_details = null;
    scrubbed.interview_proposed_details = null;
  }

  if (application.clinic_account_deleted_at) {
    scrubbed.clinic_logo_storage_path = null;
  }

  return scrubbed;
}

function scrubClinicApplicationScreening(
  application: Application,
  screening: ApplicationScreening | null,
): ApplicationScreening | null {
  if (application.worker_account_deleted_at) return null;
  return screening;
}

export type CreateApplicationInput = {
  jobPostId?: string;
  shiftPostId?: string;
  coverMessage?: string;
  /** When true, creates a screening-stage application without the full application kit. */
  screeningOnly?: boolean;
  screening?: ScreeningSubmissionInput;
};

export type JobApplicationSummary = {
  job_post_id: string;
  post_title: string;
  post_created_at: string | null;
  applicant_count: number;
  screening_count: number;
  pending_count: number;
  /** Unseen applicants still needing clinic attention (applied or screening_submitted). */
  unseen_count: number;
  shortlisted_count: number;
  interview_count: number;
};

export const SCREENING_STAGE_STATUSES: ApplicationStatus[] = ['screening_submitted'];

export type FillInCoverRequest = ClinicApplication & {
  shift_date: string;
  shift_start_time: string | null;
  shift_end_time: string | null;
};

export type ConfirmedFillInSummary = {
  applicationId: string;
  shiftPostId: string;
  workerName: string;
  workerPhotoStoragePath: string | null;
  postTitle: string;
  shiftDate: string;
  startTime: string | null;
  endTime: string | null;
};

function isFillInPendingStatus(status: ApplicationStatus): boolean {
  return FILL_IN_PENDING_STATUSES.includes(status);
}

export type ApplicationListVisibility = 'active' | 'archived';

export async function listClinicApplications(
  clinicId: string,
  visibility: ApplicationListVisibility = 'active',
): Promise<ClinicApplication[]> {
  const supabase = getSupabaseClient();

  const [jobsResult, shiftsResult] = await Promise.all([
    supabase.from('job_posts').select('id, title, role_type').eq('clinic_id', clinicId),
    supabase.from('shift_posts').select('id, role_type, shift_date').eq('clinic_id', clinicId),
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

  const applicationIds = (data ?? []).map((row) => row.id);
  const screeningMap = await getApplicationScreeningMap(applicationIds);

  const applications: ClinicApplication[] = [];

  for (const row of data ?? []) {
    const application = scrubApplicationPii(row as Application);
    const isArchived = Boolean(application.clinic_hidden_at);
    if (visibility === 'active' && isArchived) continue;
    if (visibility === 'archived' && !isArchived) continue;
    const screening = scrubClinicApplicationScreening(
      application,
      screeningMap.get(row.id) ?? null,
    );

    if (row.job_post_id && jobMap.has(row.job_post_id)) {
      const job = jobMap.get(row.job_post_id)!;
      applications.push({
        ...application,
        post_title: job.title,
        post_type: 'job',
        post_role_type: job.role_type,
        worker_account_deleted: Boolean(application.worker_account_deleted_at),
        screening,
        clinic_crm: null,
      });
    } else if (row.shift_post_id && shiftMap.has(row.shift_post_id)) {
      const shift = shiftMap.get(row.shift_post_id)!;
      applications.push({
        ...application,
        post_title: shift.title,
        post_type: 'shift',
        post_role_type: shift.role_type,
        worker_account_deleted: Boolean(application.worker_account_deleted_at),
        screening,
        clinic_crm: null,
      });
    }
  }

  return attachClinicCrmToApplications(clinicId, applications);
}

export async function listWorkerApplications(
  workerId: string,
  visibility: ApplicationListVisibility = 'active',
): Promise<WorkerApplication[]> {
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
      ? supabase.from('job_posts').select('id, title, clinic_id, status').in('id', jobIds)
      : Promise.resolve({ data: [], error: null }),
    shiftIds.length > 0
      ? supabase
          .from('shift_posts')
          .select('id, role_type, shift_date, start_time, end_time, clinic_id, status')
          .in('id', shiftIds)
      : Promise.resolve({ data: [], error: null }),
  ]);

  if (jobsResult.error) throw jobsResult.error;
  if (shiftsResult.error) throw shiftsResult.error;

  const jobMap = new Map(
    (jobsResult.data ?? []).map((job) => [
      job.id,
      { title: job.title, clinic_id: job.clinic_id, status: job.status },
    ]),
  );
  const shiftMap = new Map(
    (shiftsResult.data ?? []).map((shift) => [
      shift.id,
      {
        title: `Fill-in · ${shift.shift_date}`,
        clinic_id: shift.clinic_id,
        status: shift.status,
        role_type: shift.role_type,
        shift_date: shift.shift_date,
        start_time: shift.start_time,
        end_time: shift.end_time,
      },
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
          .select('id, clinic_name, city, province, address_line1, logo_storage_path, latitude, longitude')
          .in('id', clinicIds)
      : { data: [], error: null };

  if (clinicsError) throw clinicsError;

  const clinicMap = new Map((clinics ?? []).map((clinic) => [clinic.id, clinic]));
  const applicationIds = data.map((row) => row.id);
  const screeningMap = await getApplicationScreeningMap(applicationIds);

  const applications: WorkerApplication[] = [];

  for (const row of data) {
    const application = scrubApplicationPii(row as Application);
    const isArchived = Boolean(application.worker_hidden_at);
    if (visibility === 'active' && isArchived) continue;
    if (visibility === 'archived' && !isArchived) continue;
    const screening = scrubClinicApplicationScreening(
      application,
      screeningMap.get(row.id) ?? null,
    );

    if (row.job_post_id && jobMap.has(row.job_post_id)) {
      const job = jobMap.get(row.job_post_id)!;
      const clinic = clinicMap.get(job.clinic_id);
      const clinicFields = resolveWorkerClinicFields(application, clinic);
      applications.push({
        ...application,
        post_title: job.title,
        post_type: 'job',
        post_status: job.status,
        clinic_id: job.clinic_id,
        ...clinicFields,
        screening,
      });
    } else if (row.shift_post_id && shiftMap.has(row.shift_post_id)) {
      const shift = shiftMap.get(row.shift_post_id)!;
      const clinic = clinicMap.get(shift.clinic_id);
      const clinicFields = resolveWorkerClinicFields(application, clinic);
      applications.push({
        ...application,
        post_title: shift.title,
        post_type: 'shift',
        post_status: shift.status,
        post_role_type: shift.role_type,
        shift_date: shift.shift_date,
        shift_start_time: shift.start_time,
        shift_end_time: shift.end_time,
        clinic_id: shift.clinic_id,
        ...clinicFields,
        screening: null,
      });
    }
  }

  return applications;
}

async function enrichWorkerApplication(
  raw: Application,
): Promise<WorkerApplication | null> {
  const application = scrubApplicationPii(raw);
  const supabase = getSupabaseClient();
  const screening =
    application.job_post_id != null && !application.worker_account_deleted_at
      ? await getApplicationScreening(application.id)
      : null;

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
      .select('clinic_name, city, province, address_line1, logo_storage_path, latitude, longitude')
      .eq('id', job.clinic_id)
      .maybeSingle();

    if (clinicError) throw clinicError;

    return {
      ...application,
      post_title: job.title,
      post_type: 'job',
      clinic_id: job.clinic_id,
      ...resolveWorkerClinicFields(application, clinic),
      screening,
    };
  }

  if (application.shift_post_id) {
    const { data: shift, error: shiftError } = await supabase
      .from('shift_posts')
      .select('id, role_type, shift_date, start_time, end_time, clinic_id')
      .eq('id', application.shift_post_id)
      .maybeSingle();

    if (shiftError) throw shiftError;
    if (!shift) return null;

    const { data: clinic, error: clinicError } = await supabase
      .from('clinic_profiles')
      .select('clinic_name, city, province, address_line1, logo_storage_path, latitude, longitude')
      .eq('id', shift.clinic_id)
      .maybeSingle();

    if (clinicError) throw clinicError;

    return {
      ...application,
      post_title: `Fill-in · ${shift.shift_date}`,
      post_type: 'shift',
      post_role_type: shift.role_type,
      shift_date: shift.shift_date,
      shift_start_time: shift.start_time,
      shift_end_time: shift.end_time,
      clinic_id: shift.clinic_id,
      ...resolveWorkerClinicFields(application, clinic),
      screening: null,
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

async function getWorkerShiftApplicationRecord(
  workerId: string,
  shiftPostId: string,
): Promise<Application | null> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('applications')
    .select('*')
    .eq('worker_id', workerId)
    .eq('shift_post_id', shiftPostId)
    .maybeSingle();

  if (error) throw error;
  return data as Application | null;
}

export async function getWorkerShiftApplication(
  workerId: string,
  shiftPostId: string,
): Promise<WorkerApplication | null> {
  const data = await getWorkerShiftApplicationRecord(workerId, shiftPostId);
  if (!data) return null;

  return enrichWorkerApplication(data);
}

export async function getClinicApplication(
  clinicId: string,
  applicationId: string,
): Promise<ClinicApplication | null> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('applications')
    .select('*')
    .eq('id', applicationId)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  const application = scrubApplicationPii(data as Application);

  if (application.job_post_id) {
    const { data: job, error: jobError } = await supabase
      .from('job_posts')
      .select('id, title, role_type, clinic_id')
      .eq('id', application.job_post_id)
      .maybeSingle();

    if (jobError) throw jobError;
    if (job?.clinic_id !== clinicId) return null;

    const screening = scrubClinicApplicationScreening(
      application,
      await getApplicationScreening(application.id),
    );
    const enriched: ClinicApplication = {
      ...application,
      post_title: job.title,
      post_type: 'job',
      post_role_type: job.role_type,
      worker_account_deleted: Boolean(application.worker_account_deleted_at),
      screening,
      clinic_crm: null,
    };
    const [withCrm] = await attachClinicCrmToApplications(clinicId, [enriched]);
    return withCrm;
  }

  if (application.shift_post_id) {
    const { data: shift, error: shiftError } = await supabase
      .from('shift_posts')
      .select('id, role_type, shift_date, clinic_id')
      .eq('id', application.shift_post_id)
      .maybeSingle();

    if (shiftError) throw shiftError;
    if (shift?.clinic_id !== clinicId) return null;

    const enriched: ClinicApplication = {
      ...application,
      post_title: `Fill-in · ${shift.shift_date}`,
      post_type: 'shift',
      post_role_type: shift.role_type,
      worker_account_deleted: Boolean(application.worker_account_deleted_at),
      screening: null,
      clinic_crm: null,
    };
    const [withCrm] = await attachClinicCrmToApplications(clinicId, [enriched]);
    return withCrm;
  }

  return null;
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

export async function hideWorkerApplication(
  workerId: string,
  applicationId: string,
): Promise<Application> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.rpc('hide_worker_application', {
    application_id: applicationId,
  });

  if (error) throw error;
  const row = data as Application | null;
  if (!row || row.worker_id !== workerId) {
    throw new Error('Application not found or cannot be removed');
  }
  return row;
}

export async function hideClinicApplication(
  clinicId: string,
  applicationId: string,
): Promise<Application> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.rpc('hide_clinic_application', {
    application_id: applicationId,
  });

  if (error) throw error;
  const row = data as Application | null;
  if (!row) {
    throw new Error('Application not found or cannot be removed');
  }

  if (row.job_post_id) {
    const { data: job, error: jobError } = await supabase
      .from('job_posts')
      .select('clinic_id')
      .eq('id', row.job_post_id)
      .maybeSingle();
    if (jobError) throw jobError;
    if (job?.clinic_id !== clinicId) {
      throw new Error('Application not found or cannot be removed');
    }
  } else if (row.shift_post_id) {
    const { data: shift, error: shiftError } = await supabase
      .from('shift_posts')
      .select('clinic_id')
      .eq('id', row.shift_post_id)
      .maybeSingle();
    if (shiftError) throw shiftError;
    if (shift?.clinic_id !== clinicId) {
      throw new Error('Application not found or cannot be removed');
    }
  }

  return row;
}

export async function listWorkerJobApplications(
  workerId: string,
  visibility: ApplicationListVisibility = 'active',
): Promise<WorkerApplication[]> {
  const applications = await listWorkerApplications(workerId, visibility);
  return applications.filter((application) => application.post_type === 'job');
}

export async function listWorkerShiftApplications(workerId: string): Promise<WorkerApplication[]> {
  const applications = await listWorkerApplications(workerId);
  return applications.filter((application) => application.post_type === 'shift');
}

export async function getClinicNewApplicationCount(clinicId: string): Promise<number> {
  const supabase = getSupabaseClient();

  const { data: jobs, error: jobsError } = await supabase
    .from('job_posts')
    .select('id')
    .eq('clinic_id', clinicId);

  if (jobsError) throw jobsError;

  const jobIds = (jobs ?? []).map((job) => job.id);
  if (jobIds.length === 0) return 0;

  const { data, error } = await supabase
    .from('applications')
    .select('status, clinic_attention_at, clinic_last_seen_at')
    .in('job_post_id', jobIds)
    .is('clinic_hidden_at', null)
    .in('status', ['applied', 'screening_submitted']);

  if (error) throw error;

  return (data ?? []).filter((application) =>
    isClinicNewApplication({
      post_type: 'job',
      status: application.status,
      clinic_hidden_at: null,
      clinic_attention_at: application.clinic_attention_at,
      clinic_last_seen_at: application.clinic_last_seen_at,
    }),
  ).length;
}

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Past or decided fill-in applications should not contribute to Fill-ins tab badges. */
export function isPastWorkerFillInApplication(
  application: Pick<Application, 'post_type' | 'status'> & { shift_date?: string | null },
): boolean {
  if (application.post_type !== 'shift') return false;
  if (application.status === 'rejected' || application.status === 'selected') return true;
  return (application.shift_date ?? '') < todayISO();
}

/** Unseen clinic updates on upcoming fill-in applications only. */
export function isWorkerFillInApplicationUpdateCountable(
  application: Pick<
    Application,
    | 'post_type'
    | 'status'
    | 'created_at'
    | 'worker_hidden_at'
    | 'worker_attention_at'
    | 'worker_last_seen_at'
  > & { shift_date?: string | null },
): boolean {
  if (application.post_type !== 'shift') return false;
  if (isPastWorkerFillInApplication(application)) return false;
  return isWorkerApplicationUpdateUnseen(application);
}

/** Count job applications with clinic-side updates the worker has not opened since. */
export async function getWorkerApplicationUpdateCount(workerId: string): Promise<number> {
  const applications = await listWorkerJobApplications(workerId, 'active');
  return applications.filter((application) => isWorkerApplicationUpdateUnseen(application)).length;
}

/** Count fill-in applications with clinic-side updates the worker has not opened since. */
export async function getWorkerShiftApplicationUpdateCount(workerId: string): Promise<number> {
  const applications = await listWorkerShiftApplications(workerId);
  return applications.filter((application) =>
    isWorkerFillInApplicationUpdateCountable(application),
  ).length;
}

export async function markApplicationSeenByWorker(applicationId: string): Promise<Application> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.rpc('mark_application_seen_by_worker', {
    application_id: applicationId,
  });

  if (error) throw error;
  return data as Application;
}

export async function markApplicationSeenByClinic(applicationId: string): Promise<Application> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.rpc('mark_application_seen_by_clinic', {
    application_id: applicationId,
  });

  if (error) throw error;
  return data as Application;
}

export async function markApplicationsSeenByWorker(applicationIds: string[]): Promise<void> {
  if (applicationIds.length === 0) return;

  const supabase = getSupabaseClient();
  const { error } = await supabase.rpc('mark_applications_seen_by_worker', {
    application_ids: applicationIds,
  });

  if (error) throw error;
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
    .in('job_post_id', jobIds)
    .is('clinic_hidden_at', null);

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
  const [applications, jobPosts] = await Promise.all([
    listClinicApplications(clinicId),
    listJobPosts(clinicId),
  ]);
  const postCreatedAt = new Map(jobPosts.map((job) => [job.id, job.created_at]));
  const summaries = new Map<string, JobApplicationSummary>();

  for (const application of applications) {
    if (application.post_type !== 'job' || !application.job_post_id) continue;

    const existing = summaries.get(application.job_post_id);
    if (existing) {
      existing.applicant_count += 1;
      if (application.status === 'screening_submitted') {
        existing.screening_count += 1;
      }
      if (application.status === 'applied') {
        existing.pending_count += 1;
      }
      if (isClinicNewApplication(application)) {
        existing.unseen_count += 1;
      }
      if (application.status === 'in_progress') {
        existing.shortlisted_count += 1;
      }
      if (
        application.status === 'interview_offered' ||
        application.status === 'interview_scheduled'
      ) {
        existing.interview_count += 1;
      }
    } else {
      summaries.set(application.job_post_id, {
        job_post_id: application.job_post_id,
        post_title: application.post_title,
        post_created_at: postCreatedAt.get(application.job_post_id) ?? null,
        applicant_count: 1,
        screening_count: application.status === 'screening_submitted' ? 1 : 0,
        pending_count: application.status === 'applied' ? 1 : 0,
        unseen_count: isClinicNewApplication(application) ? 1 : 0,
        shortlisted_count: application.status === 'in_progress' ? 1 : 0,
        interview_count:
          application.status === 'interview_offered' || application.status === 'interview_scheduled'
            ? 1
            : 0,
      });
    }
  }

  return [...summaries.values()].sort((a, b) => {
    if (b.unseen_count !== a.unseen_count) {
      return b.unseen_count - a.unseen_count;
    }
    return b.applicant_count - a.applicant_count;
  });
}

export async function listClinicApplicationsForJob(
  clinicId: string,
  jobPostId: string,
  visibility: ApplicationListVisibility = 'active',
): Promise<ClinicApplication[]> {
  const applications = await listClinicApplications(clinicId, visibility);
  return applications.filter(
    (application) => application.post_type === 'job' && application.job_post_id === jobPostId,
  );
}

export async function listClinicApplicationsForShift(
  clinicId: string,
  shiftPostId: string,
): Promise<ClinicApplication[]> {
  const applications = await listClinicApplications(clinicId);
  return applications.filter(
    (application) => application.post_type === 'shift' && application.shift_post_id === shiftPostId,
  );
}

export async function reRequestShiftCover(
  shiftPostId: string,
  coverMessage?: string,
): Promise<Application> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.rpc('re_request_shift_cover', {
    p_shift_post_id: shiftPostId,
    p_cover_message: coverMessage ?? null,
  });

  if (error) throwWithMessage(error, 'Cover request cannot be resubmitted');
  const row = data as Application | null;
  if (!row) {
    throw new Error('Cover request cannot be resubmitted');
  }
  return row;
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

  if (input.screeningOnly) {
    if (!input.jobPostId || input.shiftPostId) {
      throw new Error('Screening-only applications require a job post');
    }
    if (!input.screening || input.screening.status !== 'completed') {
      throw new Error('Screening answers are required');
    }
  }

  if (input.shiftPostId && !input.screeningOnly) {
    const existing = await getWorkerShiftApplicationRecord(workerId, input.shiftPostId);
    if (existing) {
      if (existing.status === 'rejected') {
        return reRequestShiftCover(input.shiftPostId, input.coverMessage);
      }
      if (existing.status === 'hired') {
        throw new Error('You are already confirmed for this fill-in.');
      }
      if (ACTIVE_SHIFT_COVER_STATUSES.includes(existing.status)) {
        throw new Error('You have already submitted for this posting.');
      }
    }
  }

  const status: ApplicationStatus = input.screeningOnly ? 'screening_submitted' : 'applied';

  const { data, error } = await supabase
    .from('applications')
    .insert({
      worker_id: workerId,
      job_post_id: input.jobPostId ?? null,
      shift_post_id: input.shiftPostId ?? null,
      cover_message: input.screeningOnly ? null : input.coverMessage?.trim() || null,
      status,
      updated_at: now,
    })
    .select('*')
    .single();

  if (error) {
    if (error.code === '23505') {
      if (input.shiftPostId) {
        const existing = await getWorkerShiftApplicationRecord(workerId, input.shiftPostId);
        if (existing?.status === 'rejected') {
          return reRequestShiftCover(input.shiftPostId, input.coverMessage);
        }
      }
      throw new Error('You have already submitted for this posting.');
    }
    throwWithMessage(error, 'Could not submit application');
  }

  const application = data as Application;

  if (input.screening && input.jobPostId) {
    await insertApplicationScreening(application.id, input.screening);
  }

  return application;
}

export async function requestApplicationKit(applicationId: string): Promise<Application> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.rpc('request_application_kit', {
    application_id: applicationId,
  });

  if (error) throw error;
  const row = data as Application | null;
  if (!row) {
    throw new Error('Full application could not be requested');
  }
  return row;
}

export async function submitRequestedApplicationKit(
  workerId: string,
  applicationId: string,
  coverMessage?: string,
): Promise<Application> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.rpc('submit_requested_application_kit', {
    application_id: applicationId,
    cover_message: coverMessage?.trim() || null,
  });

  if (error) throw error;
  const row = data as Application | null;
  if (!row || row.worker_id !== workerId) {
    throw new Error('Full application could not be submitted');
  }
  return row;
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
    .eq('shift_post_id', shiftPostId)
    .in('status', ACTIVE_SHIFT_COVER_STATUSES);

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

export async function offerApplicationInterview(
  applicationId: string,
  input: ScheduleApplicationInterviewInput,
): Promise<Application> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('applications')
    .update({
      status: 'interview_offered',
      interview_at: input.interviewAt,
      interview_duration_minutes: input.durationMinutes,
      interview_details: input.details?.trim() || null,
      interview_offer_closed_by: null,
      interview_proposed_at: null,
      interview_proposed_duration_minutes: null,
      interview_proposed_details: null,
      interview_proposed_by: null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', applicationId)
    .select('*')
    .single();

  if (error) throw error;
  return data as Application;
}

/** @deprecated Use offerApplicationInterview */
export const scheduleApplicationInterview = offerApplicationInterview;

export async function acceptApplicationInterview(
  workerId: string,
  applicationId: string,
): Promise<Application> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.rpc('accept_application_interview', {
    application_id: applicationId,
  });

  if (error) throw error;
  const row = data as Application | null;
  if (!row || row.worker_id !== workerId) {
    throw new Error('Interview offer not found or already responded');
  }
  return row;
}

export async function declineApplicationInterview(
  workerId: string,
  applicationId: string,
): Promise<Application> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.rpc('decline_application_interview', {
    application_id: applicationId,
  });

  if (error) throw error;
  const row = data as Application | null;
  if (!row || row.worker_id !== workerId) {
    throw new Error('Interview offer not found or already responded');
  }
  return row;
}

export async function cancelApplicationInterviewOffer(applicationId: string): Promise<Application> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('applications')
    .update({
      status: 'in_progress',
      interview_at: null,
      interview_duration_minutes: null,
      interview_details: null,
      interview_proposed_at: null,
      interview_proposed_duration_minutes: null,
      interview_proposed_details: null,
      interview_proposed_by: null,
      interview_offer_closed_by: 'clinic',
      updated_at: new Date().toISOString(),
    })
    .eq('id', applicationId)
    .eq('status', 'interview_offered')
    .select('*')
    .single();

  if (error) throw error;
  return data as Application;
}

/** Clinic updates a pending interview invite before the candidate accepts. */
export async function updateApplicationInterviewOffer(
  applicationId: string,
  input: ScheduleApplicationInterviewInput,
): Promise<Application> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('applications')
    .update({
      interview_at: input.interviewAt,
      interview_duration_minutes: input.durationMinutes,
      interview_details: input.details?.trim() || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', applicationId)
    .eq('status', 'interview_offered')
    .select('*')
    .single();

  if (error) throw error;
  return data as Application;
}

/** Clinic proposes a new time; confirmed interview stays until the worker accepts. */
export async function proposeApplicationInterviewUpdate(
  applicationId: string,
  input: ScheduleApplicationInterviewInput,
): Promise<Application> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('applications')
    .update({
      interview_proposed_at: input.interviewAt,
      interview_proposed_duration_minutes: input.durationMinutes,
      interview_proposed_details: input.details?.trim() || null,
      interview_proposed_by: 'clinic',
      updated_at: new Date().toISOString(),
    })
    .eq('id', applicationId)
    .eq('status', 'interview_scheduled')
    .select('*')
    .single();

  if (error) throw error;
  return data as Application;
}

export async function proposeApplicationInterviewUpdateAsWorker(
  workerId: string,
  applicationId: string,
  input: ScheduleApplicationInterviewInput,
): Promise<Application> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.rpc('propose_application_interview_update', {
    application_id: applicationId,
    proposed_at: input.interviewAt,
    proposed_duration_minutes: input.durationMinutes,
    proposed_details: input.details?.trim() || null,
  });

  if (error) throw error;
  const row = data as Application | null;
  if (!row || row.worker_id !== workerId) {
    throw new Error('Interview not found or cannot be updated');
  }
  return row;
}

export async function acceptApplicationInterviewUpdate(
  applicationId: string,
  workerId?: string,
): Promise<Application> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.rpc('accept_application_interview_update', {
    application_id: applicationId,
  });

  if (error) throw error;
  const row = data as Application | null;
  if (!row) {
    throw new Error('No pending interview change');
  }
  if (workerId != null && row.worker_id !== workerId) {
    throw new Error('No pending interview change');
  }
  return row;
}

export async function declineApplicationInterviewUpdate(
  applicationId: string,
  workerId?: string,
): Promise<Application> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.rpc('decline_application_interview_update', {
    application_id: applicationId,
  });

  if (error) throw error;
  const row = data as Application | null;
  if (!row) {
    throw new Error('No pending interview change');
  }
  if (workerId != null && row.worker_id !== workerId) {
    throw new Error('No pending interview change');
  }
  return row;
}

/** Cancels a confirmed interview and returns the application to shortlist. */
export async function cancelScheduledApplicationInterview(
  applicationId: string,
  closedBy: 'clinic' | 'worker',
): Promise<Application> {
  if (closedBy === 'worker') {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase.rpc('cancel_scheduled_application_interview', {
      application_id: applicationId,
    });
    if (error) throw error;
    const row = data as Application | null;
    if (!row) {
      throw new Error('Interview not found or cannot be cancelled');
    }
    return row;
  }

  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('applications')
    .update({
      status: 'in_progress',
      interview_at: null,
      interview_duration_minutes: null,
      interview_details: null,
      interview_proposed_at: null,
      interview_proposed_duration_minutes: null,
      interview_proposed_details: null,
      interview_proposed_by: null,
      interview_offer_closed_by: 'clinic',
      updated_at: new Date().toISOString(),
    })
    .eq('id', applicationId)
    .eq('status', 'interview_scheduled')
    .select('*')
    .single();

  if (error) throw error;
  return data as Application;
}

export async function confirmFillInApplicant(
  clinicId: string,
  applicationId: string,
): Promise<Application> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.rpc('confirm_fill_in_applicant', {
    application_id: applicationId,
  });

  if (error) throw error;
  const row = data as Application | null;
  if (!row?.shift_post_id) {
    throw new Error('Fill-in application not found');
  }

  const { data: shift, error: shiftError } = await supabase
    .from('shift_posts')
    .select('clinic_id')
    .eq('id', row.shift_post_id)
    .maybeSingle();

  if (shiftError) throw shiftError;
  if (shift?.clinic_id !== clinicId) {
    throw new Error('Fill-in application not found');
  }

  return row;
}

export async function cancelConfirmedFillIn(
  applicationId: string,
  options?: { message?: string },
): Promise<Application> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.rpc('cancel_confirmed_fill_in', {
    application_id: applicationId,
    message: options?.message ?? null,
  });

  if (error) throwWithMessage(error, 'Confirmed fill-in not found or cannot be cancelled');
  const row = data as Application | null;
  if (!row) {
    throw new Error('Confirmed fill-in not found or cannot be cancelled');
  }
  return row;
}

export async function listFillInCoverRequests(clinicId: string): Promise<FillInCoverRequest[]> {
  const supabase = getSupabaseClient();

  const { data: shifts, error: shiftsError } = await supabase
    .from('shift_posts')
    .select('id, role_type, shift_date, start_time, end_time, status')
    .eq('clinic_id', clinicId)
    .eq('status', 'live');

  if (shiftsError) throw shiftsError;
  if (!shifts?.length) return [];

  const shiftMap = new Map(
    shifts.map((shift) => [
      shift.id,
      {
        title: `Fill-in · ${shift.shift_date}`,
        role_type: shift.role_type,
        shift_date: shift.shift_date,
        start_time: shift.start_time,
        end_time: shift.end_time,
      },
    ]),
  );

  const shiftIds = shifts.map((shift) => shift.id);
  const { data, error } = await supabase
    .from('applications')
    .select('*')
    .in('shift_post_id', shiftIds)
    .is('clinic_hidden_at', null)
    .order('created_at', { ascending: false });

  if (error) throw error;

  const requests: FillInCoverRequest[] = [];

  for (const row of data ?? []) {
    const application = scrubApplicationPii(row as Application);
    if (!application.shift_post_id || !shiftMap.has(application.shift_post_id)) continue;
    if (!isFillInPendingStatus(application.status)) continue;

    const shift = shiftMap.get(application.shift_post_id)!;
    requests.push({
      ...application,
      post_title: shift.title,
      post_type: 'shift',
      post_role_type: shift.role_type,
      worker_account_deleted: Boolean(application.worker_account_deleted_at),
      screening: null,
      clinic_crm: null,
      shift_date: shift.shift_date,
      shift_start_time: shift.start_time,
      shift_end_time: shift.end_time,
    });
  }

  const sorted = requests.sort((a, b) => {
    const dateCompare = a.shift_date.localeCompare(b.shift_date);
    if (dateCompare !== 0) return dateCompare;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  return attachClinicCrmToApplications(clinicId, sorted);
}

export async function getFillInPendingCount(clinicId: string): Promise<number> {
  const requests = await listFillInCoverRequests(clinicId);
  return requests.filter((request) => isClinicNewFillInRequest(request)).length;
}

export async function getShiftPostPendingApplicationCountsMap(
  clinicId: string,
): Promise<Record<string, number>> {
  const requests = await listFillInCoverRequests(clinicId);
  const counts: Record<string, number> = {};
  for (const request of requests) {
    if (!request.shift_post_id || !isClinicNewFillInRequest(request)) continue;
    counts[request.shift_post_id] = (counts[request.shift_post_id] ?? 0) + 1;
  }
  return counts;
}

export async function listUpcomingConfirmedFillIns(
  clinicId: string,
): Promise<ConfirmedFillInSummary[]> {
  const supabase = getSupabaseClient();

  const { data: shifts, error: shiftsError } = await supabase
    .from('shift_posts')
    .select('id, shift_date, start_time, end_time')
    .eq('clinic_id', clinicId);

  if (shiftsError) throw shiftsError;
  if (!shifts?.length) return [];

  const today = new Date().toISOString().slice(0, 10);
  const shiftMap = new Map(
    shifts.filter((shift) => shift.shift_date >= today).map((shift) => [shift.id, shift]),
  );

  if (shiftMap.size === 0) return [];

  const shiftIds = [...shiftMap.keys()];
  const { data, error } = await supabase
    .from('applications')
    .select(
      'id, shift_post_id, status, worker_display_name, worker_photo_storage_path, worker_account_deleted_at',
    )
    .in('shift_post_id', shiftIds)
    .eq('status', 'hired')
    .order('created_at', { ascending: false });

  if (error) throw error;

  const summaries: ConfirmedFillInSummary[] = [];

  for (const row of data ?? []) {
    if (!row.shift_post_id || !shiftMap.has(row.shift_post_id)) continue;
    const shift = shiftMap.get(row.shift_post_id)!;
    summaries.push({
      applicationId: row.id,
      shiftPostId: row.shift_post_id,
      workerName: row.worker_account_deleted_at
        ? DELETED_CANDIDATE_LABEL
        : row.worker_display_name?.trim() || 'Applicant',
      workerPhotoStoragePath: row.worker_account_deleted_at
        ? null
        : (row.worker_photo_storage_path ?? null),
      postTitle: `Fill-in · ${shift.shift_date}`,
      shiftDate: shift.shift_date,
      startTime: shift.start_time,
      endTime: shift.end_time,
    });
  }

  return summaries.sort((a, b) => {
    const dateCompare = a.shiftDate.localeCompare(b.shiftDate);
    if (dateCompare !== 0) return dateCompare;
    return a.workerName.localeCompare(b.workerName);
  });
}
