import { createClient } from 'npm:@supabase/supabase-js@2';

import { deleteUserAccount } from '../_shared/accountDeletion.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const NO_EMAIL_CONFIRMATION = 'DELETE';

function jsonResponse(body: Record<string, unknown>, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function parseAllowlist(raw: string | undefined): Set<string> {
  return new Set(
    (raw ?? '')
      .split(',')
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean),
  );
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return jsonResponse({ error: 'Missing authorization header' }, 401);
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const adminEmails = parseAllowlist(Deno.env.get('ADMIN_EMAILS'));

    if (!supabaseUrl || !supabaseAnonKey || !serviceRoleKey) {
      return jsonResponse({ error: 'Server configuration error' }, 500);
    }

    if (adminEmails.size === 0) {
      return jsonResponse({ error: 'Admin allowlist is not configured' }, 500);
    }

    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const {
      data: { user },
      error: userError,
    } = await userClient.auth.getUser();

    if (userError || !user) {
      return jsonResponse({ error: 'Invalid or expired session' }, 401);
    }

    const callerEmail = user.email?.trim().toLowerCase() ?? '';
    if (!callerEmail || !adminEmails.has(callerEmail)) {
      return jsonResponse({ error: 'Forbidden' }, 403);
    }

    const body = (await req.json().catch(() => null)) as {
      userId?: unknown;
      confirmation?: unknown;
    } | null;
    const userId = typeof body?.userId === 'string' ? body.userId.trim() : '';
    const confirmation = typeof body?.confirmation === 'string' ? body.confirmation.trim() : '';

    if (!UUID_PATTERN.test(userId)) {
      return jsonResponse({ error: 'Invalid account id' }, 400);
    }

    if (userId === user.id) {
      return jsonResponse({ error: 'You cannot delete your own admin account here.' }, 400);
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { data: targetData, error: targetError } =
      await adminClient.auth.admin.getUserById(userId);
    const target = targetData?.user;
    if (targetError || !target) {
      return jsonResponse({ error: 'Account not found' }, 404);
    }

    const targetEmail = target.email?.trim().toLowerCase() ?? '';
    if (targetEmail && adminEmails.has(targetEmail)) {
      return jsonResponse({ error: 'Admin accounts cannot be deleted here.' }, 400);
    }

    const expected = targetEmail || NO_EMAIL_CONFIRMATION.toLowerCase();
    if (confirmation.toLowerCase() !== expected) {
      return jsonResponse({ error: 'Confirmation does not match this account.' }, 400);
    }

    const deleteError = await deleteUserAccount(adminClient, userId);
    if (deleteError) {
      return jsonResponse({ error: deleteError }, 500);
    }

    console.log(`[admin-delete-account] ${callerEmail} deleted ${userId} (${targetEmail || 'no email'})`);
    return jsonResponse({ success: true }, 200);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return jsonResponse({ error: message }, 500);
  }
});
