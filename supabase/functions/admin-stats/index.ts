import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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

function daysAgoIso(days: number): string {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
}

type WorkerRow = {
  id: string;
  role_type: string | null;
  role_types: string[] | null;
};

type ClinicRow = {
  id: string;
  clinic_name: string | null;
  account_type: string | null;
  created_at: string | null;
};

type SubscriptionRow = {
  clinic_id: string;
  plan: string;
  status: string;
  current_period_end: string | null;
};

type ProfileRow = {
  id: string;
  role: string | null;
  display_name: string | null;
  first_name: string | null;
  last_name: string | null;
  created_at: string;
};

type AuthMeta = {
  email: string | null;
  signedUpAt: string | null;
  lastSignInAt: string | null;
};

function resolveWorkerRoles(worker: Pick<WorkerRow, 'role_type' | 'role_types'>): string[] {
  if (Array.isArray(worker.role_types) && worker.role_types.length > 0) {
    return worker.role_types.filter((role): role is string => typeof role === 'string' && role.length > 0);
  }
  if (typeof worker.role_type === 'string' && worker.role_type.length > 0) {
    return [worker.role_type];
  }
  return ['unknown'];
}

function resolveDisplayName(profile: ProfileRow | undefined, email: string | null): string {
  const display = profile?.display_name?.trim();
  if (display) return display;
  const combined = [profile?.first_name, profile?.last_name]
    .map((part) => part?.trim())
    .filter(Boolean)
    .join(' ');
  if (combined) return combined;
  if (email) return email.split('@')[0] || email;
  return 'Unnamed professional';
}

async function fetchAuthMetaByUserIds(
  adminClient: ReturnType<typeof createClient>,
  userIds: string[],
): Promise<Map<string, AuthMeta>> {
  const wanted = new Set(userIds);
  const meta = new Map<string, AuthMeta>();
  if (wanted.size === 0) return meta;

  let page = 1;
  const perPage = 1000;

  while (meta.size < wanted.size) {
    const { data, error } = await adminClient.auth.admin.listUsers({ page, perPage });
    if (error) {
      throw error;
    }

    const users = data.users ?? [];
    for (const user of users) {
      if (!wanted.has(user.id)) continue;
      meta.set(user.id, {
        email: user.email?.trim() || null,
        signedUpAt: user.created_at ?? null,
        lastSignInAt: user.last_sign_in_at ?? null,
      });
    }

    if (users.length < perPage) break;
    page += 1;
    if (page > 50) break;
  }

  return meta;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'GET' && req.method !== 'POST') {
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

    const email = user.email?.trim().toLowerCase() ?? '';
    if (!email || !adminEmails.has(email)) {
      return jsonResponse({ error: 'Forbidden' }, 403);
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const sevenDaysAgo = daysAgoIso(7);
    const thirtyDaysAgo = daysAgoIso(30);

    const [
      workersResult,
      clinicsResult,
      subscriptionsResult,
      openRolesResult,
      filledRolesResult,
      liveFillInsResult,
      filledFillInsResult,
      profilesResult,
    ] = await Promise.all([
      adminClient
        .from('worker_profiles')
        .select('id, role_type, role_types')
        .not('setup_completed_at', 'is', null),
      adminClient
        .from('clinic_profiles')
        .select('id, clinic_name, account_type, created_at')
        .not('setup_completed_at', 'is', null),
      adminClient
        .from('clinic_subscriptions')
        .select('clinic_id, plan, status, current_period_end'),
      adminClient
        .from('job_posts')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'live')
        .is('clinic_account_deleted_at', null),
      adminClient
        .from('job_posts')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'filled')
        .is('clinic_account_deleted_at', null),
      adminClient
        .from('shift_posts')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'live')
        .is('clinic_account_deleted_at', null),
      adminClient
        .from('shift_posts')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'filled')
        .is('clinic_account_deleted_at', null),
      adminClient
        .from('profiles')
        .select('id, role, display_name, first_name, last_name, created_at'),
    ]);

    const queryError =
      workersResult.error ??
      clinicsResult.error ??
      subscriptionsResult.error ??
      openRolesResult.error ??
      filledRolesResult.error ??
      liveFillInsResult.error ??
      filledFillInsResult.error ??
      profilesResult.error;

    if (queryError) {
      return jsonResponse({ error: queryError.message }, 500);
    }

    const workers = (workersResult.data ?? []) as WorkerRow[];
    const clinics = (clinicsResult.data ?? []) as ClinicRow[];
    const subscriptions = (subscriptionsResult.data ?? []) as SubscriptionRow[];
    const profiles = (profilesResult.data ?? []) as ProfileRow[];
    const profileById = new Map(profiles.map((profile) => [profile.id, profile] as const));

    const authMeta = await fetchAuthMetaByUserIds(adminClient, [
      ...clinics.map((clinic) => clinic.id),
      ...workers.map((worker) => worker.id),
    ]);

    const roleCounts = new Map<string, number>();
    for (const worker of workers) {
      for (const role of resolveWorkerRoles(worker)) {
        roleCounts.set(role, (roleCounts.get(role) ?? 0) + 1);
      }
    }

    const professionalsByRole = [...roleCounts.entries()]
      .map(([role, count]) => ({ role, count }))
      .sort((a, b) => b.count - a.count || a.role.localeCompare(b.role));

    const subscriptionByClinic = new Map(
      subscriptions.map((row) => [row.clinic_id, row] as const),
    );

    const planCounts = new Map<string, number>();
    const statusCounts = new Map<string, number>();

    const clinicRows = clinics
      .map((clinic) => {
        const sub = subscriptionByClinic.get(clinic.id);
        const plan = sub?.plan ?? 'free';
        const status = sub?.status ?? 'active';
        const auth = authMeta.get(clinic.id);
        planCounts.set(plan, (planCounts.get(plan) ?? 0) + 1);
        statusCounts.set(status, (statusCounts.get(status) ?? 0) + 1);
        return {
          id: clinic.id,
          clinicName: clinic.clinic_name?.trim() || 'Unnamed clinic',
          accountType: clinic.account_type === 'group' ? 'group' : 'individual',
          plan,
          status,
          currentPeriodEnd: sub?.current_period_end ?? null,
          signedUpAt: auth?.signedUpAt ?? clinic.created_at,
          lastSignInAt: auth?.lastSignInAt ?? null,
        };
      })
      .sort((a, b) => a.clinicName.localeCompare(b.clinicName));

    const professionalRows = workers
      .map((worker) => {
        const profile = profileById.get(worker.id);
        const auth = authMeta.get(worker.id);
        const roles = resolveWorkerRoles(worker);
        return {
          id: worker.id,
          name: resolveDisplayName(profile, auth?.email ?? null),
          email: auth?.email ?? null,
          roles,
          signedUpAt: auth?.signedUpAt ?? profile?.created_at ?? null,
          lastSignInAt: auth?.lastSignInAt ?? null,
        };
      })
      .sort((a, b) => a.name.localeCompare(b.name));

    const planMix = [...planCounts.entries()]
      .map(([plan, count]) => ({ plan, count }))
      .sort((a, b) => b.count - a.count || a.plan.localeCompare(b.plan));

    const statusMix = [...statusCounts.entries()]
      .map(([status, count]) => ({ status, count }))
      .sort((a, b) => b.count - a.count || a.status.localeCompare(b.status));

    const signups7d = profiles.filter((p) => p.created_at >= sevenDaysAgo).length;
    const signups30d = profiles.filter((p) => p.created_at >= thirtyDaysAgo).length;

    return jsonResponse(
      {
        generatedAt: new Date().toISOString(),
        kpis: {
          professionals: workers.length,
          clinics: clinics.length,
          openRoles: openRolesResult.count ?? 0,
          filledRoles: filledRolesResult.count ?? 0,
          liveFillIns: liveFillInsResult.count ?? 0,
          filledFillIns: filledFillInsResult.count ?? 0,
          signups7d,
          signups30d,
        },
        professionalsByRole,
        planMix,
        statusMix,
        clinics: clinicRows,
        professionals: professionalRows,
      },
      200,
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return jsonResponse({ error: message }, 500);
  }
});
