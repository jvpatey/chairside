import type { createClient } from 'npm:@supabase/supabase-js@2';

type AdminClient = ReturnType<typeof createClient>;

const WORKER_BUCKETS = ['worker-resumes', 'worker-photos'] as const;
const CLINIC_BUCKETS = ['clinic-logos', 'clinic-doctor-photos', 'clinic-member-photos'] as const;

/** Recursively remove all objects under a storage prefix via the Storage API. */
async function removeStoragePrefix(adminClient: AdminClient, bucket: string, prefix: string) {
  const { data: entries, error: listError } = await adminClient.storage.from(bucket).list(prefix, {
    limit: 1000,
  });

  if (listError) {
    console.warn(`Could not list ${bucket}/${prefix}:`, listError.message);
    return;
  }

  if (!entries?.length) return;

  const filePaths: string[] = [];

  for (const entry of entries) {
    const path = prefix ? `${prefix}/${entry.name}` : entry.name;
    // Folders from the Storage API have a null id.
    if (entry.id == null) {
      await removeStoragePrefix(adminClient, bucket, path);
      continue;
    }
    filePaths.push(path);
  }

  if (filePaths.length === 0) return;

  const { error: removeError } = await adminClient.storage.from(bucket).remove(filePaths);
  if (removeError) {
    console.warn(`Could not remove ${bucket} objects under ${prefix}:`, removeError.message);
  }
}

async function removeStoragePrefixes(
  adminClient: AdminClient,
  buckets: readonly string[],
  prefixes: string[],
) {
  const unique = [...new Set(prefixes.filter(Boolean))];
  for (const bucket of buckets) {
    for (const prefix of unique) {
      await removeStoragePrefix(adminClient, bucket, prefix);
    }
  }
}

/**
 * Full account teardown: storage cleanup, role-specific deactivation RPC, then auth user delete.
 * Returns an error message on failure, or null on success.
 */
export async function deleteUserAccount(
  adminClient: AdminClient,
  userId: string,
): Promise<string | null> {
  const { data: profile, error: profileError } = await adminClient
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .maybeSingle();

  if (profileError) return profileError.message;

  const role = (profile as { role?: string | null } | null)?.role;

  if (role === 'worker') {
    await removeStoragePrefixes(adminClient, WORKER_BUCKETS, [userId]);

    const { error } = await adminClient.rpc('deactivate_worker_account', { p_user_id: userId });
    if (error) return error.message;
  } else if (role === 'clinic') {
    const { data: membership } = await adminClient
      .from('clinic_memberships')
      .select('id, organization_id, role')
      .eq('user_id', userId)
      .eq('status', 'active')
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle();

    const storagePrefixes = [userId];
    const organizationId = (membership as { organization_id?: string | null } | null)
      ?.organization_id;
    if (organizationId) storagePrefixes.push(organizationId);

    // Clean storage via Storage API before DB teardown.
    await removeStoragePrefixes(adminClient, CLINIC_BUCKETS, storagePrefixes);

    const { error } = await adminClient.rpc('deactivate_clinic_account', { p_user_id: userId });
    if (error) return error.message;
  }

  const { error: deleteError } = await adminClient.auth.admin.deleteUser(userId);
  return deleteError ? deleteError.message : null;
}
