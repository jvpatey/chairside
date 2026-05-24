import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, x-supabase-webhook-secret',
};

type WebhookPayload = {
  type: 'INSERT' | 'UPDATE' | 'DELETE';
  table: string;
  schema: string;
  record: Record<string, unknown>;
  old_record: Record<string, unknown> | null;
};

/** Pingram API channel identifiers (see https://www.pingram.io/docs/reference/node) */
type PingramForceChannel = 'INAPP_WEB' | 'PUSH' | 'SMS';

type PingramSendBody = {
  type: string;
  to: { id: string; number?: string };
  inapp?: { title: string; url?: string };
  mobile_push?: { title: string; message: string };
  sms?: { message: string };
  forceChannels: PingramForceChannel[];
  secondaryId?: string;
};

const PINGRAM_TYPES = {
  applicationReceived: 'application_received',
  applicationReviewed: 'application_reviewed',
  applicationInProgress: 'application_in_progress',
  applicationSelected: 'application_selected',
  applicationRejected: 'application_rejected',
  applicationHired: 'application_hired',
  fillInPosted: 'fill_in_posted',
  jobPosted: 'job_posted',
} as const;

const DEFAULT_PINGRAM_API_URL = 'https://api.ca.pingram.io';

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function normalizeE164(phone: string | null | undefined): string | null {
  if (!phone?.trim()) return null;
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith('1')) return `+${digits}`;
  if (phone.startsWith('+') && digits.length >= 10) return `+${digits}`;
  return null;
}

function shiftWeekday(shiftDate: string): number {
  const d = new Date(`${shiftDate}T12:00:00`);
  return d.getDay();
}

function buildSendBody(input: {
  type: string;
  userId: string;
  phone?: string | null;
  title: string;
  message?: string;
  deepLink: string;
  secondaryId: string;
  includePush?: boolean;
  includeSms?: boolean;
  smsMessage?: string;
}): PingramSendBody {
  const sendPush = (input.includePush ?? true) && Boolean(input.message);
  const forceChannels: PingramForceChannel[] = ['INAPP_WEB'];
  if (sendPush) {
    forceChannels.push('PUSH');
  }
  if (input.includeSms && input.smsMessage && input.phone) {
    forceChannels.push('SMS');
  }

  const body: PingramSendBody = {
    type: input.type,
    to: { id: input.userId },
    inapp: { title: input.title, url: input.deepLink },
    forceChannels,
    secondaryId: input.secondaryId,
  };

  if (sendPush && input.message) {
    body.mobile_push = { title: input.title, message: input.message };
  }

  if (input.includeSms && input.smsMessage && input.phone) {
    body.to.number = input.phone;
    body.sms = { message: input.smsMessage };
  }

  return body;
}

async function pingramSend(apiKey: string, apiBase: string, body: PingramSendBody) {
  const res = await fetch(`${apiBase.replace(/\/$/, '')}/send`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Pingram send failed (${res.status}): ${text}`);
  }
}

async function claimIdempotency(
  supabase: ReturnType<typeof createClient>,
  key: string,
): Promise<boolean> {
  const { error } = await supabase.from('notification_dispatch_log').insert({ idempotency_key: key });
  if (error?.code === '23505') return false;
  if (error) throw error;
  return true;
}

async function sendWorkerStatusNotification(
  supabase: ReturnType<typeof createClient>,
  pingramKey: string,
  pingramBase: string,
  application: Record<string, unknown>,
  status: string,
) {
  const workerId = application.worker_id as string;
  const applicationId = application.id as string;
  const isShift = Boolean(application.shift_post_id);
  const typeMap: Record<string, { pingramType: string; title: string; message: string }> = {
    reviewed: {
      pingramType: PINGRAM_TYPES.applicationReviewed,
      title: isShift ? 'Cover request viewed' : 'Application viewed',
      message: isShift
        ? 'A clinic has viewed your cover request.'
        : 'A clinic has viewed your application.',
    },
    in_progress: {
      pingramType: PINGRAM_TYPES.applicationInProgress,
      title: isShift ? 'Cover request update' : 'Application update',
      message: isShift
        ? 'A clinic is reviewing your cover request.'
        : 'A clinic is considering your application.',
    },
    selected: {
      pingramType: PINGRAM_TYPES.applicationSelected,
      title: 'You have been selected',
      message: 'A clinic has selected you for this role.',
    },
    rejected: {
      pingramType: PINGRAM_TYPES.applicationRejected,
      title: isShift ? 'Cover request update' : 'Application update',
      message: isShift
        ? 'A clinic has declined your cover request.'
        : 'A clinic has declined your application.',
    },
    hired: {
      pingramType: PINGRAM_TYPES.applicationHired,
      title: 'Shift confirmed',
      message: 'A clinic has confirmed you for this fill-in shift.',
    },
  };
  const template = typeMap[status];
  if (!template) return;

  const idempotencyKey = `${template.pingramType}:${applicationId}:${status}`;
  if (!(await claimIdempotency(supabase, idempotencyKey))) return;

  const deepLink = `chairside:///(tabs)/application/${applicationId}`;
  await pingramSend(
    pingramKey,
    pingramBase,
    buildSendBody({
      type: template.pingramType,
      userId: workerId,
      title: template.title,
      message: template.message,
      deepLink,
      secondaryId: idempotencyKey,
    }),
  );
}

async function handleApplicationInsert(
  supabase: ReturnType<typeof createClient>,
  pingramKey: string,
  pingramBase: string,
  record: Record<string, unknown>,
) {
  const applicationId = record.id as string;
  const jobPostId = record.job_post_id as string | null;
  const shiftPostId = record.shift_post_id as string | null;

  let clinicId: string | null = null;
  let postTitle = 'your posting';
  let postType = 'role';

  if (jobPostId) {
    const { data: job } = await supabase
      .from('job_posts')
      .select('clinic_id, title')
      .eq('id', jobPostId)
      .maybeSingle();
    if (job) {
      clinicId = job.clinic_id;
      postTitle = job.title;
      postType = 'job';
    }
  } else if (shiftPostId) {
    const { data: shift } = await supabase
      .from('shift_posts')
      .select('clinic_id, shift_date')
      .eq('id', shiftPostId)
      .maybeSingle();
    if (shift) {
      clinicId = shift.clinic_id;
      postTitle = `Fill-in · ${shift.shift_date}`;
      postType = 'fill-in';
    }
  }

  if (!clinicId) return;

  const workerName = (record.worker_display_name as string | null)?.trim() || 'A worker';
  const isShiftRequest = Boolean(shiftPostId);
  const idempotencyKey = `${PINGRAM_TYPES.applicationReceived}:${applicationId}`;
  if (!(await claimIdempotency(supabase, idempotencyKey))) return;

  const title = isShiftRequest
    ? `New cover request · ${postTitle}`
    : `New applicant · ${postTitle}`;
  const message = isShiftRequest
    ? `${workerName} requested to cover your ${postType}.`
    : `${workerName} applied to your ${postType}.`;
  const deepLink = 'chairside:///(clinic-tabs)/applications';

  await pingramSend(
    pingramKey,
    pingramBase,
    buildSendBody({
      type: PINGRAM_TYPES.applicationReceived,
      userId: clinicId,
      title,
      message,
      deepLink,
      secondaryId: idempotencyKey,
    }),
  );
}

async function handleApplicationUpdate(
  supabase: ReturnType<typeof createClient>,
  pingramKey: string,
  pingramBase: string,
  record: Record<string, unknown>,
  oldRecord: Record<string, unknown> | null,
) {
  const oldStatus = oldRecord?.status as string | undefined;
  const newStatus = record.status as string;
  if (!newStatus || oldStatus === newStatus) return;
  if (!['reviewed', 'in_progress', 'selected', 'rejected', 'hired'].includes(newStatus)) return;
  await sendWorkerStatusNotification(supabase, pingramKey, pingramBase, record, newStatus);
}

async function listFillInRecipients(
  supabase: ReturnType<typeof createClient>,
  shift: { role_type: string; shift_date: string },
) {
  const weekday = shiftWeekday(shift.shift_date);

  const { data: workers, error } = await supabase
    .from('worker_profiles')
    .select(
      'id, role_type, fill_in_notification_mode, short_notice_available, fill_in_sms_opt_in, phone, setup_completed_at',
    )
    .eq('short_notice_available', true)
    .neq('fill_in_notification_mode', 'off')
    .not('setup_completed_at', 'is', null);

  if (error) throw error;
  if (!workers?.length) return [];

  const roleMatched = workers.filter(
    (w) => w.role_type && w.role_type === shift.role_type,
  );

  const availableDaysOnly = roleMatched.filter(
    (w) => w.fill_in_notification_mode === 'available_days_only',
  );
  const alwaysNotify = roleMatched.filter((w) => w.fill_in_notification_mode === 'all');

  if (availableDaysOnly.length === 0) {
    return alwaysNotify;
  }

  const ids = availableDaysOnly.map((w) => w.id);
  const { data: blocks, error: blockError } = await supabase
    .from('availability_blocks')
    .select('worker_id')
    .in('worker_id', ids)
    .eq('day_of_week', weekday);

  if (blockError) throw blockError;

  const withSchedule = new Set((blocks ?? []).map((b) => b.worker_id));
  const scheduledWorkers = availableDaysOnly.filter((w) => withSchedule.has(w.id));

  const seen = new Set<string>();
  const merged = [...alwaysNotify, ...scheduledWorkers];
  return merged.filter((w) => {
    if (seen.has(w.id)) return false;
    seen.add(w.id);
    return true;
  });
}

async function handleShiftPostLive(
  supabase: ReturnType<typeof createClient>,
  pingramKey: string,
  pingramBase: string,
  record: Record<string, unknown>,
) {
  const shiftId = record.id as string;
  const clinicId = record.clinic_id as string;
  const shiftDate = record.shift_date as string;
  const roleType = record.role_type as string;

  const { data: clinic } = await supabase
    .from('clinic_profiles')
    .select('clinic_name, city')
    .eq('id', clinicId)
    .maybeSingle();

  const clinicName = clinic?.clinic_name?.trim() || 'A clinic';
  const cityLabel = clinic?.city ? ` · ${clinic.city}` : '';
  const recipients = await listFillInRecipients(supabase, {
    role_type: roleType,
    shift_date: shiftDate,
  });

  for (const worker of recipients) {
    const idempotencyKey = `${PINGRAM_TYPES.fillInPosted}:${shiftId}:${worker.id}`;
    if (!(await claimIdempotency(supabase, idempotencyKey))) continue;

    const title = `New fill-in · ${clinicName}`;
    const message = `${clinicName}${cityLabel} posted a fill-in on ${shiftDate}.`;
    const deepLink = 'chairside:///(tabs)/fillins';
    const smsOptIn = worker.fill_in_sms_opt_in === true;
    const e164 = smsOptIn ? normalizeE164(worker.phone as string | null) : null;

    await pingramSend(
      pingramKey,
      pingramBase,
      buildSendBody({
        type: PINGRAM_TYPES.fillInPosted,
        userId: worker.id,
        phone: e164 ?? undefined,
        title,
        message,
        deepLink,
        secondaryId: idempotencyKey,
        includeSms: Boolean(smsOptIn && e164),
        smsMessage: `${message} Open Chairside to apply. Reply STOP to opt out.`,
      }),
    );
  }
}

async function handleJobPostLive(
  supabase: ReturnType<typeof createClient>,
  pingramKey: string,
  pingramBase: string,
  record: Record<string, unknown>,
) {
  const jobId = record.id as string;
  const clinicId = record.clinic_id as string;
  const roleType = record.role_type as string;
  const title = record.title as string;

  const { data: clinic } = await supabase
    .from('clinic_profiles')
    .select('clinic_name, city')
    .eq('id', clinicId)
    .maybeSingle();

  const clinicName = clinic?.clinic_name?.trim() || 'A clinic';
  const cityLabel = clinic?.city ? ` · ${clinic.city}` : '';

  const { data: workers, error } = await supabase
    .from('worker_profiles')
    .select('id')
    .eq('job_notification_opt_in', true)
    .eq('role_type', roleType)
    .not('setup_completed_at', 'is', null);

  if (error) throw error;

  for (const worker of workers ?? []) {
    const idempotencyKey = `${PINGRAM_TYPES.jobPosted}:${jobId}:${worker.id}`;
    if (!(await claimIdempotency(supabase, idempotencyKey))) continue;

    const notifTitle = `New role · ${title}`;
    const message = `${clinicName}${cityLabel} posted ${title}.`;
    const deepLink = 'chairside:///(tabs)/browse';

    await pingramSend(
      pingramKey,
      pingramBase,
      buildSendBody({
        type: PINGRAM_TYPES.jobPosted,
        userId: worker.id,
        title: notifTitle,
        message,
        deepLink,
        secondaryId: idempotencyKey,
      }),
    );
  }
}

function becameLive(
  record: Record<string, unknown>,
  oldRecord: Record<string, unknown> | null,
): boolean {
  const status = record.status as string;
  if (status !== 'live') return false;
  const oldStatus = oldRecord?.status as string | undefined;
  return oldStatus !== 'live';
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  try {
    const webhookSecret = Deno.env.get('NOTIFY_WEBHOOK_SECRET');
    const providedSecret =
      req.headers.get('x-supabase-webhook-secret') ?? req.headers.get('x-webhook-secret');
    if (webhookSecret && providedSecret !== webhookSecret) {
      return jsonResponse({ error: 'Unauthorized' }, 401);
    }

    const pingramKey = Deno.env.get('PINGRAM_API_KEY');
    const pingramBase = Deno.env.get('PINGRAM_API_URL') ?? DEFAULT_PINGRAM_API_URL;
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!pingramKey) {
      return jsonResponse({ error: 'PINGRAM_API_KEY not configured' }, 500);
    }
    if (!supabaseUrl || !serviceRoleKey) {
      return jsonResponse({ error: 'Supabase service configuration missing' }, 500);
    }

    const payload = (await req.json()) as WebhookPayload;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    if (payload.table === 'applications') {
      if (payload.type === 'INSERT') {
        await handleApplicationInsert(supabase, pingramKey, pingramBase, payload.record);
      } else if (payload.type === 'UPDATE') {
        await handleApplicationUpdate(
          supabase,
          pingramKey,
          pingramBase,
          payload.record,
          payload.old_record,
        );
      }
    } else if (payload.table === 'shift_posts' && becameLive(payload.record, payload.old_record)) {
      await handleShiftPostLive(supabase, pingramKey, pingramBase, payload.record);
    } else if (payload.table === 'job_posts' && becameLive(payload.record, payload.old_record)) {
      await handleJobPostLive(supabase, pingramKey, pingramBase, payload.record);
    }

    return jsonResponse({ ok: true });
  } catch (error) {
    console.error('notify error', error);
    return jsonResponse(
      { error: error instanceof Error ? error.message : 'Notification dispatch failed' },
      500,
    );
  }
});
