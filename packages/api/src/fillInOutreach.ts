import type { RoleType } from '@chairside/config';
import { getSupabaseClient } from './client';
import { getErrorMessage, throwWithMessage } from './errors';

export type FillInOutreachWorker = {
  workerId: string;
  displayName: string;
  roleTypes: string[];
  city: string | null;
  yearsOfExperience: number | null;
  shortNoticeAvailable: boolean;
  photoStoragePath: string | null;
  availabilitySummary: string | null;
  existingConversationId: string | null;
  smsOptIn: boolean;
};

export type ListFillInOutreachWorkersInput = {
  roleType?: RoleType | null;
};

type FillInOutreachWorkerRow = {
  worker_id: string;
  display_name: string;
  role_types: string[];
  city: string | null;
  years_of_experience: number | null;
  short_notice_available: boolean;
  photo_storage_path: string | null;
  availability_summary: string | null;
  existing_conversation_id: string | null;
  sms_opt_in: boolean;
};

function toPgTime(value: string | null | undefined): string | null {
  if (!value) return null;
  return /^\d{2}:\d{2}$/.test(value) ? `${value}:00` : value;
}

function mapFillInOutreachWorker(row: FillInOutreachWorkerRow): FillInOutreachWorker {
  return {
    workerId: row.worker_id,
    displayName: row.display_name,
    roleTypes: row.role_types ?? [],
    city: row.city,
    yearsOfExperience: row.years_of_experience,
    shortNoticeAvailable: row.short_notice_available,
    photoStoragePath: row.photo_storage_path,
    availabilitySummary: row.availability_summary,
    existingConversationId: row.existing_conversation_id,
    smsOptIn: row.sms_opt_in,
  };
}

export async function listFillInOutreachWorkersForClinic(
  input: ListFillInOutreachWorkersInput = {},
): Promise<FillInOutreachWorker[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.rpc('list_fill_in_outreach_workers_for_clinic', {
    p_role_type: input.roleType ?? null,
  });

  if (error) throwWithMessage(error, 'Could not load available workers.');
  return ((data ?? []) as FillInOutreachWorkerRow[]).map(mapFillInOutreachWorker);
}

/** @deprecated Use listFillInOutreachWorkersForClinic instead. */
export type AvailableFillInWorker = FillInOutreachWorker;

/** @deprecated Use listFillInOutreachWorkersForClinic instead. */
export async function listAvailableFillInWorkersForClinic(): Promise<FillInOutreachWorker[]> {
  return listFillInOutreachWorkersForClinic();
}

export type StartClinicFillInOutreachInput = {
  workerId: string;
  message: string;
  roleType?: RoleType | null;
  shiftDate?: string | null;
  startTime?: string | null;
  endTime?: string | null;
  sendSms?: boolean;
};

export async function startClinicFillInOutreach(
  input: StartClinicFillInOutreachInput,
): Promise<string> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.rpc('start_clinic_fill_in_outreach', {
    p_worker_id: input.workerId,
    p_message: input.message.trim(),
    p_role_type: input.roleType ?? null,
    p_shift_date: input.shiftDate ?? null,
    p_start_time: toPgTime(input.startTime),
    p_end_time: toPgTime(input.endTime),
    p_send_sms: input.sendSms ?? false,
  });

  if (error) throwWithMessage(error, 'Could not send outreach message.');
  if (typeof data !== 'string' || !data) {
    throw new Error(getErrorMessage(data, 'Could not send outreach message.'));
  }
  return data;
}
