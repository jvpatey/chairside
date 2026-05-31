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
  applicationInterviewOffered: 'application_interview_offered',
  applicationInterviewScheduled: 'application_interview_scheduled',
  applicationInterviewAccepted: 'application_interview_accepted',
  applicationInterviewDeclined: 'application_interview_declined',
  applicationInterviewCancelled: 'application_interview_cancelled',
  applicationInterviewRescheduleProposed: 'application_interview_reschedule_proposed',
  applicationInterviewRescheduleAccepted: 'application_interview_reschedule_accepted',
  applicationInterviewRescheduleDeclined: 'application_interview_reschedule_declined',
  applicationInterviewScheduledCancelled: 'application_interview_scheduled_cancelled',
  applicationSelected: 'application_selected',
  applicationRejected: 'application_rejected',
  applicationHired: 'application_hired',
  fillInPosted: 'fill_in_posted',
  jobPosted: 'job_posted',
  messageReceived: 'message_received',
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
  const { error } = await supabase
    .from('notification_dispatch_log')
    .insert({ idempotency_key: key });
  if (error?.code === '23505') return false;
  if (error) throw error;
  return true;
}

function truncatePreview(text: string, maxLength = 120): string {
  const trimmed = text.trim();
  if (trimmed.length <= maxLength) return trimmed;
  return `${trimmed.slice(0, maxLength - 1).trim()}…`;
}

async function handleMessageInsert(
  supabase: ReturnType<typeof createClient>,
  pingramKey: string,
  pingramBase: string,
  record: Record<string, unknown>,
) {
  const messageId = record.id as string;
  const conversationId = record.conversation_id as string;
  const senderId = record.sender_id as string;
  const body = (record.body as string | undefined)?.trim() ?? '';

  const { data: conversation, error: conversationError } = await supabase
    .from('conversations')
    .select('id, application_id, worker_id, clinic_id')
    .eq('id', conversationId)
    .maybeSingle();

  if (conversationError) throw conversationError;
  if (!conversation) return;

  const recipientId =
    senderId === conversation.worker_id ? conversation.clinic_id : conversation.worker_id;
  const recipientIsClinic = recipientId === conversation.clinic_id;

  const idempotencyKey = `${PINGRAM_TYPES.messageReceived}:${messageId}`;
  if (!(await claimIdempotency(supabase, idempotencyKey))) return;

  let senderLabel = 'Someone';
  if (senderId === conversation.worker_id) {
    const { data: application } = await supabase
      .from('applications')
      .select('worker_display_name')
      .eq('id', conversation.application_id)
      .maybeSingle();
    senderLabel = application?.worker_display_name?.trim() || 'An applicant';
  } else {
    const { data: clinic } = await supabase
      .from('clinic_profiles')
      .select('clinic_name')
      .eq('id', conversation.clinic_id)
      .maybeSingle();
    senderLabel = clinic?.clinic_name?.trim() || 'A clinic';
  }

  const title = `Message from ${senderLabel}`;
  const message = truncatePreview(body, 100);
  const deepLink = recipientIsClinic
    ? `chairside:///(clinic-tabs)/application/${conversation.application_id}/messages`
    : `chairside:///(tabs)/application/${conversation.application_id}/messages`;

  await pingramSend(
    pingramKey,
    pingramBase,
    buildSendBody({
      type: PINGRAM_TYPES.messageReceived,
      userId: recipientId,
      title,
      message,
      deepLink,
      secondaryId: idempotencyKey,
    }),
  );
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
        : 'A clinic has shortlisted you for this role.',
    },
    interview_offered: {
      pingramType: PINGRAM_TYPES.applicationInterviewOffered,
      title: 'Interview invitation',
      message: 'A clinic invited you to interview for this role.',
    },
    interview_cancelled: {
      pingramType: PINGRAM_TYPES.applicationInterviewCancelled,
      title: 'Interview invitation cancelled',
      message: 'The clinic withdrew your interview invitation for this role.',
    },
    interview_reschedule_proposed: {
      pingramType: PINGRAM_TYPES.applicationInterviewRescheduleProposed,
      title: 'New interview time proposed',
      message: 'The clinic proposed a new interview time for this role.',
    },
    interview_reschedule_accepted: {
      pingramType: PINGRAM_TYPES.applicationInterviewRescheduleAccepted,
      title: 'Interview time updated',
      message: 'Your interview time change was accepted.',
    },
    interview_reschedule_declined: {
      pingramType: PINGRAM_TYPES.applicationInterviewRescheduleDeclined,
      title: 'Interview time change declined',
      message: 'The clinic declined your proposed interview time.',
    },
    interview_scheduled_cancelled: {
      pingramType: PINGRAM_TYPES.applicationInterviewScheduledCancelled,
      title: 'Interview cancelled',
      message: 'The clinic cancelled your confirmed interview for this role.',
    },
    interview_scheduled: {
      pingramType: PINGRAM_TYPES.applicationInterviewScheduled,
      title: 'Interview confirmed',
      message: 'Your interview is confirmed.',
    },
    selected: {
      pingramType: PINGRAM_TYPES.applicationSelected,
      title: 'You have been hired',
      message: isShift
        ? 'A clinic has selected you for this role.'
        : 'A clinic has hired you for this role.',
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

  let notification = template;

  if (status === 'rejected' && isShift) {
    const shiftPostId = application.shift_post_id as string | null;
    if (shiftPostId) {
      const { data: shift } = await supabase
        .from('shift_posts')
        .select('status')
        .eq('id', shiftPostId)
        .maybeSingle();
      if (shift?.status === 'filled') {
        notification = {
          pingramType: PINGRAM_TYPES.applicationRejected,
          title: 'Cover request update',
          message: 'This fill-in has been covered by another applicant.',
        };
      }
    }
  }

  const idempotencyKey = `${notification.pingramType}:${applicationId}:${status}`;
  if (!(await claimIdempotency(supabase, idempotencyKey))) return;

  const deepLink = `chairside:///(tabs)/application/${applicationId}`;
  await pingramSend(
    pingramKey,
    pingramBase,
    buildSendBody({
      type: notification.pingramType,
      userId: workerId,
      title: notification.title,
      message: notification.message,
      deepLink,
      secondaryId: idempotencyKey,
    }),
  );
}

async function getApplicationClinicId(
  supabase: ReturnType<typeof createClient>,
  application: Record<string, unknown>,
): Promise<string | null> {
  const jobPostId = application.job_post_id as string | null;
  const shiftPostId = application.shift_post_id as string | null;

  if (jobPostId) {
    const { data: job } = await supabase
      .from('job_posts')
      .select('clinic_id')
      .eq('id', jobPostId)
      .maybeSingle();
    return job?.clinic_id ?? null;
  }

  if (shiftPostId) {
    const { data: shift } = await supabase
      .from('shift_posts')
      .select('clinic_id')
      .eq('id', shiftPostId)
      .maybeSingle();
    return shift?.clinic_id ?? null;
  }

  return null;
}

async function sendClinicApplicationNotification(
  supabase: ReturnType<typeof createClient>,
  pingramKey: string,
  pingramBase: string,
  application: Record<string, unknown>,
  template: { pingramType: string; title: string; message: string },
) {
  const clinicId = await getApplicationClinicId(supabase, application);
  if (!clinicId) return;

  const applicationId = application.id as string;
  const idempotencyKey = `${template.pingramType}:${applicationId}`;
  if (!(await claimIdempotency(supabase, idempotencyKey))) return;

  const jobPostId = application.job_post_id as string | null;
  const deepLink = jobPostId
    ? `chairside:///(clinic-tabs)/role-applicants/${jobPostId}`
    : 'chairside:///(clinic-tabs)/applications';

  await pingramSend(
    pingramKey,
    pingramBase,
    buildSendBody({
      type: template.pingramType,
      userId: clinicId,
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

async function handleInterviewProposalChange(
  supabase: ReturnType<typeof createClient>,
  pingramKey: string,
  pingramBase: string,
  record: Record<string, unknown>,
  oldRecord: Record<string, unknown> | null,
) {
  const oldProposed = oldRecord?.interview_proposed_at as string | null | undefined;
  const newProposed = record.interview_proposed_at as string | null | undefined;
  const proposedBy = record.interview_proposed_by as string | null;

  if (!oldProposed && newProposed && proposedBy) {
    if (proposedBy === 'clinic') {
      await sendWorkerStatusNotification(
        supabase,
        pingramKey,
        pingramBase,
        record,
        'interview_reschedule_proposed',
      );
    } else {
      await sendClinicApplicationNotification(supabase, pingramKey, pingramBase, record, {
        pingramType: PINGRAM_TYPES.applicationInterviewRescheduleProposed,
        title: 'Interview time change requested',
        message: 'An applicant proposed a new interview time.',
      });
    }
    return;
  }

  if (oldProposed && !newProposed) {
    const oldAt = oldRecord?.interview_at as string | undefined;
    const newAt = record.interview_at as string | undefined;
    if (oldAt !== newAt) {
      if (oldRecord?.interview_proposed_by === 'clinic') {
        await sendWorkerStatusNotification(
          supabase,
          pingramKey,
          pingramBase,
          record,
          'interview_reschedule_accepted',
        );
      } else {
        await sendClinicApplicationNotification(supabase, pingramKey, pingramBase, record, {
          pingramType: PINGRAM_TYPES.applicationInterviewRescheduleAccepted,
          title: 'Interview time updated',
          message: 'You accepted the proposed interview time.',
        });
      }
    } else if (oldRecord?.interview_proposed_by === 'clinic') {
      await sendWorkerStatusNotification(
        supabase,
        pingramKey,
        pingramBase,
        record,
        'interview_reschedule_declined',
      );
    } else {
      await sendClinicApplicationNotification(supabase, pingramKey, pingramBase, record, {
        pingramType: PINGRAM_TYPES.applicationInterviewRescheduleDeclined,
        title: 'Interview time change declined',
        message: 'You declined the proposed interview time.',
      });
    }
  }
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
  if (!newStatus) return;

  if (newStatus === 'interview_scheduled' && oldStatus === 'interview_scheduled') {
    await handleInterviewProposalChange(supabase, pingramKey, pingramBase, record, oldRecord);
    return;
  }

  if (oldStatus === newStatus) return;

  if (oldStatus === 'interview_scheduled' && newStatus === 'in_progress') {
    const closedBy = record.interview_offer_closed_by as string | null;
    if (closedBy === 'clinic') {
      await sendWorkerStatusNotification(
        supabase,
        pingramKey,
        pingramBase,
        record,
        'interview_scheduled_cancelled',
      );
    } else {
      await sendClinicApplicationNotification(supabase, pingramKey, pingramBase, record, {
        pingramType: PINGRAM_TYPES.applicationInterviewScheduledCancelled,
        title: 'Interview cancelled',
        message: 'An applicant cancelled the confirmed interview.',
      });
    }
    return;
  }

  if (oldStatus === 'interview_offered' && newStatus === 'interview_scheduled') {
    await sendClinicApplicationNotification(supabase, pingramKey, pingramBase, record, {
      pingramType: PINGRAM_TYPES.applicationInterviewAccepted,
      title: 'Interview accepted',
      message: 'An applicant confirmed your interview invitation.',
    });
    await sendWorkerStatusNotification(
      supabase,
      pingramKey,
      pingramBase,
      record,
      'interview_scheduled',
    );
    return;
  }

  if (oldStatus === 'interview_offered' && newStatus === 'in_progress') {
    const closedBy = record.interview_offer_closed_by as string | null;
    if (closedBy === 'clinic') {
      await sendWorkerStatusNotification(
        supabase,
        pingramKey,
        pingramBase,
        record,
        'interview_cancelled',
      );
    } else {
      await sendClinicApplicationNotification(supabase, pingramKey, pingramBase, record, {
        pingramType: PINGRAM_TYPES.applicationInterviewDeclined,
        title: 'Interview declined',
        message: 'An applicant declined your interview invitation.',
      });
    }
    return;
  }

  if (newStatus === 'interview_offered') {
    await sendWorkerStatusNotification(supabase, pingramKey, pingramBase, record, newStatus);
    return;
  }

  if (
    !['reviewed', 'in_progress', 'interview_scheduled', 'selected', 'rejected', 'hired'].includes(
      newStatus,
    )
  ) {
    return;
  }

  await sendWorkerStatusNotification(supabase, pingramKey, pingramBase, record, newStatus);
}

async function filterWorkerNotificationRecipients(
  supabase: ReturnType<typeof createClient>,
  workers: Array<{ id: string }>,
  excludeUserIds: string[],
): Promise<Array<{ id: string }>> {
  if (!workers.length) return [];
  const excludeSet = new Set(excludeUserIds);
  const candidateIds = workers.map((w) => w.id).filter((id) => !excludeSet.has(id));
  if (!candidateIds.length) return [];

  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('id')
    .in('id', candidateIds)
    .eq('role', 'worker');

  if (error) throw error;
  const workerRoleIds = new Set((profiles ?? []).map((p) => p.id));
  return workers.filter((w) => workerRoleIds.has(w.id));
}

async function listFillInRecipients(
  supabase: ReturnType<typeof createClient>,
  shift: { role_type: string; shift_date: string },
  clinicId: string,
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

  const eligibleWorkers = await filterWorkerNotificationRecipients(supabase, workers, [clinicId]);
  if (!eligibleWorkers.length) return [];

  const roleMatched = eligibleWorkers.filter((w) => w.role_type && w.role_type === shift.role_type);

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
  const recipients = await listFillInRecipients(
    supabase,
    {
      role_type: roleType,
      shift_date: shiftDate,
    },
    clinicId,
  );

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

  const recipients = await filterWorkerNotificationRecipients(supabase, workers ?? [], [clinicId]);

  for (const worker of recipients) {
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
    } else if (payload.table === 'messages' && payload.type === 'INSERT') {
      await handleMessageInsert(supabase, pingramKey, pingramBase, payload.record);
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
