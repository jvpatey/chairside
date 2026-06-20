import { normalizeClinicWorkerCrmTags } from '@chairside/config';

import { getSupabaseClient } from './client';

export type ClinicWorkerCrmRecord = {
  clinic_id: string;
  worker_id: string;
  note: string | null;
  tags: string[];
  follow_up_at: string | null;
  created_at: string;
  updated_at: string;
};

export type UpsertClinicWorkerCrmInput = {
  clinicId: string;
  workerId: string;
  note?: string | null;
  tags?: string[];
  followUpAt?: string | null;
};

function mapClinicWorkerCrmRow(row: Record<string, unknown>): ClinicWorkerCrmRecord {
  return {
    clinic_id: String(row.clinic_id),
    worker_id: String(row.worker_id),
    note: typeof row.note === 'string' ? row.note : null,
    tags: normalizeClinicWorkerCrmTags(
      Array.isArray(row.tags) ? row.tags.filter((tag): tag is string => typeof tag === 'string') : [],
    ),
    follow_up_at: typeof row.follow_up_at === 'string' ? row.follow_up_at : null,
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
  };
}

export async function listClinicWorkerCrmRecords(
  clinicId: string,
  workerIds: string[],
): Promise<ClinicWorkerCrmRecord[]> {
  const uniqueWorkerIds = [...new Set(workerIds.filter(Boolean))];
  if (uniqueWorkerIds.length === 0) return [];

  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('clinic_worker_crm')
    .select('*')
    .eq('clinic_id', clinicId)
    .in('worker_id', uniqueWorkerIds);

  if (error) throw error;
  return (data ?? []).map((row) => mapClinicWorkerCrmRow(row as Record<string, unknown>));
}

export async function listClinicWorkerCrmRecordsMap(
  clinicId: string,
  workerIds: string[],
): Promise<Map<string, ClinicWorkerCrmRecord>> {
  const records = await listClinicWorkerCrmRecords(clinicId, workerIds);
  return new Map(records.map((record) => [record.worker_id, record]));
}

export async function upsertClinicWorkerCrmRecord(
  input: UpsertClinicWorkerCrmInput,
): Promise<ClinicWorkerCrmRecord> {
  const supabase = getSupabaseClient();
  const now = new Date().toISOString();
  const note = input.note?.trim() ? input.note.trim() : null;
  const tags = normalizeClinicWorkerCrmTags(input.tags);
  const followUpAt = input.followUpAt?.trim() ? input.followUpAt.trim() : null;

  const { data, error } = await supabase
    .from('clinic_worker_crm')
    .upsert(
      {
        clinic_id: input.clinicId,
        worker_id: input.workerId,
        note,
        tags,
        follow_up_at: followUpAt,
        updated_at: now,
      },
      { onConflict: 'clinic_id,worker_id' },
    )
    .select('*')
    .single();

  if (error) throw error;
  return mapClinicWorkerCrmRow(data as Record<string, unknown>);
}

type ApplicationWithWorkerId = {
  worker_id: string;
};

export async function attachClinicCrmToApplications<
  T extends ApplicationWithWorkerId,
>(clinicId: string, applications: T[]): Promise<(T & { clinic_crm: ClinicWorkerCrmRecord | null })[]> {
  if (applications.length === 0) return applications;

  const crmMap = await listClinicWorkerCrmRecordsMap(
    clinicId,
    applications.map((application) => application.worker_id),
  );

  return applications.map((application) => ({
    ...application,
    clinic_crm: crmMap.get(application.worker_id) ?? null,
  }));
}
