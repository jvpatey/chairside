import { getSupabaseClient } from './client';
import {
  getLiveJobPost,
  getLiveShiftPost,
  listLiveJobPosts,
  listLiveShiftPosts,
  type LiveJobPost,
  type LiveShiftPost,
} from './posts';

export type SavedPostKind = 'job' | 'shift';

export type WorkerSavedPost = {
  id: string;
  worker_id: string;
  job_post_id: string | null;
  shift_post_id: string | null;
  saved_at: string;
  last_change_seen_at: string | null;
};

export type WorkerSavedPostsResult = {
  jobs: LiveJobPost[];
  shifts: LiveShiftPost[];
};

async function listSavedRows(workerId: string): Promise<WorkerSavedPost[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('worker_saved_posts')
    .select('id, worker_id, job_post_id, shift_post_id, saved_at, last_change_seen_at')
    .eq('worker_id', workerId)
    .order('saved_at', { ascending: false });

  if (error) throw error;
  return (data ?? []) as WorkerSavedPost[];
}

export async function getWorkerSavedJobPostIds(workerId: string): Promise<Set<string>> {
  const rows = await listSavedRows(workerId);
  return new Set(
    rows
      .map((row) => row.job_post_id)
      .filter((id): id is string => typeof id === 'string'),
  );
}

export async function getWorkerSavedShiftPostIds(workerId: string): Promise<Set<string>> {
  const rows = await listSavedRows(workerId);
  return new Set(
    rows
      .map((row) => row.shift_post_id)
      .filter((id): id is string => typeof id === 'string'),
  );
}

export async function isJobPostSaved(workerId: string, jobId: string): Promise<boolean> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('worker_saved_posts')
    .select('id')
    .eq('worker_id', workerId)
    .eq('job_post_id', jobId)
    .maybeSingle();

  if (error) throw error;
  return Boolean(data);
}

export async function isShiftPostSaved(workerId: string, shiftId: string): Promise<boolean> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('worker_saved_posts')
    .select('id')
    .eq('worker_id', workerId)
    .eq('shift_post_id', shiftId)
    .maybeSingle();

  if (error) throw error;
  return Boolean(data);
}

export async function saveJobPost(jobId: string): Promise<void> {
  const supabase = getSupabaseClient();
  const { error } = await supabase.rpc('save_job_post_for_worker', {
    p_job_post_id: jobId,
  });

  if (error) throw error;
}

export async function unsaveJobPost(jobId: string): Promise<void> {
  const supabase = getSupabaseClient();
  const { error } = await supabase.rpc('unsave_job_post_for_worker', {
    p_job_post_id: jobId,
  });

  if (error) throw error;
}

export async function saveShiftPost(shiftId: string): Promise<void> {
  const supabase = getSupabaseClient();
  const { error } = await supabase.rpc('save_shift_post_for_worker', {
    p_shift_post_id: shiftId,
  });

  if (error) throw error;
}

export async function unsaveShiftPost(shiftId: string): Promise<void> {
  const supabase = getSupabaseClient();
  const { error } = await supabase.rpc('unsave_shift_post_for_worker', {
    p_shift_post_id: shiftId,
  });

  if (error) throw error;
}

export async function listWorkerSavedPosts(
  workerId: string,
  province: string,
): Promise<WorkerSavedPostsResult> {
  const [rows, liveJobs, liveShifts] = await Promise.all([
    listSavedRows(workerId),
    listLiveJobPosts(province),
    listLiveShiftPosts(province),
  ]);

  const savedJobIds = new Set(
    rows
      .map((row) => row.job_post_id)
      .filter((id): id is string => typeof id === 'string'),
  );
  const savedShiftIds = new Set(
    rows
      .map((row) => row.shift_post_id)
      .filter((id): id is string => typeof id === 'string'),
  );

  return {
    jobs: liveJobs.filter((job) => savedJobIds.has(job.id)),
    shifts: liveShifts.filter((shift) => savedShiftIds.has(shift.id)),
  };
}

export async function getSavedLiveJobPost(jobId: string): Promise<LiveJobPost | null> {
  return getLiveJobPost(jobId);
}

export async function getSavedLiveShiftPost(shiftId: string): Promise<LiveShiftPost | null> {
  return getLiveShiftPost(shiftId);
}
