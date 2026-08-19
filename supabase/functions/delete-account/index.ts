import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const WORKER_BUCKETS = ['worker-resumes', 'worker-photos'] as const;
const CLINIC_BUCKETS = ['clinic-logos', 'clinic-doctor-photos', 'clinic-member-photos'] as const;

type AdminClient = ReturnType<typeof createClient>;

/** Recursively remove all objects under a storage prefix via the Storage API. */
async function removeStoragePrefix(
  adminClient: AdminClient,
  bucket: string,
  prefix: string,
) {
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

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Missing authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseAnonKey || !serviceRoleKey) {
      return new Response(JSON.stringify({ error: 'Server configuration error' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const {
      data: { user },
      error: userError,
    } = await userClient.auth.getUser();

    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid or expired session' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { data: profile, error: profileError } = await adminClient
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle();

    if (profileError) {
      return new Response(JSON.stringify({ error: profileError.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const role = profile?.role;

    if (role === 'worker') {
      await removeStoragePrefixes(adminClient, WORKER_BUCKETS, [user.id]);

      const { error: deactivateError } = await adminClient.rpc('deactivate_worker_account', {
        p_user_id: user.id,
      });
      if (deactivateError) {
        return new Response(JSON.stringify({ error: deactivateError.message }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    } else if (role === 'clinic') {
      const { data: membership } = await adminClient
        .from('clinic_memberships')
        .select('id, organization_id, role')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .order('created_at', { ascending: true })
        .limit(1)
        .maybeSingle();

      const storagePrefixes = [user.id];
      if (membership?.organization_id) {
        storagePrefixes.push(membership.organization_id);
      }

      // Clean storage via Storage API before DB teardown.
      await removeStoragePrefixes(adminClient, CLINIC_BUCKETS, storagePrefixes);

      const { error: deactivateError } = await adminClient.rpc('deactivate_clinic_account', {
        p_user_id: user.id,
      });
      if (deactivateError) {
        return new Response(JSON.stringify({ error: deactivateError.message }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    const { error: deleteError } = await adminClient.auth.admin.deleteUser(user.id);

    if (deleteError) {
      return new Response(JSON.stringify({ error: deleteError.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
