import { createClient, type SupabaseClient } from 'npm:@supabase/supabase-js@2';
import {
  DEFAULT_PINGRAM_API_URL,
  maskPhone,
  normalizeE164,
  pingramPost,
} from '../_shared/pingram.ts';
import { toGsmSafeSms } from '../_shared/sms.ts';
import {
  type CoverRequestOutcome,
  type OpenOffer,
  outcomeReply,
  parseSmsReply,
  selectOffer,
  SMS_REPLY_COPY,
  verifyPingramSignature,
} from '../_shared/smsReply.ts';

type Supabase = SupabaseClient;

type PingramWebhookEvent = {
  eventType?: string;
  from?: string;
  to?: string;
  text?: string;
  userId?: string;
  phone?: string;
};

const SMS_REPLY_TYPE = 'fill_in_sms_reply';
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const COVER_REQUEST_OUTCOMES = new Set<CoverRequestOutcome>([
  'requested',
  'already_requested',
  'already_confirmed',
  'shift_unavailable',
  'not_eligible',
]);

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function isSmsReplyEnabled(): boolean {
  return Deno.env.get('SMS_REPLY_ENABLED')?.trim().toLowerCase() === 'true';
}

async function claimEvent(supabase: Supabase, key: string): Promise<boolean> {
  const { error } = await supabase.from('notification_dispatch_log').insert({ idempotency_key: key });
  if (error?.code === '23505') return false;
  if (error) throw error;
  return true;
}

async function releaseEvent(supabase: Supabase, key: string): Promise<void> {
  const { error } = await supabase.from('notification_dispatch_log').delete().eq('idempotency_key', key);
  if (error) console.error(`[sms-inbound] could not release ${key}`, error);
}

async function sendReply(input: { to: string; from?: string; message: string }): Promise<void> {
  const apiKey = Deno.env.get('PINGRAM_API_KEY') ?? '';
  const apiBase = Deno.env.get('PINGRAM_API_URL') ?? DEFAULT_PINGRAM_API_URL;
  try {
    const trackingId = await pingramPost(apiKey, apiBase, '/sms', {
      type: SMS_REPLY_TYPE,
      to: input.to,
      message: toGsmSafeSms(input.message),
      ...(input.from ? { from: input.from } : {}),
    });
    console.log(
      `[sms-inbound] reply sent to=${maskPhone(input.to)} trackingId=${trackingId ?? 'none'}`,
    );
  } catch (error) {
    console.error(`[sms-inbound] reply failed to=${maskPhone(input.to)}`, error);
  }
}

/** Opted-in workers whose saved phone normalizes to this number. */
async function findWorkersByPhone(
  supabase: Supabase,
  phoneE164: string,
  options: { optedInOnly: boolean },
): Promise<string[]> {
  let query = supabase.from('worker_profiles').select('id, phone').not('phone', 'is', null);
  if (options.optedInOnly) query = query.eq('fill_in_sms_opt_in', true);
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? [])
    .filter((row) => normalizeE164(row.phone as string | null) === phoneE164)
    .map((row) => row.id as string);
}

async function listOpenOffers(supabase: Supabase, workerId: string): Promise<OpenOffer[]> {
  const { data, error } = await supabase
    .from('sms_fill_in_offers')
    .select('id, code, shift_post_id')
    .eq('worker_id', workerId)
    .is('used_at', null)
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as OpenOffer[];
}

async function clinicNameForShift(supabase: Supabase, shiftPostId: string): Promise<string> {
  const { data: shift } = await supabase
    .from('shift_posts')
    .select('clinic_id')
    .eq('id', shiftPostId)
    .maybeSingle();
  if (!shift?.clinic_id) return 'the clinic';
  const { data: clinic } = await supabase
    .from('clinic_profiles')
    .select('clinic_name')
    .eq('id', shift.clinic_id)
    .maybeSingle();
  return (clinic?.clinic_name as string | undefined)?.trim() || 'the clinic';
}

async function handleInboundSms(supabase: Supabase, event: PingramWebhookEvent): Promise<void> {
  const replyTo = event.from?.trim();
  const sender = normalizeE164(replyTo);
  if (!replyTo || !sender) {
    console.warn('[sms-inbound] SMS_INBOUND without a usable sender number');
    return;
  }
  const reply = (message: string) => sendReply({ to: replyTo, from: event.to, message });

  const parsed = parseSmsReply(event.text ?? '');
  if (parsed.kind === 'help') return reply(SMS_REPLY_COPY.help);
  if (parsed.kind === 'unknown') return reply(SMS_REPLY_COPY.unknown);
  if (!isSmsReplyEnabled()) return reply(SMS_REPLY_COPY.disabled);

  const workerIds = await findWorkersByPhone(supabase, sender, { optedInOnly: true });
  if (workerIds.length !== 1) {
    console.warn(
      `[sms-inbound] sender ${maskPhone(sender)} matched ${workerIds.length} opted-in workers`,
    );
    return reply(SMS_REPLY_COPY.unknownSender);
  }
  const workerId = workerIds[0]!;

  const selection = selectOffer(await listOpenOffers(supabase, workerId), parsed.code);
  if (selection.kind === 'none') return reply(SMS_REPLY_COPY.noOffers);
  if (selection.kind === 'code_not_found') return reply(SMS_REPLY_COPY.codeNotFound);
  if (selection.kind === 'ambiguous') return reply(SMS_REPLY_COPY.ambiguous);

  const { offer } = selection;
  const { data: outcome, error } = await supabase.rpc('request_shift_cover_from_sms', {
    p_worker_id: workerId,
    p_shift_post_id: offer.shift_post_id,
  });
  if (error || !COVER_REQUEST_OUTCOMES.has(outcome as CoverRequestOutcome)) {
    console.error(`[sms-inbound] request_shift_cover_from_sms failed (workerId=${workerId})`, error);
    await reply(SMS_REPLY_COPY.error);
    return;
  }

  const { error: usedError } = await supabase
    .from('sms_fill_in_offers')
    .update({ used_at: new Date().toISOString() })
    .eq('id', offer.id);
  if (usedError) console.error(`[sms-inbound] could not mark offer ${offer.id} used`, usedError);

  console.log(
    `[sms-inbound] cover request via SMS workerId=${workerId} shiftId=${offer.shift_post_id} outcome=${outcome}`,
  );
  await reply(
    outcomeReply(outcome as CoverRequestOutcome, await clinicNameForShift(supabase, offer.shift_post_id)),
  );
}

/** Keeps worker_profiles.fill_in_sms_opt_in in sync with Pingram's STOP/START suppression. */
async function handleSubscriptionChange(
  supabase: Supabase,
  event: PingramWebhookEvent,
  optIn: boolean,
): Promise<void> {
  const workerIds = new Set<string>();
  for (const candidate of [event.userId, event.phone, event.from, event.to]) {
    const value = candidate?.trim();
    if (!value) continue;
    if (UUID_PATTERN.test(value)) {
      workerIds.add(value.toLowerCase());
      continue;
    }
    const phone = normalizeE164(value);
    if (phone) {
      for (const id of await findWorkersByPhone(supabase, phone, { optedInOnly: false })) {
        workerIds.add(id);
      }
    }
  }

  if (workerIds.size === 0) {
    console.warn(`[sms-inbound] ${event.eventType}: no matching worker`);
    return;
  }

  const { error } = await supabase
    .from('worker_profiles')
    .update({ fill_in_sms_opt_in: optIn })
    .in('id', [...workerIds]);
  if (error) throw error;
  console.log(`[sms-inbound] ${event.eventType}: fill_in_sms_opt_in=${optIn} for ${workerIds.size} worker(s)`);
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  const secret = Deno.env.get('PINGRAM_WEBHOOK_SECRET') ?? '';
  if (!secret) {
    console.error('[sms-inbound] PINGRAM_WEBHOOK_SECRET not configured; rejecting webhook');
    return jsonResponse({ error: 'Webhook not configured' }, 503);
  }

  const rawBody = await req.text();
  const eventId = req.headers.get('x-pingram-id');
  const valid = await verifyPingramSignature({
    secret,
    id: eventId,
    timestamp: req.headers.get('x-pingram-timestamp'),
    signature: req.headers.get('x-pingram-signature'),
    rawBody,
  });
  if (!valid || !eventId) {
    return jsonResponse({ error: 'Invalid signature' }, 401);
  }

  let event: PingramWebhookEvent;
  try {
    event = JSON.parse(rawBody) as PingramWebhookEvent;
  } catch {
    return jsonResponse({ error: 'Invalid JSON' }, 400);
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!supabaseUrl || !serviceRoleKey) {
    return jsonResponse({ error: 'Supabase service configuration missing' }, 500);
  }
  const supabase = createClient(supabaseUrl, serviceRoleKey);

  const idempotencyKey = `pingram_webhook:${eventId}`;
  if (!(await claimEvent(supabase, idempotencyKey))) {
    return jsonResponse({ ok: true, duplicate: true });
  }

  try {
    switch (event.eventType) {
      case 'SMS_INBOUND':
        await handleInboundSms(supabase, event);
        break;
      case 'SMS_UNSUBSCRIBE':
        await handleSubscriptionChange(supabase, event, false);
        break;
      case 'SMS_SUBSCRIBE':
        await handleSubscriptionChange(supabase, event, true);
        break;
      default:
        break;
    }
    return jsonResponse({ ok: true });
  } catch (error) {
    console.error(`[sms-inbound] ${event.eventType ?? 'unknown'} failed`, error);
    await releaseEvent(supabase, idempotencyKey);
    return jsonResponse({ error: 'Webhook handling failed' }, 500);
  }
});
