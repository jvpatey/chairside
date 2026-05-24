import { getSupabaseClient, getSupabaseConfig } from './client';
import { upsertClinicProfile } from './clinicProfile';

const LOGO_BUCKET = 'clinic-logos';
const MAX_LOGO_BYTES = 2 * 1024 * 1024;
const ALLOWED_CONTENT_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

export function getClinicLogoStoragePath(clinicId: string, extension = 'jpg'): string {
  return `${clinicId}/logo.${extension}`;
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
  return `${baseUrl}/storage/v1/object/authenticated/${LOGO_BUCKET}/${encodedPath}`;
}

async function getAuthenticatedStorageHeaders() {
  const { anonKey } = getSupabaseConfig();
  const supabase = getSupabaseClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.access_token) {
    throw new Error('You must be signed in to access this logo');
  }

  return {
    Authorization: `Bearer ${session.access_token}`,
    apikey: anonKey,
  };
}

export async function uploadClinicLogoFromBase64(
  clinicId: string,
  base64: string,
  contentType: string,
  existingStoragePath?: string | null,
): Promise<{ storagePath: string }> {
  const normalizedType = ALLOWED_CONTENT_TYPES.has(contentType) ? contentType : 'image/jpeg';
  const bytes = base64ToBytes(base64);

  if (bytes.byteLength === 0) {
    throw new Error('Selected image is empty. Choose a different image.');
  }
  if (bytes.byteLength > MAX_LOGO_BYTES) {
    throw new Error('Logo must be 2 MB or smaller.');
  }

  const supabase = getSupabaseClient();
  const storagePath = getClinicLogoStoragePath(
    clinicId,
    contentTypeToExtension(normalizedType),
  );

  if (existingStoragePath && existingStoragePath !== storagePath) {
    await supabase.storage.from(LOGO_BUCKET).remove([existingStoragePath]);
  }

  const { error: uploadError } = await supabase.storage
    .from(LOGO_BUCKET)
    .upload(storagePath, bytes, {
      upsert: true,
      contentType: normalizedType,
    });

  if (uploadError) throw uploadError;

  const now = new Date().toISOString();
  await upsertClinicProfile(clinicId, {
    logo_storage_path: storagePath,
    logo_uploaded_at: now,
  });

  return { storagePath };
}

export async function deleteClinicLogo(
  clinicId: string,
  storagePath?: string | null,
): Promise<void> {
  const supabase = getSupabaseClient();
  const path = storagePath ?? getClinicLogoStoragePath(clinicId);

  if (path) {
    const { error: removeError } = await supabase.storage.from(LOGO_BUCKET).remove([path]);
    if (removeError) throw removeError;
  }

  await upsertClinicProfile(clinicId, {
    logo_storage_path: null,
    logo_uploaded_at: null,
  });
}

export async function getClinicLogoSignedUrl(storagePath: string): Promise<string | null> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.storage
    .from(LOGO_BUCKET)
    .createSignedUrl(normalizeStoragePath(storagePath), 60 * 60);

  if (error) throw error;
  return data?.signedUrl ?? null;
}

export async function getClinicLogoDownloadRequest(storagePath: string): Promise<{
  url: string;
  headers: Record<string, string>;
}> {
  return {
    url: getAuthenticatedStorageUrl(storagePath),
    headers: await getAuthenticatedStorageHeaders(),
  };
}
