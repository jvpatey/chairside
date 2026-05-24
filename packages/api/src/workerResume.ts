import { getSupabaseClient } from './client';
import { upsertWorkerProfile } from './workerProfile';

const RESUME_BUCKET = 'worker-resumes';
const MAX_RESUME_BYTES = 5 * 1024 * 1024;

export function getWorkerResumeStoragePath(workerId: string): string {
  return `${workerId}/resume.pdf`;
}

export async function uploadWorkerResume(
  workerId: string,
  fileUri: string,
  fileName: string,
): Promise<{ storagePath: string; fileName: string }> {
  const supabase = getSupabaseClient();
  const storagePath = getWorkerResumeStoragePath(workerId);

  const response = await fetch(fileUri);
  const blob = await response.blob();

  if (blob.size > MAX_RESUME_BYTES) {
    throw new Error('Resume must be 5 MB or smaller.');
  }

  const { error: uploadError } = await supabase.storage
    .from(RESUME_BUCKET)
    .upload(storagePath, blob, {
      upsert: true,
      contentType: 'application/pdf',
    });

  if (uploadError) throw uploadError;

  const now = new Date().toISOString();
  await upsertWorkerProfile(workerId, {
    resume_storage_path: storagePath,
    resume_file_name: fileName,
    resume_uploaded_at: now,
  });

  return { storagePath, fileName };
}

export async function deleteWorkerResume(workerId: string): Promise<void> {
  const supabase = getSupabaseClient();
  const storagePath = getWorkerResumeStoragePath(workerId);

  const { error: removeError } = await supabase.storage.from(RESUME_BUCKET).remove([storagePath]);
  if (removeError) throw removeError;

  await upsertWorkerProfile(workerId, {
    resume_storage_path: null,
    resume_file_name: null,
    resume_uploaded_at: null,
  });
}

export async function getWorkerResumeSignedUrl(storagePath: string): Promise<string | null> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.storage
    .from(RESUME_BUCKET)
    .createSignedUrl(storagePath, 60 * 60);

  if (error) throw error;
  return data?.signedUrl ?? null;
}
