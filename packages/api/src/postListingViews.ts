import { getSupabaseClient } from './client';

function toCountMap(
  rows: Array<{ id: string; view_count: number | string | null }> | null | undefined,
): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const row of rows ?? []) {
    const value = typeof row.view_count === 'string' ? Number(row.view_count) : row.view_count;
    counts[row.id] = Number.isFinite(value) ? Number(value) : 0;
  }
  return counts;
}

/** Fire-and-forget friendly: unique professional opens of a role detail. */
export async function recordJobPostListingView(jobPostId: string): Promise<void> {
  if (!jobPostId) return;
  const supabase = getSupabaseClient();
  const { error } = await supabase.rpc('record_job_post_listing_view', {
    p_job_post_id: jobPostId,
  });
  if (error) throw error;
}

/** Fire-and-forget friendly: unique professional opens of a fill-in detail. */
export async function recordShiftPostListingView(shiftPostId: string): Promise<void> {
  if (!shiftPostId) return;
  const supabase = getSupabaseClient();
  const { error } = await supabase.rpc('record_shift_post_listing_view', {
    p_shift_post_id: shiftPostId,
  });
  if (error) throw error;
}

export async function getJobPostListingViewCountsMap(
  jobPostIds: string[],
): Promise<Record<string, number>> {
  if (jobPostIds.length === 0) return {};

  const supabase = getSupabaseClient();
  const { data, error } = await supabase.rpc('get_job_post_listing_view_counts', {
    p_job_post_ids: jobPostIds,
  });

  if (error) throw error;

  return toCountMap(
    (data ?? []).map((row) => ({
      id: row.job_post_id,
      view_count: row.view_count,
    })),
  );
}

export async function getShiftPostListingViewCountsMap(
  shiftPostIds: string[],
): Promise<Record<string, number>> {
  if (shiftPostIds.length === 0) return {};

  const supabase = getSupabaseClient();
  const { data, error } = await supabase.rpc('get_shift_post_listing_view_counts', {
    p_shift_post_ids: shiftPostIds,
  });

  if (error) throw error;

  return toCountMap(
    (data ?? []).map((row) => ({
      id: row.shift_post_id,
      view_count: row.view_count,
    })),
  );
}
