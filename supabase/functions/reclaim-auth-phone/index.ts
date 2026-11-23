import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function toE164(phone: string): string | null {
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith('1')) return `+${digits}`;
  if (phone.trim().startsWith('+') && digits.length >= 10) return `+${digits}`;
  return null;
}

function toStorageDigits(phone: string): string | null {
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 11 && digits.startsWith('1')) return digits.slice(1);
  if (digits.length === 10) return digits;
  return null;
}

type AuthPhoneRow = { user_id: string; email: string | null; phone: string | null };

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
    if (!supabaseUrl || !supabaseAnonKey || !serviceRoleKey) {
      return jsonResponse({ error: 'Server configuration error' }, 500);
    }

    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    const {
      data: { user },
      error: userError,
    } = await userClient.auth.getUser();
    if (userError || !user) {
      return jsonResponse({ error: 'Invalid or expired session' }, 401);
    }

    const body = (await req.json().catch(() => null)) as {
      phone?: unknown;
      action?: unknown;
    } | null;
    const phoneRaw = typeof body?.phone === 'string' ? body.phone : '';
    const action = body?.action === 'resolve_shell_login' ? 'resolve_shell_login' : 'reclaim';
    const e164 = toE164(phoneRaw);
    const digits = toStorageDigits(phoneRaw);
    if (!e164 || !digits) {
      return jsonResponse({ error: 'Enter a valid 10-digit mobile number.' }, 400);
    }

    const { data: authRows, error: authLookupError } = await adminClient.rpc(
      'find_auth_user_by_phone',
      { p_phone: e164 },
    );
    if (authLookupError) {
      return jsonResponse({ error: authLookupError.message }, 500);
    }

    const authMatch = (Array.isArray(authRows) ? authRows[0] : null) as AuthPhoneRow | null;

    if (action === 'resolve_shell_login') {
      // Phone OTP signed into a shell account — free the number if a real profile owns it.
      const { data: ownerId, error: ownerError } = await adminClient.rpc(
        'find_worker_user_id_by_phone_digits',
        { p_digits: digits },
      );
      if (ownerError) {
        return jsonResponse({ error: ownerError.message }, 500);
      }

      const realOwnerId = typeof ownerId === 'string' ? ownerId : null;
      if (!realOwnerId || realOwnerId === user.id) {
        return jsonResponse({ status: 'ok' });
      }

      const { data: callerProfile } = await adminClient
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .maybeSingle();

      const isShell = !callerProfile?.role;
      if (!isShell) {
        return jsonResponse({ status: 'ok' });
      }

      // Delete the empty phone-only shell so the real account can keep/bind this number.
      const { error: deleteError } = await adminClient.auth.admin.deleteUser(user.id);
      if (deleteError) {
        return jsonResponse({ error: deleteError.message }, 500);
      }

      return jsonResponse({
        status: 'conflict',
        message:
          'That number belongs to an existing account. Sign in with email, open Profile, and verify your mobile so phone sign-in works.',
      });
    }

    // reclaim — caller wants to bind this phone onto their current Auth user.
    if (!authMatch) {
      return jsonResponse({ status: 'available' });
    }
    if (authMatch.user_id === user.id) {
      return jsonResponse({ status: 'owned' });
    }

    const { data: otherProfile } = await adminClient
      .from('profiles')
      .select('role')
      .eq('id', authMatch.user_id)
      .maybeSingle();

    const otherEmail = authMatch.email?.trim() ?? '';
    const isShell = !otherProfile?.role && !otherEmail;
    if (!isShell) {
      return jsonResponse(
        {
          status: 'taken',
          error:
            'That number is already linked to another account. Sign in the way you first registered, or use a different number.',
        },
        409,
      );
    }

    const { error: deleteError } = await adminClient.auth.admin.deleteUser(authMatch.user_id);
    if (deleteError) {
      return jsonResponse({ error: deleteError.message }, 500);
    }

    return jsonResponse({ status: 'reclaimed' });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected error';
    return jsonResponse({ error: message }, 500);
  }
});
