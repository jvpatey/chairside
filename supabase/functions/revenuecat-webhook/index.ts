import { createClient } from 'npm:@supabase/supabase-js@2';

import {
  fetchRevenueCatSubscriber,
  mapWebhookStatus,
  resolveClinicSubscriptionFromSubscriber,
} from '../_shared/revenuecat.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

type RevenueCatWebhookEvent = {
  type?: string;
  app_user_id?: string;
  original_app_user_id?: string;
  expiration_at_ms?: number | null;
};

type RevenueCatWebhookBody = {
  event?: RevenueCatWebhookEvent;
};

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
    const webhookSecret = Deno.env.get('REVENUECAT_WEBHOOK_SECRET');
    if (webhookSecret) {
      const authHeader = req.headers.get('Authorization');
      if (authHeader !== `Bearer ${webhookSecret}`) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!supabaseUrl || !serviceRoleKey) {
      return new Response(JSON.stringify({ error: 'Server configuration error' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body = (await req.json()) as RevenueCatWebhookBody;
    const event = body.event;
    const clinicId = event?.app_user_id ?? event?.original_app_user_id;

    if (!clinicId) {
      return new Response(JSON.stringify({ error: 'Missing app user id' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { data: profile } = await adminClient
      .from('profiles')
      .select('role')
      .eq('id', clinicId)
      .maybeSingle();

    if (profile?.role !== 'clinic') {
      return new Response(JSON.stringify({ ok: true, ignored: true }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const subscriber = await fetchRevenueCatSubscriber(clinicId);
    const status = mapWebhookStatus(event?.type ?? 'RENEWAL');
    const resolved = resolveClinicSubscriptionFromSubscriber(subscriber, status);

    if (event?.expiration_at_ms) {
      resolved.currentPeriodEnd = new Date(event.expiration_at_ms).toISOString();
    }

    const { error: upsertError } = await adminClient.rpc('upsert_clinic_subscription', {
      p_clinic_id: clinicId,
      p_plan: resolved.plan,
      p_status: resolved.status,
      p_current_period_end: resolved.currentPeriodEnd,
      p_provider_customer_id: subscriber.subscriber?.original_app_user_id ?? clinicId,
    });

    if (upsertError) {
      console.error('[revenuecat-webhook] upsert failed', upsertError.message);
      return new Response(JSON.stringify({ error: 'Could not update subscription' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ ok: true, plan: resolved.plan, status: resolved.status }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[revenuecat-webhook]', message);
    return new Response(JSON.stringify({ error: 'Webhook processing failed' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
