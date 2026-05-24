import { getSupabaseClient, getSupabaseConfig } from './client';
import { upsertWorkerProfile } from './workerProfile';

const RESUME_BUCKET = 'worker-resumes';
const MAX_RESUME_BYTES = 5 * 1024 * 1024;

export function getWorkerResumeStoragePath(workerId: string): string {
  return `${workerId}/resume.pdf`;
}

function normalizeStoragePath(storagePath: string) {
  return storagePath.replace(/^\/+/, '');
}

function base64ToBytes(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function getAuthenticatedStorageUrl(storagePath: string) {
  const { url } = getSupabaseConfig();
  const baseUrl = url.replace(/\/$/, '');
  const encodedPath = normalizeStoragePath(storagePath)
    .split('/')
    .map(encodeURIComponent)
    .join('/');
  return `${baseUrl}/storage/v1/object/authenticated/${RESUME_BUCKET}/${encodedPath}`;
}

async function getAuthenticatedStorageHeaders() {
  const { anonKey } = getSupabaseConfig();
  const supabase = getSupabaseClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.access_token) {
    throw new Error('You must be signed in to access this resume');
  }

  return {
    Authorization: `Bearer ${session.access_token}`,
    apikey: anonKey,
  };
}

async function uploadResumeBytes(
  workerId: string,
  bytes: Uint8Array,
  fileName: string,
): Promise<{ storagePath: string; fileName: string }> {
  if (bytes.byteLength === 0) {
    throw new Error('Selected file is empty. Choose a different PDF.');
  }
  if (bytes.byteLength > MAX_RESUME_BYTES) {
    throw new Error('Resume must be 5 MB or smaller.');
  }

  const supabase = getSupabaseClient();
  const storagePath = getWorkerResumeStoragePath(workerId);

  const { error: uploadError } = await supabase.storage
    .from(RESUME_BUCKET)
    .upload(storagePath, bytes, {
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

export async function uploadWorkerResume(
  workerId: string,
  fileUri: string,
  fileName: string,
): Promise<{ storagePath: string; fileName: string }> {
  const response = await fetch(fileUri);
  const blob = await response.blob();

  if (blob.size === 0) {
    throw new Error('Selected file is empty. Choose a different PDF.');
  }

  const buffer = await blob.arrayBuffer();
  return uploadResumeBytes(workerId, new Uint8Array(buffer), fileName);
}

export async function uploadWorkerResumeFromBase64(
  workerId: string,
  base64: string,
  fileName: string,
): Promise<{ storagePath: string; fileName: string }> {
  return uploadResumeBytes(workerId, base64ToBytes(base64), fileName);
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
    .createSignedUrl(normalizeStoragePath(storagePath), 60 * 60);

  if (error) throw error;
  return data?.signedUrl ?? null;
}

export async function downloadWorkerResume(storagePath: string): Promise<ArrayBuffer> {
  const downloadUrl = getAuthenticatedStorageUrl(storagePath);
  const headers = await getAuthenticatedStorageHeaders();
  const response = await fetch(downloadUrl, { headers });

  if (!response.ok) {
    throw new Error(`Could not download resume (${response.status})`);
  }

  const buffer = await response.arrayBuffer();
  if (buffer.byteLength === 0) {
    throw new Error('Resume file is empty. Upload your resume again.');
  }

  return buffer;
}

export async function getWorkerResumeDownloadRequest(storagePath: string): Promise<{
  url: string;
  headers: Record<string, string>;
}> {
  return {
    url: getAuthenticatedStorageUrl(storagePath),
    headers: await getAuthenticatedStorageHeaders(),
  };
}
