import { createClient } from 'npm:@supabase/supabase-js@2';

import {
  fetchRevenueCatSubscriber,
  resolveClinicSubscriptionFromSubscriber,
  type ResolvedClinicPlan,
  type ResolvedClinicSubscription,
} from '../_shared/revenuecat.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

type ExistingSubscriptionRow = {
  plan: ResolvedClinicPlan;
  status: ResolvedClinicSubscription['status'];
  current_period_end: string | null;
};

function isPaidPlan(plan: ResolvedClinicPlan): boolean {
  return plan !== 'free';
}

function isInPeriodPaidRow(row: ExistingSubscriptionRow | null): boolean {
  if (!row || !isPaidPlan(row.plan) || row.status === 'expired') return false;
  if (!row.current_period_end) return true;
  return new Date(row.current_period_end).getTime() > Date.now();
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
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

    const { data: profile, error: profileError } = await userClient
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle();

    if (profileError || profile?.role !== 'clinic') {
      return new Response(JSON.stringify({ error: 'Only clinic accounts can sync subscriptions' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const subscriber = await fetchRevenueCatSubscriber(user.id);
    const resolved = resolveClinicSubscriptionFromSubscriber(subscriber);

    if (resolved.plan === 'free') {
      console.warn('[revenuecat-sync] resolved free from RevenueCat lookup', {
        appUserId: user.id,
        status: resolved.status,
        originalAppUserId: subscriber.subscriber?.original_app_user_id ?? null,
        entitlementKeys: Object.keys(subscriber.subscriber?.entitlements ?? {}),
      });
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { data: existingRow } = await adminClient
      .from('clinic_subscriptions')
      .select('plan, status, current_period_end')
      .eq('clinic_id', user.id)
      .maybeSingle();

    const existing = (existingRow as ExistingSubscriptionRow | null) ?? null;

    // Avoid wiping a still-valid paid DB row when RC returns empty/free (desync / lookup gap).
    if (
      !isPaidPlan(resolved.plan) &&
      isInPeriodPaidRow(existing)
    ) {
      console.warn('[revenuecat-sync] preserving in-period paid DB row; RC resolved free', {
        appUserId: user.id,
        dbPlan: existing?.plan,
        dbStatus: existing?.status,
        dbPeriodEnd: existing?.current_period_end,
      });

      return new Response(
        JSON.stringify({
          plan: existing!.plan,
          status: existing!.status,
          source: 'db_preserved',
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      );
    }

    const { error: upsertError } = await adminClient.rpc('upsert_clinic_subscription', {
      p_clinic_id: user.id,
      p_plan: resolved.plan,
      p_status: resolved.status,
      p_current_period_end: resolved.currentPeriodEnd,
      p_provider_customer_id: subscriber.subscriber?.original_app_user_id ?? user.id,
    });

    if (upsertError) {
      console.error('[revenuecat-sync] upsert failed', upsertError.message);
      return new Response(JSON.stringify({ error: 'Could not sync subscription' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(
      JSON.stringify({
        plan: resolved.plan,
        status: resolved.status,
        source: 'revenuecat',
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[revenuecat-sync]', message);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
