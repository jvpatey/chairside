import { getSupabaseClient, getSupabaseConfig } from './client';

const PHOTO_BUCKET = 'clinic-doctor-photos';
const MAX_PHOTO_BYTES = 2 * 1024 * 1024;
const ALLOWED_CONTENT_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

export function getPracticeDoctorPhotoStoragePath(
  clinicId: string,
  doctorId: string,
  extension = 'jpg',
): string {
  return `${clinicId}/doctors/${doctorId}.${extension}`;
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

function contentTypeToExtension(contentType: string): string {
  switch (contentType) {
    case 'image/png':
      return 'png';
    case 'image/webp':
      return 'webp';
    default:
      return 'jpg';
  }
}

function getAuthenticatedStorageUrl(storagePath: string) {
  const { url } = getSupabaseConfig();
  const baseUrl = url.replace(/\/$/, '');
  const encodedPath = normalizeStoragePath(storagePath)
    .split('/')
    .map(encodeURIComponent)
    .join('/');
  return `${baseUrl}/storage/v1/object/authenticated/${PHOTO_BUCKET}/${encodedPath}`;
}

async function getAuthenticatedStorageHeaders() {
  const { anonKey } = getSupabaseConfig();
  const supabase = getSupabaseClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.access_token) {
    throw new Error('You must be signed in to access this photo');
  }

  return {
    Authorization: `Bearer ${session.access_token}`,
    apikey: anonKey,
  };
}

export async function uploadPracticeDoctorPhotoFromBase64(
  clinicId: string,
  doctorId: string,
  base64: string,
  contentType: string,
  existingStoragePath?: string | null,
): Promise<{ storagePath: string }> {
  const normalizedType = ALLOWED_CONTENT_TYPES.has(contentType) ? contentType : 'image/jpeg';
  const bytes = base64ToBytes(base64);

  if (bytes.byteLength === 0) {
    throw new Error('Selected photo is empty. Choose a different image.');
  }
  if (bytes.byteLength > MAX_PHOTO_BYTES) {
    throw new Error('Photo must be 2 MB or smaller.');
  }

  const supabase = getSupabaseClient();
  const storagePath = getPracticeDoctorPhotoStoragePath(
    clinicId,
    doctorId,
    contentTypeToExtension(normalizedType),
  );

  if (existingStoragePath && existingStoragePath !== storagePath) {
    await supabase.storage.from(PHOTO_BUCKET).remove([existingStoragePath]);
  }

  const { error: uploadError } = await supabase.storage
    .from(PHOTO_BUCKET)
    .upload(storagePath, bytes, {
      upsert: true,
      contentType: normalizedType,
    });

  if (uploadError) throw uploadError;

  return { storagePath };
}

export async function deletePracticeDoctorPhoto(storagePath: string): Promise<void> {
  const supabase = getSupabaseClient();
  const path = normalizeStoragePath(storagePath);
  if (!path) return;

  const { error: removeError } = await supabase.storage.from(PHOTO_BUCKET).remove([path]);
  if (removeError) throw removeError;
}

export async function getPracticeDoctorPhotoSignedUrl(
  storagePath: string,
): Promise<string | null> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.storage
    .from(PHOTO_BUCKET)
    .createSignedUrl(normalizeStoragePath(storagePath), 60 * 60);

  if (error) throw error;
  return data?.signedUrl ?? null;
}

export async function getPracticeDoctorPhotoDownloadRequest(storagePath: string): Promise<{
  url: string;
  headers: Record<string, string>;
}> {
  return {
    url: getAuthenticatedStorageUrl(storagePath),
    headers: await getAuthenticatedStorageHeaders(),
  };
}
