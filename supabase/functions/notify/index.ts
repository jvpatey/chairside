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
  options?: {
    push?: {
      customData?: Record<string, string>;
    };
  };
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
  jobUpdated: 'job_updated',
  fillInUpdated: 'fill_in_updated',
  savedPostUnavailable: 'saved_post_unavailable',
  messageReceived: 'message_received',
  fillInOutreachSms: 'fill_in_outreach_sms',
} as const;

const DEFAULT_PINGRAM_API_URL = 'https://api.ca.pingram.io';

const NOTIFICATION_PREFERENCE_CATEGORIES = {
  messages: 'messages',
  applicationsInterviews: 'applications_interviews',
  jobAlerts: 'job_alerts',
  fillInAlerts: 'fill_in_alerts',
} as const;

type NotificationPreferenceCategory =
  (typeof NOTIFICATION_PREFERENCE_CATEGORIES)[keyof typeof NOTIFICATION_PREFERENCE_CATEGORIES];

async function isPushEnabledForUser(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  category: NotificationPreferenceCategory,
): Promise<boolean> {
  const { data, error } = await supabase
    .from('notification_preferences')
    .select('push_enabled')
    .eq('user_id', userId)
    .eq('category', category)
    .maybeSingle();

  if (error) throw error;
  return data?.push_enabled ?? true;
}

async function loadPushPreferenceMap(
  supabase: ReturnType<typeof createClient>,
  userIds: string[],
  category: NotificationPreferenceCategory,
): Promise<Map<string, boolean>> {
  const uniqueIds = [...new Set(userIds.filter(Boolean))];
  const result = new Map<string, boolean>();
  for (const id of uniqueIds) {
    result.set(id, true);
  }
  if (uniqueIds.length === 0) return result;

  const { data, error } = await supabase
    .from('notification_preferences')
    .select('user_id, push_enabled')
    .in('user_id', uniqueIds)
    .eq('category', category);

  if (error) throw error;

  for (const row of data ?? []) {
    result.set(row.user_id as string, row.push_enabled === true);
  }

  return result;
}

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

function formatTime12h(time: string): string | null {
  const match = /^(\d{1,2}):(\d{2})(?::\d{2})?$/.exec(time.trim());
  if (!match) return null;

  const hours24 = Number(match[1]);
  const minutes = match[2];
  if (hours24 < 0 || hours24 > 23) return null;

  const period = hours24 >= 12 ? 'PM' : 'AM';
  const hours12 = hours24 % 12 || 12;
  return minutes === '00' ? `${hours12} ${period}` : `${hours12}:${minutes} ${period}`;
}

function formatShiftTimeRange(startTime: string, endTime: string): string | null {
  const start = formatTime12h(startTime);
  const end = formatTime12h(endTime);
  if (!start || !end) return null;
  return `${start}–${end}`;
}

function formatShiftDateLabel(isoDate: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoDate.trim());
  if (!match) return isoDate;

  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  return date.toLocaleDateString('en-CA', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatClinicLocation(clinic: { city?: string | null; province?: string | null }): string {
  const city = clinic.city?.trim();
  const province = clinic.province?.trim();
  if (city && province) return `${city}, ${province}`;
  if (city) return city;
  if (province) return province;
  return '';
}

function buildFillInAlertCopy(input: {
  clinicName: string;
  locationLabel: string;
  shiftDate: string;
  startTime?: string | null;
  endTime?: string | null;
  compensation?: string | null;
  isUpdate?: boolean;
}): { title: string; message: string; smsMessage: string } {
  const locationSuffix = input.locationLabel ? ` (${input.locationLabel})` : '';
  const dateLabel = formatShiftDateLabel(input.shiftDate);
  const timeRange =
    input.startTime && input.endTime ? formatShiftTimeRange(input.startTime, input.endTime) : null;
  const compensation = input.compensation?.trim();
  const compensationSuffix = compensation ? ` Compensation: ${compensation}.` : '';
  const verb = input.isUpdate ? 'updated' : 'posted';

  const title = input.isUpdate
    ? `Fill-in updated · ${input.clinicName}`
    : `New fill-in · ${input.clinicName}`;
  const detailParts = [dateLabel, timeRange].filter(Boolean).join(', ');
  const locationInMessage = input.locationLabel ? ` · ${input.locationLabel}` : '';
  const message = `${input.clinicName}${locationInMessage} ${verb} a fill-in for ${detailParts}.${compensationSuffix}`;

  const smsMessage = `Chairside: ${input.clinicName}${locationSuffix} ${verb} a fill-in for ${detailParts}.${compensationSuffix} Open Chairside to apply. Reply STOP to opt out.`;

  return { title, message, smsMessage };
}

function shiftWeekday(shiftDate: string): number {
  const d = new Date(`${shiftDate}T12:00:00`);
  return d.getDay();
}

function normalizeUuid(value: unknown): string | null {
  if (typeof value !== 'string' || !value.trim()) return null;
  return value.trim().toLowerCase();
}

function resolveMessageRecipient(
  conversation: { worker_id: string; clinic_id: string },
  senderId: string,
): string | null {
  const sender = normalizeUuid(senderId);
  const workerId = normalizeUuid(conversation.worker_id);
  const clinicId = normalizeUuid(conversation.clinic_id);

  if (!sender || !workerId || !clinicId) return null;
  if (sender === workerId) return conversation.clinic_id;
  if (sender === clinicId) return conversation.worker_id;
  return null;
}

function buildSmsOnlyBody(input: {
  type: string;
  userId: string;
  phone: string;
  smsMessage: string;
  secondaryId: string;
}): PingramSendBody {
  return {
    type: input.type,
    to: { id: input.userId, number: input.phone },
    sms: { message: input.smsMessage },
    forceChannels: ['SMS'],
    secondaryId: input.secondaryId,
  };
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
  pushCustomData?: Record<string, string>;
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

  if (sendPush) {
    body.options = {
      push: {
        customData: {
          url: input.deepLink,
          secondaryId: input.secondaryId,
          ...(input.pushCustomData ?? {}),
        },
      },
    };
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

function buildOutreachSmsCopy(input: {
  clinicName: string;
  shiftDate?: string | null;
  startTime?: string | null;
  endTime?: string | null;
  roleType?: string | null;
}): string {
  if (input.shiftDate) {
    const dateLabel = formatShiftDateLabel(input.shiftDate);
    const timeRange =
      input.startTime && input.endTime
        ? formatShiftTimeRange(input.startTime, input.endTime)
        : null;
    const detailParts = [dateLabel, timeRange].filter(Boolean).join(', ');
    return `Chairside: ${input.clinicName} sent you a fill-in request for ${detailParts}. Open Chairside to reply. Reply STOP to opt out.`;
  }
  return `Chairside: ${input.clinicName} sent you a fill-in request. Open Chairside to reply. Reply STOP to opt out.`;
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
  const triggerSmsAlert = record.trigger_sms_alert === true;
  const suppressNotification = record.suppress_notification === true;

  if (suppressNotification) return;

  const { data: conversation, error: conversationError } = await supabase
    .from('conversations')
    .select(
      'id, application_id, conversation_type, worker_id, clinic_id, outreach_role_type, outreach_shift_date, outreach_start_time, outreach_end_time',
    )
    .eq('id', conversationId)
    .maybeSingle();

  if (conversationError) throw conversationError;
  if (!conversation) return;

  const recipientId = resolveMessageRecipient(conversation, senderId);
  if (!recipientId) return;

  const normalizedSenderId = normalizeUuid(senderId);
  const normalizedRecipientId = normalizeUuid(recipientId);
  if (normalizedSenderId && normalizedRecipientId && normalizedSenderId === normalizedRecipientId) {
    return;
  }

  const recipientIsClinic = normalizeUuid(recipientId) === normalizeUuid(conversation.clinic_id);
  const isGeneralConversation = conversation.conversation_type === 'general';
  const isOutreachConversation = conversation.conversation_type === 'outreach';

  const idempotencyKey = `${PINGRAM_TYPES.messageReceived}:${messageId}`;
  if (!(await claimIdempotency(supabase, idempotencyKey))) return;

  let senderLabel = 'Someone';
  if (normalizeUuid(senderId) === normalizeUuid(conversation.worker_id)) {
    if (isGeneralConversation || isOutreachConversation) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('display_name')
        .eq('id', conversation.worker_id)
        .maybeSingle();
      senderLabel = profile?.display_name?.trim() || 'A candidate';
    } else {
      const { data: application } = await supabase
        .from('applications')
        .select('worker_display_name')
        .eq('id', conversation.application_id)
        .maybeSingle();
      senderLabel = application?.worker_display_name?.trim() || 'An applicant';
    }
  } else {
    const { data: clinic } = await supabase
      .from('clinic_profiles')
      .select('clinic_name')
      .eq('id', conversation.clinic_id)
      .maybeSingle();
    senderLabel = clinic?.clinic_name?.trim() || 'A clinic';
  }

  const title = isOutreachConversation
    ? `Fill-in request from ${senderLabel}`
    : `Message from ${senderLabel}`;
  const message = truncatePreview(body, 100);
  const deepLink =
    isGeneralConversation || isOutreachConversation
      ? recipientIsClinic
        ? `chairside:///(clinic-tabs)/conversation/${conversation.id}`
        : `chairside:///(tabs)/conversation/${conversation.id}`
      : recipientIsClinic
        ? `chairside:///(clinic-tabs)/application/${conversation.application_id}/messages`
        : `chairside:///(tabs)/application/${conversation.application_id}/messages`;

  const includePush = await isPushEnabledForUser(
    supabase,
    recipientId,
    NOTIFICATION_PREFERENCE_CATEGORIES.messages,
  );

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
      includePush,
      pushCustomData: { senderId },
    }),
  );

  if (
    isOutreachConversation &&
    triggerSmsAlert &&
    !recipientIsClinic &&
    normalizeUuid(senderId) === normalizeUuid(conversation.clinic_id)
  ) {
    const smsKey = `${PINGRAM_TYPES.fillInOutreachSms}:${messageId}`;
    if (!(await claimIdempotency(supabase, smsKey))) return;

    const { data: worker } = await supabase
      .from('worker_profiles')
      .select('fill_in_sms_opt_in, phone')
      .eq('id', conversation.worker_id)
      .maybeSingle();

    const e164 = worker?.fill_in_sms_opt_in ? normalizeE164(worker.phone as string | null) : null;
    if (!e164) return;

    const { data: clinic } = await supabase
      .from('clinic_profiles')
      .select('clinic_name')
      .eq('id', conversation.clinic_id)
      .maybeSingle();

    const clinicName = clinic?.clinic_name?.trim() || 'A clinic';
    const smsMessage = buildOutreachSmsCopy({
      clinicName,
      shiftDate: conversation.outreach_shift_date as string,
      startTime: conversation.outreach_start_time as string | null,
      endTime: conversation.outreach_end_time as string | null,
      roleType: conversation.outreach_role_type as string | null,
    });

    await pingramSend(
      pingramKey,
      pingramBase,
      buildSmsOnlyBody({
        type: PINGRAM_TYPES.fillInOutreachSms,
        userId: conversation.worker_id,
        phone: e164,
        smsMessage,
        secondaryId: smsKey,
      }),
    );
  }
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
  const includePush = await isPushEnabledForUser(
    supabase,
    workerId,
    NOTIFICATION_PREFERENCE_CATEGORIES.applicationsInterviews,
  );
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
      includePush,
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

  const includePush = await isPushEnabledForUser(
    supabase,
    clinicId,
    NOTIFICATION_PREFERENCE_CATEGORIES.applicationsInterviews,
  );

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
      includePush,
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

  const includePush = await isPushEnabledForUser(
    supabase,
    clinicId,
    NOTIFICATION_PREFERENCE_CATEGORIES.applicationsInterviews,
  );

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
      includePush,
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
      'id, role_type, role_types, fill_in_notification_mode, short_notice_available, fill_in_sms_opt_in, phone, setup_completed_at',
    )
    .eq('short_notice_available', true)
    .neq('fill_in_notification_mode', 'off')
    .not('setup_completed_at', 'is', null);

  if (error) throw error;
  if (!workers?.length) return [];

  const eligibleWorkers = await filterWorkerNotificationRecipients(supabase, workers, [clinicId]);
  if (!eligibleWorkers.length) return [];

  const roleMatched = eligibleWorkers.filter((worker) => {
    const roleTypes =
      Array.isArray(worker.role_types) && worker.role_types.length > 0
        ? worker.role_types
        : worker.role_type
          ? [worker.role_type]
          : [];
    return roleTypes.includes(shift.role_type);
  });

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
  options: { isUpdate?: boolean } = {},
): Promise<Set<string>> {
  const shiftId = record.id as string;
  const clinicId = record.clinic_id as string;
  const shiftDate = record.shift_date as string;
  const roleType = record.role_type as string;
  const startTime = record.start_time as string | undefined;
  const endTime = record.end_time as string | undefined;
  const compensation = record.compensation as string | null | undefined;
  const updatedAt = (record.updated_at as string | undefined) ?? shiftId;

  const { data: clinic } = await supabase
    .from('clinic_profiles')
    .select('clinic_name, city, province')
    .eq('id', clinicId)
    .maybeSingle();

  const clinicName = clinic?.clinic_name?.trim() || 'A clinic';
  const locationLabel = formatClinicLocation(clinic ?? {});
  const fillInCopy = buildFillInAlertCopy({
    clinicName,
    locationLabel,
    shiftDate,
    startTime,
    endTime,
    compensation,
    isUpdate: options.isUpdate === true,
  });
  const recipients = await listFillInRecipients(
    supabase,
    {
      role_type: roleType,
      shift_date: shiftDate,
    },
    clinicId,
  );

  const pushPreferences = await loadPushPreferenceMap(
    supabase,
    recipients.map((worker) => worker.id),
    NOTIFICATION_PREFERENCE_CATEGORIES.fillInAlerts,
  );

  const notifiedRecipientIds = new Set<string>();

  for (const worker of recipients) {
    const idempotencyKey = `${PINGRAM_TYPES.fillInPosted}:${shiftId}:${worker.id}:${updatedAt}`;
    if (!(await claimIdempotency(supabase, idempotencyKey))) continue;

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
        title: fillInCopy.title,
        message: fillInCopy.message,
        deepLink,
        secondaryId: idempotencyKey,
        includePush: pushPreferences.get(worker.id) ?? true,
        includeSms: Boolean(smsOptIn && e164),
        smsMessage: fillInCopy.smsMessage,
      }),
    );
    notifiedRecipientIds.add(worker.id);
  }

  return notifiedRecipientIds;
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
    .or(`role_type.eq.${roleType},role_types.cs.{${roleType}}`)
    .not('setup_completed_at', 'is', null);

  if (error) throw error;

  const recipients = await filterWorkerNotificationRecipients(supabase, workers ?? [], [clinicId]);

  const pushPreferences = await loadPushPreferenceMap(
    supabase,
    recipients.map((worker) => worker.id),
    NOTIFICATION_PREFERENCE_CATEGORIES.jobAlerts,
  );

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
        includePush: pushPreferences.get(worker.id) ?? true,
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

const FILL_IN_NOTIFY_FIELDS = [
  'role_type',
  'shift_date',
  'start_time',
  'end_time',
  'compensation',
] as const;

const JOB_NOTIFY_FIELDS = [
  'title',
  'role_type',
  'wage_range',
  'schedule',
  'description',
  'employment_type',
] as const;

function fillInNotificationFieldsChanged(
  record: Record<string, unknown>,
  oldRecord: Record<string, unknown>,
): boolean {
  return FILL_IN_NOTIFY_FIELDS.some((field) => record[field] !== oldRecord[field]);
}

function jobNotificationFieldsChanged(
  record: Record<string, unknown>,
  oldRecord: Record<string, unknown>,
): boolean {
  return JOB_NOTIFY_FIELDS.some((field) => record[field] !== oldRecord[field]);
}

function savedJobBecameUnavailable(
  record: Record<string, unknown>,
  oldRecord: Record<string, unknown> | null,
): boolean {
  const oldStatus = oldRecord?.status as string | undefined;
  const status = record.status as string;
  return oldStatus === 'live' && status !== 'live';
}

function savedShiftBecameUnavailable(
  record: Record<string, unknown>,
  oldRecord: Record<string, unknown> | null,
): boolean {
  const oldStatus = oldRecord?.status as string | undefined;
  const status = record.status as string;
  return oldStatus === 'live' && status !== 'live';
}

function shouldNotifySavedJobChange(
  record: Record<string, unknown>,
  oldRecord: Record<string, unknown> | null,
  eventType: WebhookPayload['type'],
): boolean {
  if (eventType !== 'UPDATE' || !oldRecord) return false;
  if (savedJobBecameUnavailable(record, oldRecord)) return true;
  if (record.status !== 'live' || oldRecord.status !== 'live') return false;
  return jobNotificationFieldsChanged(record, oldRecord);
}

function shouldNotifySavedShiftChange(
  record: Record<string, unknown>,
  oldRecord: Record<string, unknown> | null,
  eventType: WebhookPayload['type'],
): boolean {
  if (eventType !== 'UPDATE' || !oldRecord) return false;
  if (savedShiftBecameUnavailable(record, oldRecord)) return true;
  if (record.status !== 'live' || oldRecord.status !== 'live') return false;
  return fillInNotificationFieldsChanged(record, oldRecord);
}

async function listSavedWorkersForJob(
  supabase: ReturnType<typeof createClient>,
  jobId: string,
  clinicId: string,
): Promise<Array<{ id: string }>> {
  const { data, error } = await supabase
    .from('worker_saved_posts')
    .select('worker_id')
    .eq('job_post_id', jobId);

  if (error) throw error;
  const workers = (data ?? []).map((row) => ({ id: row.worker_id as string }));
  return filterWorkerNotificationRecipients(supabase, workers, [clinicId]);
}

async function listSavedWorkersForShift(
  supabase: ReturnType<typeof createClient>,
  shiftId: string,
  clinicId: string,
): Promise<Array<{ id: string }>> {
  const { data, error } = await supabase
    .from('worker_saved_posts')
    .select('worker_id')
    .eq('shift_post_id', shiftId);

  if (error) throw error;
  const workers = (data ?? []).map((row) => ({ id: row.worker_id as string }));
  return filterWorkerNotificationRecipients(supabase, workers, [clinicId]);
}

async function handleSavedJobPostUpdate(
  supabase: ReturnType<typeof createClient>,
  pingramKey: string,
  pingramBase: string,
  record: Record<string, unknown>,
  oldRecord: Record<string, unknown>,
) {
  const jobId = record.id as string;
  const clinicId = record.clinic_id as string;
  const title = record.title as string;
  const updatedAt = (record.updated_at as string | undefined) ?? jobId;
  const unavailable = savedJobBecameUnavailable(record, oldRecord);

  const savers = await listSavedWorkersForJob(supabase, jobId, clinicId);
  if (!savers.length) return;

  const { data: clinic } = await supabase
    .from('clinic_profiles')
    .select('clinic_name, city')
    .eq('id', clinicId)
    .maybeSingle();

  const clinicName = clinic?.clinic_name?.trim() || 'A clinic';
  const cityLabel = clinic?.city ? ` · ${clinic.city}` : '';
  const deepLink = `chairside:///(tabs)/job/${jobId}`;
  const pingramType = unavailable
    ? PINGRAM_TYPES.savedPostUnavailable
    : PINGRAM_TYPES.jobUpdated;
  const notifTitle = unavailable
    ? `Role no longer available · ${title}`
    : `Saved role updated · ${title}`;
  const message = unavailable
    ? `${clinicName}${cityLabel} is no longer hiring for ${title}.`
    : `${clinicName}${cityLabel} updated ${title}.`;

  const pushPreferences = await loadPushPreferenceMap(
    supabase,
    savers.map((worker) => worker.id),
    NOTIFICATION_PREFERENCE_CATEGORIES.jobAlerts,
  );

  for (const worker of savers) {
    const idempotencyKey = `${pingramType}:${jobId}:${worker.id}:${updatedAt}`;
    if (!(await claimIdempotency(supabase, idempotencyKey))) continue;

    await pingramSend(
      pingramKey,
      pingramBase,
      buildSendBody({
        type: pingramType,
        userId: worker.id,
        title: notifTitle,
        message,
        deepLink,
        secondaryId: idempotencyKey,
        includePush: pushPreferences.get(worker.id) ?? true,
      }),
    );
  }
}

async function handleSavedShiftPostUpdate(
  supabase: ReturnType<typeof createClient>,
  pingramKey: string,
  pingramBase: string,
  record: Record<string, unknown>,
  oldRecord: Record<string, unknown>,
  excludeWorkerIds: Set<string>,
) {
  const shiftId = record.id as string;
  const clinicId = record.clinic_id as string;
  const shiftDate = record.shift_date as string;
  const startTime = record.start_time as string | undefined;
  const endTime = record.end_time as string | undefined;
  const compensation = record.compensation as string | null | undefined;
  const updatedAt = (record.updated_at as string | undefined) ?? shiftId;
  const unavailable = savedShiftBecameUnavailable(record, oldRecord);

  const savers = (await listSavedWorkersForShift(supabase, shiftId, clinicId)).filter(
    (worker) => !excludeWorkerIds.has(worker.id),
  );
  if (!savers.length) return;

  const { data: clinic } = await supabase
    .from('clinic_profiles')
    .select('clinic_name, city, province')
    .eq('id', clinicId)
    .maybeSingle();

  const clinicName = clinic?.clinic_name?.trim() || 'A clinic';
  const locationLabel = formatClinicLocation(clinic ?? {});
  const locationSuffix = locationLabel ? ` · ${locationLabel}` : '';
  const deepLink = `chairside:///(tabs)/shift/${shiftId}`;
  const pingramType = unavailable
    ? PINGRAM_TYPES.savedPostUnavailable
    : PINGRAM_TYPES.fillInUpdated;

  const dateLabel = formatShiftDateLabel(shiftDate);
  const timeRange =
    startTime && endTime ? formatShiftTimeRange(startTime, endTime) : null;
  const detailParts = [dateLabel, timeRange].filter(Boolean).join(', ');

  const notifTitle = unavailable
    ? `Saved fill-in no longer available · ${clinicName}`
    : `Saved fill-in updated · ${clinicName}`;
  const message = unavailable
    ? `${clinicName}${locationSuffix} is no longer offering the fill-in on ${detailParts}.`
    : `${clinicName}${locationSuffix} updated the fill-in on ${detailParts}.`;

  const pushPreferences = await loadPushPreferenceMap(
    supabase,
    savers.map((worker) => worker.id),
    NOTIFICATION_PREFERENCE_CATEGORIES.fillInAlerts,
  );

  for (const worker of savers) {
    const idempotencyKey = `${pingramType}:${shiftId}:${worker.id}:${updatedAt}`;
    if (!(await claimIdempotency(supabase, idempotencyKey))) continue;

    await pingramSend(
      pingramKey,
      pingramBase,
      buildSendBody({
        type: pingramType,
        userId: worker.id,
        title: notifTitle,
        message,
        deepLink,
        secondaryId: idempotencyKey,
        includePush: pushPreferences.get(worker.id) ?? true,
      }),
    );
  }
}

function shouldNotifyFillInShift(
  record: Record<string, unknown>,
  oldRecord: Record<string, unknown> | null,
  eventType: WebhookPayload['type'],
): boolean {
  const status = record.status as string;
  if (status !== 'live') return false;

  if (becameLive(record, oldRecord)) return true;

  if (eventType !== 'UPDATE' || !oldRecord) return false;

  const oldStatus = oldRecord.status as string | undefined;
  if (oldStatus !== 'live') return false;

  return fillInNotificationFieldsChanged(record, oldRecord);
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
    } else if (
      payload.table === 'shift_posts' &&
      shouldNotifyFillInShift(payload.record, payload.old_record, payload.type)
    ) {
      const broadcastRecipientIds = await handleShiftPostLive(
        supabase,
        pingramKey,
        pingramBase,
        payload.record,
        {
          isUpdate: payload.type === 'UPDATE' && !becameLive(payload.record, payload.old_record),
        },
      );
      if (
        payload.type === 'UPDATE' &&
        payload.old_record &&
        shouldNotifySavedShiftChange(payload.record, payload.old_record, payload.type)
      ) {
        await handleSavedShiftPostUpdate(
          supabase,
          pingramKey,
          pingramBase,
          payload.record,
          payload.old_record,
          broadcastRecipientIds,
        );
      }
    } else if (
      payload.table === 'shift_posts' &&
      payload.type === 'UPDATE' &&
      payload.old_record &&
      !shouldNotifyFillInShift(payload.record, payload.old_record, payload.type) &&
      shouldNotifySavedShiftChange(payload.record, payload.old_record, payload.type)
    ) {
      await handleSavedShiftPostUpdate(
        supabase,
        pingramKey,
        pingramBase,
        payload.record,
        payload.old_record,
        new Set<string>(),
      );
    } else if (payload.table === 'job_posts' && becameLive(payload.record, payload.old_record)) {
      await handleJobPostLive(supabase, pingramKey, pingramBase, payload.record);
    } else if (
      payload.table === 'job_posts' &&
      payload.type === 'UPDATE' &&
      payload.old_record &&
      shouldNotifySavedJobChange(payload.record, payload.old_record, payload.type)
    ) {
      await handleSavedJobPostUpdate(
        supabase,
        pingramKey,
        pingramBase,
        payload.record,
        payload.old_record,
      );
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
