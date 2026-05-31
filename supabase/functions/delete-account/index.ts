import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const WORKER_BUCKETS = ['worker-resumes', 'worker-photos'] as const;
const CLINIC_BUCKETS = ['clinic-logos'] as const;

async function removeUserStorageObjects(
  adminClient: ReturnType<typeof createClient>,
  userId: string,
  buckets: readonly string[],
) {
  for (const bucket of buckets) {
    const { data: objects, error: listError } = await adminClient.storage.from(bucket).list(userId);
    if (listError) {
      console.warn(`Could not list ${bucket}/${userId}:`, listError.message);
      continue;
    }

    if (!objects?.length) continue;

    const paths = objects.map((object) => `${userId}/${object.name}`);
    const { error: removeError } = await adminClient.storage.from(bucket).remove(paths);
    if (removeError) {
      console.warn(`Could not remove ${bucket} objects for ${userId}:`, removeError.message);
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
      const { error: deactivateError } = await adminClient.rpc('deactivate_worker_account', {
        p_user_id: user.id,
      });
      if (deactivateError) {
        return new Response(JSON.stringify({ error: deactivateError.message }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      await removeUserStorageObjects(adminClient, user.id, WORKER_BUCKETS);
    } else if (role === 'clinic') {
      const { error: deactivateError } = await adminClient.rpc('deactivate_clinic_account', {
        p_user_id: user.id,
      });
      if (deactivateError) {
        return new Response(JSON.stringify({ error: deactivateError.message }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      await removeUserStorageObjects(adminClient, user.id, CLINIC_BUCKETS);
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
