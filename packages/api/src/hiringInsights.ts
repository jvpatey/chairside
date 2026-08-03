import { getSupabaseClient } from './client';
import { throwWithMessage } from './errors';

export type HiringInsightsMetrics = {
  openRoles: number;
  liveFillIns: number;
  totalApplicants: number;
  newApplicants: number;
  pipeline: Record<string, number>;
  outreachThreads: number;
  confirmedFillIns: number;
  avgDaysToFirstApplicant: number | null;
};

export type HiringInsightsLocationBreakdown = {
  locationId: string;
  locationName: string;
  metrics: HiringInsightsMetrics;
};

export type ClinicHiringInsights = HiringInsightsMetrics & {
  byLocation: HiringInsightsLocationBreakdown[];
};

type HiringInsightsMetricsRow = {
  open_roles: number;
  live_fill_ins: number;
  total_applicants: number;
  new_applicants: number;
  pipeline: Record<string, number> | null;
  outreach_threads: number;
  confirmed_fill_ins: number;
  avg_days_to_first_applicant: number | null;
};

type HiringInsightsLocationRow = {
  location_id: string;
  location_name: string;
  metrics: HiringInsightsMetricsRow;
};

type HiringInsightsRow = HiringInsightsMetricsRow & {
  by_location: HiringInsightsLocationRow[] | null;
};

function mapMetrics(row: HiringInsightsMetricsRow): HiringInsightsMetrics {
  return {
    openRoles: row.open_roles ?? 0,
    liveFillIns: row.live_fill_ins ?? 0,
    totalApplicants: row.total_applicants ?? 0,
    newApplicants: row.new_applicants ?? 0,
    pipeline: row.pipeline ?? {},
    outreachThreads: row.outreach_threads ?? 0,
    confirmedFillIns: row.confirmed_fill_ins ?? 0,
    avgDaysToFirstApplicant: row.avg_days_to_first_applicant ?? null,
  };
}

function mapHiringInsights(row: HiringInsightsRow): ClinicHiringInsights {
  const metrics = mapMetrics(row);
  return {
    ...metrics,
    byLocation: (row.by_location ?? []).map((location) => ({
      locationId: location.location_id,
      locationName: location.location_name,
      metrics: mapMetrics(location.metrics),
    })),
  };
}

export type GetClinicHiringInsightsInput = {
  clinicId?: string;
  locationIds?: string[] | null;
};

export async function getClinicHiringInsights(
  input: GetClinicHiringInsightsInput = {},
): Promise<ClinicHiringInsights> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.rpc('get_clinic_hiring_insights', {
    p_clinic_id: input.clinicId ?? undefined,
    p_location_ids:
      input.locationIds && input.locationIds.length > 0 ? input.locationIds : null,
  });

  if (error) throwWithMessage(error, 'Could not load hiring insights.');
  return mapHiringInsights((data ?? {}) as HiringInsightsRow);
}
