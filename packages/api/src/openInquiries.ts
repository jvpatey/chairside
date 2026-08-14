import type { RoleType } from '@chairside/config';
import { getSupabaseClient } from './client';
import { throwWithMessage } from './errors';

export type OpenInquiryWorker = {
  workerId: string;
  displayName: string;
  roleTypes: string[];
  city: string | null;
  yearsOfExperience: number | null;
  bio: string | null;
  photoStoragePath: string | null;
  existingConversationId: string | null;
};

export type ListOpenInquiryWorkersInput = {
  roleType?: RoleType | null;
};

type OpenInquiryWorkerRow = {
  worker_id: string;
  display_name: string;
  role_types: string[];
  city: string | null;
  years_of_experience: number | null;
  bio: string | null;
  photo_storage_path: string | null;
  existing_conversation_id: string | null;
};

function mapOpenInquiryWorker(row: OpenInquiryWorkerRow): OpenInquiryWorker {
  return {
    workerId: row.worker_id,
    displayName: row.display_name,
    roleTypes: row.role_types ?? [],
    city: row.city,
    yearsOfExperience: row.years_of_experience,
    bio: row.bio,
    photoStoragePath: row.photo_storage_path,
    existingConversationId: row.existing_conversation_id,
  };
}

export async function listOpenInquiryWorkersForClinic(
  input: ListOpenInquiryWorkersInput = {},
): Promise<OpenInquiryWorker[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.rpc('list_open_inquiry_workers_for_clinic', {
    p_role_type: input.roleType ?? null,
  });

  if (error) throwWithMessage(error, 'Could not load candidates.');
  return ((data ?? []) as OpenInquiryWorkerRow[]).map(mapOpenInquiryWorker);
}
