import { createClient } from 'npm:@supabase/supabase-js@2';
import {
  DEFAULT_PINGRAM_API_URL,
  maskPhone,
  normalizeE164,
  pingramPost,
} from '../_shared/pingram.ts';
import { capturePosthogEvent } from '../_shared/posthog.ts';
import {
  buildClinicCoverRequestSms,
  buildFillInDecisionSms,
  buildFillInSms,
  buildOutreachSms,
  formatTime12h,
  smsSegmentCount,
  toGsmSafeSms,
} from '../_shared/sms.ts';

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

/** Pingram is email + SMS only (no in-app / mobile push). */

type ExpoPushPayload = {
  userId: string;
  title: string;
  body: string;
  data: Record<string, string>;
};

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';
const ANDROID_NOTIFICATION_CHANNEL_ID = 'default';

const PINGRAM_TYPES = {
  applicationReceived: 'application_received',
  applicationReviewed: 'application_reviewed',
  applicationInProgress: 'application_in_progress',
  applicationKitRequested: 'application_kit_requested',
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

function formatShiftTimeRange(startTime: string, endTime: string): string | null {
  const start = formatTime12h(startTime);
  const end = formatTime12h(endTime);
  if (!start || !end) return null;
  return `${start}–${end}`;
}

function formatISODateLabel(isoDate: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoDate.trim());
  if (!match) return isoDate;

  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatShiftDateLabel(isoDate: string): string {
  return formatISODateLabel(isoDate);
}

function formatClinicLocation(clinic: { city?: string | null; province?: string | null }): string {
  const city = clinic.city?.trim();
  const province = clinic.province?.trim();
  if (city && province) return `${city}, ${province}`;
  if (city) return city;
  if (province) return province;
  return '';
}

function getPublicWebBaseUrl(): string {
  return (
    Deno.env.get('APP_WEB_BASE_URL') ??
    Deno.env.get('EXPO_PUBLIC_WEB_BASE_URL') ??
    'https://chairsidedental.app'
  ).replace(/\/$/, '');
}

function buildFillInListingUrl(shiftId: string): string {
  return `${getPublicWebBaseUrl()}/f/${shiftId}?src=sms`;
}

function buildApplicationUrl(applicationId: string, decisionToken?: string | null): string {
  const base = `${getPublicWebBaseUrl()}/a/${applicationId}?src=sms`;
  const token = decisionToken?.trim();
  if (!token) return base;
  return `${base}&t=${encodeURIComponent(token)}`;
}

/** Mint a Companion Accept token for clinic cover-request SMS. */
async function createFillInDecisionToken(
  supabase: ReturnType<typeof createClient>,
  applicationId: string,
): Promise<string | null> {
  const { data, error } = await supabase.rpc('create_fill_in_decision_token', {
    p_application_id: applicationId,
  });
  if (error || typeof data !== 'string' || !data.trim()) {
    console.error(
      `[notify] create_fill_in_decision_token failed (applicationId=${applicationId})`,
      error,
    );
    return null;
  }
  return data.trim();
}

/** Paid gate removed — fill-in SMS is core product while plans are revamped. */
async function clinicCanSendFillInSms(
  _supabase: ReturnType<typeof createClient>,
  clinicId: string | null,
  isSourced: boolean,
): Promise<boolean> {
  if (isSourced) return true;
  return Boolean(clinicId);
}

function buildFillInAlertCopy(input: {
  clinicName: string;
  locationLabel: string;
  shiftDate?: string | null;
  startTime?: string | null;
  endTime?: string | null;
  compensation?: string | null;
  isUpdate?: boolean;
  listingUrl?: string | null;
  listingCta?: 'Apply' | 'Details' | null;
}): { title: string; message: string; smsMessage: string } {
  const dateLabel = input.shiftDate?.trim()
    ? formatShiftDateLabel(input.shiftDate)
    : 'Schedule TBD';
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

  return { title, message, smsMessage: buildFillInSms(input) };
}

function normalizeUuid(value: unknown): string | null {
  if (typeof value !== 'string' || !value.trim()) return null;
  return value.trim().toLowerCase();
}

/**
 * Clinic alert recipients: the owner login only. Each clinic or group is one
 * login with no manager roles, so every clinic alert goes to the owner.
 */
async function listClinicAlertRecipientUserIds(
  supabase: ReturnType<typeof createClient>,
  organizationId: string,
): Promise<string[]> {
  const { data: owners, error } = await supabase
    .from('clinic_memberships')
    .select('user_id')
    .eq('organization_id', organizationId)
    .eq('status', 'active')
    .eq('role', 'owner');

  if (error) throw error;

  // Owner user id is the org id; include even if the owner membership row is missing.
  const recipientIds = new Set<string>([organizationId]);
  for (const row of owners ?? []) {
    const userId = row.user_id as string | null;
    if (userId) recipientIds.add(userId);
  }

  return [...recipientIds];
}

async function getApplicationClinicId(
  supabase: ReturnType<typeof createClient>,
  application: Record<string, unknown>,
): Promise<string | null> {
  const jobPostId = application.job_post_id as string | null;
  const shiftPostId = application.shift_post_id as string | null;

  if (jobPostId) {
    const { data: job, error } = await supabase
      .from('job_posts')
      .select('clinic_id')
      .eq('id', jobPostId)
      .maybeSingle();
    if (error) throw error;
    return (job?.clinic_id as string | null | undefined) ?? null;
  }

  if (shiftPostId) {
    const { data: shift, error } = await supabase
      .from('shift_posts')
      .select('clinic_id')
      .eq('id', shiftPostId)
      .maybeSingle();
    if (error) throw error;
    return (shift?.clinic_id as string | null | undefined) ?? null;
  }

  return null;
}

async function isActiveClinicSideSender(
  supabase: ReturnType<typeof createClient>,
  organizationId: string,
  senderId: string,
): Promise<boolean> {
  const sender = normalizeUuid(senderId);
  const orgId = normalizeUuid(organizationId);
  if (!sender || !orgId) return false;
  if (sender === orgId) return true;

  const { data, error } = await supabase
    .from('clinic_memberships')
    .select('user_id')
    .eq('organization_id', organizationId)
    .eq('user_id', senderId)
    .eq('status', 'active')
    .maybeSingle();

  if (error) throw error;
  return Boolean(data);
}

function buildExpoPushPayload(input: {
  userId: string;
  title: string;
  message?: string;
  deepLink: string;
  secondaryId: string;
  includePush?: boolean;
  pushCustomData?: Record<string, string>;
}): ExpoPushPayload | null {
  if (!(input.includePush ?? true) || !input.message) return null;
  return {
    userId: input.userId,
    title: input.title,
    body: input.message,
    data: {
      url: input.deepLink,
      secondaryId: input.secondaryId,
      ...(input.pushCustomData ?? {}),
    },
  };
}

/** Dedicated SMS API — more reliable than /send + forceChannels for SMS-only alerts. */
async function pingramSendSms(
  apiKey: string,
  apiBase: string,
  input: {
    type: string;
    phone: string;
    message: string;
    userId?: string | null;
    properties?: Record<string, string | number | boolean | null | undefined>;
  },
): Promise<string | null> {
  const distinctId = input.userId?.trim() || 'sms_anonymous';
  try {
    const trackingId = await pingramPost(apiKey, apiBase, '/sms', {
      type: input.type,
      to: input.phone,
      message: toGsmSafeSms(input.message),
    });
    console.log(
      `[notify] pingram SMS accepted type=${input.type} to=${maskPhone(input.phone)} trackingId=${trackingId ?? 'none'}`,
    );
    void capturePosthogEvent({
      distinctId,
      event: 'sms_sent',
      properties: {
        type: input.type,
        tracking_id: trackingId,
        ...input.properties,
      },
    });
    return trackingId;
  } catch (error) {
    void capturePosthogEvent({
      distinctId,
      event: 'sms_failed',
      properties: {
        type: input.type,
        error: 'send_failed',
        ...input.properties,
      },
    });
    throw error;
  }
}

function isSmsReplyEnabled(): boolean {
  return Deno.env.get('SMS_REPLY_ENABLED')?.trim().toLowerCase() === 'true';
}

/** Offer code for "Reply YES {code}"; null (link-only SMS) if the offer can't be created. */
async function createSmsFillInOffer(
  supabase: ReturnType<typeof createClient>,
  input: { workerId: string; shiftPostId: string; phone: string },
): Promise<string | null> {
  const { data, error } = await supabase.rpc('create_sms_fill_in_offer', {
    p_worker_id: input.workerId,
    p_shift_post_id: input.shiftPostId,
    p_phone_e164: input.phone,
  });
  if (error || typeof data !== 'string') {
    console.error(
      `[notify] create_sms_fill_in_offer failed (workerId=${input.workerId}, shiftId=${input.shiftPostId})`,
      error,
    );
    return null;
  }
  return data;
}

async function recordSmsOfferTrackingId(
  supabase: ReturnType<typeof createClient>,
  input: { workerId: string; shiftPostId: string; trackingId: string },
): Promise<void> {
  const { error } = await supabase
    .from('sms_fill_in_offers')
    .update({ pingram_tracking_id: input.trackingId })
    .eq('worker_id', input.workerId)
    .eq('shift_post_id', input.shiftPostId);
  if (error) {
    console.error(
      `[notify] failed to store SMS offer trackingId (workerId=${input.workerId}, shiftId=${input.shiftPostId})`,
      error,
    );
  }
}

async function insertUserNotification(
  supabase: ReturnType<typeof createClient>,
  input: {
    userId: string;
    type: string;
    title: string;
    body?: string;
    deepLink: string;
    secondaryId: string;
  },
): Promise<void> {
  const { error } = await supabase.from('user_notifications').upsert(
    {
      user_id: input.userId,
      type: input.type,
      title: input.title,
      body: input.body ?? null,
      deep_link: input.deepLink,
      secondary_id: input.secondaryId,
    },
    { onConflict: 'user_id,secondary_id', ignoreDuplicates: true },
  );
  if (error) throw error;
}

type ExpoPushTicket = {
  status?: string;
  message?: string;
  details?: { error?: string };
};

async function deleteInvalidPushTokens(
  supabase: ReturnType<typeof createClient>,
  tokens: string[],
): Promise<void> {
  if (tokens.length === 0) return;
  const { error } = await supabase.from('user_push_tokens').delete().in('expo_push_token', tokens);
  if (error) {
    console.error('[notify] failed to prune invalid expo push tokens', error);
  }
}

async function sendExpoPushToUser(
  supabase: ReturnType<typeof createClient>,
  payload: ExpoPushPayload,
): Promise<void> {
  const { data: rows, error } = await supabase
    .from('user_push_tokens')
    .select('expo_push_token')
    .eq('user_id', payload.userId);

  if (error) throw error;
  const tokens = (rows ?? [])
    .map((row) => row.expo_push_token as string)
    .filter((token) => typeof token === 'string' && token.length > 0);

  if (tokens.length === 0) {
    console.warn(`[notify] expo push skipped: no tokens for ${payload.userId}`);
    return;
  }

  const messages = tokens.map((to) => ({
    to,
    title: payload.title,
    body: payload.body,
    data: payload.data,
    sound: 'default' as const,
    priority: 'high' as const,
    channelId: ANDROID_NOTIFICATION_CHANNEL_ID,
    interruptionLevel: 'active' as const,
  }));

  const headers: Record<string, string> = {
    Accept: 'application/json',
    'Accept-Encoding': 'gzip, deflate',
    'Content-Type': 'application/json',
  };
  const accessToken = Deno.env.get('EXPO_ACCESS_TOKEN')?.trim();
  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }

  const res = await fetch(EXPO_PUSH_URL, {
    method: 'POST',
    headers,
    body: JSON.stringify(messages),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Expo push failed (${res.status}): ${text}`);
  }

  const result = (await res.json().catch(() => null)) as { data?: ExpoPushTicket[] } | null;
  const tickets = Array.isArray(result?.data) ? result.data : [];
  const staleTokens: string[] = [];
  for (let index = 0; index < tickets.length; index += 1) {
    const ticket = tickets[index];
    if (ticket?.status !== 'error') continue;
    const ticketError = ticket.details?.error ?? ticket.message ?? 'unknown';
    console.error(
      `[notify] expo push ticket error for ${payload.userId}: ${ticketError}`,
    );
    if (ticket.details?.error === 'DeviceNotRegistered') {
      const token = tokens[index];
      if (token) staleTokens.push(token);
    }
  }

  await deleteInvalidPushTokens(supabase, staleTokens);
}

/**
 * In-app (Supabase) + Expo push. Pingram is only used for optional SMS.
 * Channel failures are independent so one cannot drop the others.
 */
async function sendUserAlert(
  supabase: ReturnType<typeof createClient>,
  apiKey: string,
  apiBase: string,
  input: {
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
  },
): Promise<{ smsTrackingId: string | null }> {
  let inboxError: unknown;
  let smsTrackingId: string | null = null;

  try {
    await insertUserNotification(supabase, {
      userId: input.userId,
      type: input.type,
      title: input.title,
      body: input.message,
      deepLink: input.deepLink,
      secondaryId: input.secondaryId,
    });
  } catch (error) {
    inboxError = error;
    console.error(
      `[notify] user_notifications insert failed for ${input.userId} type=${input.type}`,
      error,
    );
  }

  const expoPayload = buildExpoPushPayload(input);
  if (expoPayload) {
    try {
      await sendExpoPushToUser(supabase, expoPayload);
    } catch (error) {
      console.error(`[notify] expo push failed for ${input.userId}`, error);
    }
  }

  if (input.includeSms && input.smsMessage && input.phone) {
    try {
      smsTrackingId = await pingramSendSms(apiKey, apiBase, {
        type: input.type,
        phone: input.phone,
        message: input.smsMessage,
        userId: input.userId,
      });
    } catch (error) {
      console.error(`[notify] pingram SMS failed for ${input.userId} type=${input.type}`, error);
      throw error;
    }
  }

  // Inbox failure is already logged. Do not rethrow after SMS — that would release
  // idempotency and risk duplicate texts on webhook retry.
  if (inboxError && !(input.includeSms && input.smsMessage && input.phone)) {
    throw inboxError;
  }

  return { smsTrackingId };
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

async function releaseIdempotency(
  supabase: ReturnType<typeof createClient>,
  key: string,
): Promise<void> {
  const { error } = await supabase
    .from('notification_dispatch_log')
    .delete()
    .eq('idempotency_key', key);
  if (error) throw error;
}

async function withIdempotentDispatch(
  supabase: ReturnType<typeof createClient>,
  key: string,
  label: string,
  dispatch: () => Promise<void>,
): Promise<'sent' | 'skipped'> {
  if (!(await claimIdempotency(supabase, key))) {
    console.log(`[notify] ${label}: idempotency skip (${key})`);
    return 'skipped';
  }

  try {
    await dispatch();
    console.log(`[notify] ${label}: dispatched (${key})`);
    return 'sent';
  } catch (error) {
    try {
      await releaseIdempotency(supabase, key);
      console.error(`[notify] ${label}: send failed, released idempotency (${key})`, error);
    } catch (releaseError) {
      console.error(
        `[notify] ${label}: send failed and could not release idempotency (${key})`,
        releaseError,
      );
      console.error(`[notify] ${label}: original send failure (${key})`, error);
    }
    throw error;
  }
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

  const normalizedSenderId = normalizeUuid(senderId);
  const normalizedWorkerId = normalizeUuid(conversation.worker_id);
  const normalizedClinicId = normalizeUuid(conversation.clinic_id);
  if (!normalizedSenderId || !normalizedWorkerId || !normalizedClinicId) return;

  const senderIsWorker = normalizedSenderId === normalizedWorkerId;
  const senderIsClinicSide = senderIsWorker
    ? false
    : await isActiveClinicSideSender(supabase, conversation.clinic_id, senderId);

  if (!senderIsWorker && !senderIsClinicSide) return;

  const isGeneralConversation = conversation.conversation_type === 'general';
  const isOutreachConversation = conversation.conversation_type === 'outreach';

  let recipientIds: string[];
  if (senderIsWorker) {
    recipientIds = (
      await listClinicAlertRecipientUserIds(supabase, conversation.clinic_id)
    ).filter((userId) => normalizeUuid(userId) !== normalizedSenderId);
  } else {
    recipientIds = [conversation.worker_id];
  }

  if (recipientIds.length === 0) return;

  const recipientIsClinic = senderIsWorker;

  let senderLabel = 'Someone';
  if (senderIsWorker) {
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

  for (const recipientId of recipientIds) {
    const idempotencyKey = `${PINGRAM_TYPES.messageReceived}:${messageId}:${recipientId}`;
    const includePush = await isPushEnabledForUser(
      supabase,
      recipientId,
      NOTIFICATION_PREFERENCE_CATEGORIES.messages,
    );

    await withIdempotentDispatch(supabase, idempotencyKey, 'message_received', async () => {
      await sendUserAlert(
        supabase,
        pingramKey,
        pingramBase,
        {
          type: PINGRAM_TYPES.messageReceived,
          userId: recipientId,
          title,
          message,
          deepLink,
          secondaryId: idempotencyKey,
          includePush,
          pushCustomData: { senderId },
        },
      );
    });
  }

  if (
    isOutreachConversation &&
    triggerSmsAlert &&
    !recipientIsClinic &&
    senderIsClinicSide
  ) {
    const smsKey = `${PINGRAM_TYPES.fillInOutreachSms}:${messageId}`;

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
    const smsMessage = buildOutreachSms({
      clinicName,
      shiftDate: conversation.outreach_shift_date as string | null,
      startTime: conversation.outreach_start_time as string | null,
      endTime: conversation.outreach_end_time as string | null,
    });

    await withIdempotentDispatch(supabase, smsKey, 'fill_in_outreach_sms', async () => {
      await pingramSendSms(pingramKey, pingramBase, {
        type: PINGRAM_TYPES.fillInOutreachSms,
        phone: e164,
        message: smsMessage,
        userId: conversation.worker_id as string,
        properties: {
          conversation_id: conversation.id as string,
        },
      });
    });
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
    kit_requested: {
      pingramType: PINGRAM_TYPES.applicationKitRequested,
      title: 'Full application requested',
      message: 'A clinic asked you to complete your full application for this role.',
    },
  };
  const template = typeMap[status];
  if (!template) return;

  let notification = template;

  if (status === 'rejected' && isShift) {
    const closedBy = application.status_closed_by as string | null;
    const statusNote = application.status_note as string | null;
    if (closedBy === 'clinic_deleted') {
      notification = {
        pingramType: PINGRAM_TYPES.applicationRejected,
        title: 'Fill-in removed',
        message: 'A clinic removed a confirmed fill-in you were scheduled for.',
      };
    } else if (closedBy === 'clinic' && statusNote) {
      notification = {
        pingramType: PINGRAM_TYPES.applicationRejected,
        title: 'Fill-in cancelled',
        message: 'A clinic cancelled your confirmed fill-in.',
      };
    }

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
  const applicationUrl = buildApplicationUrl(applicationId);
  const deepLink = applicationUrl;

  let includeSms = false;
  let smsMessage: string | undefined;
  let workerPhone: string | null = null;

  if (isShift && (status === 'hired' || status === 'selected' || status === 'rejected')) {
    const { data: worker } = await supabase
      .from('worker_profiles')
      .select('fill_in_sms_opt_in, phone')
      .eq('id', workerId)
      .maybeSingle();
    workerPhone =
      worker?.fill_in_sms_opt_in === true
        ? normalizeE164((worker.phone as string | null | undefined) ?? null)
        : null;

    let clinicName = 'A clinic';
    let shiftDate: string | null = null;
    let startTime: string | null = null;
    let endTime: string | null = null;
    const shiftPostId = application.shift_post_id as string | null;
    if (shiftPostId) {
      const { data: shift } = await supabase
        .from('shift_posts')
        .select('clinic_id, shift_date, start_time, end_time, status')
        .eq('id', shiftPostId)
        .maybeSingle();
      shiftDate = (shift?.shift_date as string | null | undefined) ?? null;
      startTime = (shift?.start_time as string | null | undefined) ?? null;
      endTime = (shift?.end_time as string | null | undefined) ?? null;
      const clinicId = shift?.clinic_id as string | null | undefined;
      if (clinicId) {
        const { data: clinic } = await supabase
          .from('clinic_profiles')
          .select('clinic_name')
          .eq('id', clinicId)
          .maybeSingle();
        clinicName = clinic?.clinic_name?.trim() || 'A clinic';
      }
    }

    let outcome: 'accepted' | 'declined' | 'filled' = 'declined';
    if (status === 'hired' || status === 'selected') {
      outcome = 'accepted';
    } else if (notification.title === 'Cover request update' &&
      notification.message.includes('covered by another')) {
      outcome = 'filled';
    }

    smsMessage = buildFillInDecisionSms({
      outcome,
      clinicName,
      shiftDate,
      startTime,
      endTime,
      detailsUrl: outcome === 'accepted' || outcome === 'declined' ? applicationUrl : null,
    });
    includeSms = Boolean(workerPhone && smsMessage);
  }

  const includePush = await isPushEnabledForUser(
    supabase,
    workerId,
    NOTIFICATION_PREFERENCE_CATEGORIES.applicationsInterviews,
  );
  await withIdempotentDispatch(
    supabase,
    idempotencyKey,
    `worker_status_${status}`,
    async () => {
      await sendUserAlert(
        supabase,
        pingramKey,
        pingramBase,
        {
          type: notification.pingramType,
          userId: workerId,
          phone: includeSms ? workerPhone : undefined,
          title: notification.title,
          message: notification.message,
          deepLink,
          secondaryId: idempotencyKey,
          includePush,
          includeSms,
          smsMessage,
        },
      );
    },
  );
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
  const recipientIds = await listClinicAlertRecipientUserIds(supabase, clinicId);
  if (recipientIds.length === 0) return;

  const jobPostId = application.job_post_id as string | null;
  const shiftPostId = application.shift_post_id as string | null;
  const deepLink = jobPostId
    ? `chairside:///(clinic-tabs)/role-applicants/${jobPostId}`
    : shiftPostId
      ? `chairside:///(clinic-tabs)/shift-applicants/${shiftPostId}`
      : 'chairside:///(clinic-tabs)/applications';

  for (const recipientId of recipientIds) {
    const idempotencyKey = `${template.pingramType}:${applicationId}:${recipientId}`;
    const includePush = await isPushEnabledForUser(
      supabase,
      recipientId,
      NOTIFICATION_PREFERENCE_CATEGORIES.applicationsInterviews,
    );

    await withIdempotentDispatch(
      supabase,
      idempotencyKey,
      `clinic_application_${template.pingramType}`,
      async () => {
        await sendUserAlert(
          supabase,
          pingramKey,
          pingramBase,
          {
            type: template.pingramType,
            userId: recipientId,
            title: template.title,
            message: template.message,
            deepLink,
            secondaryId: idempotencyKey,
            includePush,
          },
        );
      },
    );
  }
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
      postTitle = `Fill-in · ${formatISODateLabel(shift.shift_date as string)}`;
      postType = 'fill-in';
    }
  }

  if (!clinicId) {
    console.log(
      `[notify] application INSERT: skipped, no clinicId (applicationId=${applicationId}, jobPostId=${jobPostId}, shiftPostId=${shiftPostId})`,
    );
    return;
  }

  console.log(
    `[notify] application INSERT: dispatching application_received (applicationId=${applicationId}, clinicId=${clinicId}, jobPostId=${jobPostId}, shiftPostId=${shiftPostId})`,
  );

  const recipientIds = await listClinicAlertRecipientUserIds(supabase, clinicId);
  if (recipientIds.length === 0) return;

  const workerName = (record.worker_display_name as string | null)?.trim() || 'A worker';
  const isShiftRequest = Boolean(shiftPostId);
  const applicationUrl = buildApplicationUrl(applicationId);

  const title = isShiftRequest
    ? `New cover request · ${postTitle}`
    : `New applicant · ${postTitle}`;
  const message = isShiftRequest
    ? `${workerName} requested to cover your ${postType}.`
    : `${workerName} applied to your ${postType}.`;
  const deepLink = applicationUrl;

  let clinicSmsPhone: string | null = null;
  let clinicSmsMessage: string | null = null;
  let clinicDecisionUrl = applicationUrl;
  if (isShiftRequest && shiftPostId) {
    const [{ data: clinic }, { data: shift }, decisionToken] = await Promise.all([
      supabase.from('clinic_profiles').select('phone').eq('id', clinicId).maybeSingle(),
      supabase
        .from('shift_posts')
        .select('shift_date, start_time, end_time')
        .eq('id', shiftPostId)
        .maybeSingle(),
      createFillInDecisionToken(supabase, applicationId),
    ]);
    clinicSmsPhone = normalizeE164((clinic?.phone as string | null | undefined) ?? null);
    clinicDecisionUrl = buildApplicationUrl(applicationId, decisionToken);
    clinicSmsMessage = buildClinicCoverRequestSms({
      workerName,
      shiftDate: (shift?.shift_date as string | null | undefined) ?? null,
      startTime: (shift?.start_time as string | null | undefined) ?? null,
      endTime: (shift?.end_time as string | null | undefined) ?? null,
      decisionUrl: clinicDecisionUrl,
    });
  }

  let clinicSmsSent = false;
  for (const recipientId of recipientIds) {
    const idempotencyKey = `${PINGRAM_TYPES.applicationReceived}:${applicationId}:${recipientId}`;
    const includePush = await isPushEnabledForUser(
      supabase,
      recipientId,
      NOTIFICATION_PREFERENCE_CATEGORIES.applicationsInterviews,
    );
    const sendClinicSms = Boolean(
      isShiftRequest && !clinicSmsSent && clinicSmsPhone && clinicSmsMessage,
    );

    await withIdempotentDispatch(supabase, idempotencyKey, 'application_received', async () => {
      await sendUserAlert(
        supabase,
        pingramKey,
        pingramBase,
        {
          type: PINGRAM_TYPES.applicationReceived,
          userId: recipientId,
          phone: sendClinicSms ? clinicSmsPhone : undefined,
          title,
          message,
          deepLink,
          secondaryId: idempotencyKey,
          includePush,
          includeSms: sendClinicSms,
          smsMessage: sendClinicSms ? clinicSmsMessage! : undefined,
        },
      );
    });
    if (sendClinicSms) clinicSmsSent = true;
  }
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

  console.log(
    `[notify] application UPDATE: ${oldStatus ?? 'unknown'} -> ${newStatus} (applicationId=${record.id as string})`,
  );

  const oldKitRequested = oldRecord?.application_kit_requested_at as string | null | undefined;
  const newKitRequested = record.application_kit_requested_at as string | null | undefined;
  if (!oldKitRequested && newKitRequested) {
    await sendWorkerStatusNotification(
      supabase,
      pingramKey,
      pingramBase,
      record,
      'kit_requested',
    );
  }

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
  shift: { role_type: string },
  clinicId: string | null,
) {
  // Outreach-first: SMS/push recipients match on role only (plus opt-in gates).
  // Schedule / available-days are not used for fill-in alerts.
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

  const eligibleWorkers = await filterWorkerNotificationRecipients(
    supabase,
    workers,
    clinicId ? [clinicId] : [],
  );
  if (!eligibleWorkers.length) return [];

  return eligibleWorkers.filter((worker) => {
    const roleTypes =
      Array.isArray(worker.role_types) && worker.role_types.length > 0
        ? worker.role_types
        : worker.role_type
          ? [worker.role_type]
          : [];
    return roleTypes.includes(shift.role_type);
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
  const clinicId = (record.clinic_id as string | null | undefined) ?? null;
  const isSourced = record.is_sourced === true;
  const shiftDate = record.shift_date as string;
  const roleType = record.role_type as string;
  const startTime = record.start_time as string | undefined;
  const endTime = record.end_time as string | undefined;
  const compensation = record.compensation as string | null | undefined;
  const updatedAt = (record.updated_at as string | undefined) ?? shiftId;

  let clinicName = 'A clinic';
  let locationLabel = '';

  if (isSourced) {
    clinicName =
      (typeof record.display_clinic_name === 'string' && record.display_clinic_name.trim()) ||
      'A clinic';
    locationLabel = formatClinicLocation({
      city: typeof record.display_city === 'string' ? record.display_city : null,
      province: typeof record.display_province === 'string' ? record.display_province : null,
    });
  } else if (clinicId) {
    const { data: clinic } = await supabase
      .from('clinic_profiles')
      .select('clinic_name, city, province')
      .eq('id', clinicId)
      .maybeSingle();
    clinicName = clinic?.clinic_name?.trim() || 'A clinic';
    locationLabel = formatClinicLocation(clinic ?? {});
  }

  const listingUrl = buildFillInListingUrl(shiftId);
  const fillInCopyInput = {
    clinicName,
    locationLabel,
    shiftDate: typeof shiftDate === 'string' ? shiftDate : null,
    startTime,
    endTime,
    compensation,
    isUpdate: options.isUpdate === true,
    listingUrl,
    listingCta: isSourced ? ('Details' as const) : ('Apply' as const),
  };
  const fillInCopy = buildFillInAlertCopy(fillInCopyInput);
  // YES-reply cover requests need a real clinic_id — never offer them for sourced ads.
  const smsReplyEnabled = !isSourced && isSmsReplyEnabled();
  const recipients = await listFillInRecipients(
    supabase,
    { role_type: roleType },
    clinicId,
  );

  const clinicSmsAllowed = await clinicCanSendFillInSms(supabase, clinicId, isSourced);
  const smsEligibleCount = clinicSmsAllowed
    ? recipients.filter(
        (w) => w.fill_in_sms_opt_in === true && normalizeE164(w.phone as string | null),
      ).length
    : 0;
  console.log(
    `[notify] fill_in_posted: shift=${shiftId} role=${roleType} recipients=${recipients.length} clinicSmsAllowed=${clinicSmsAllowed} smsEligible=${smsEligibleCount}`,
  );

  // Cost monitoring: estimated billed SMS segments for this post, by role and location.
  // Pingram bills per segment, so this is the number to watch against the CA$7.99 price.
  if (clinicSmsAllowed) {
    const segmentsPerSms = smsSegmentCount(
      buildFillInSms({ ...fillInCopyInput, replyCode: null }),
    );
    console.log(
      `[notify] fill_in_sms_cost shift=${shiftId} role=${roleType} location="${locationLabel}" eligible=${smsEligibleCount} segmentsPerSms=${segmentsPerSms} estimatedSegments=${smsEligibleCount * segmentsPerSms}`,
    );
  }

  const pushPreferences = await loadPushPreferenceMap(
    supabase,
    recipients.map((worker) => worker.id),
    NOTIFICATION_PREFERENCE_CATEGORIES.fillInAlerts,
  );

  const notifiedRecipientIds = new Set<string>();

  for (const worker of recipients) {
    notifiedRecipientIds.add(worker.id);
    const idempotencyKey = `${PINGRAM_TYPES.fillInPosted}:${shiftId}:${worker.id}:${updatedAt}`;

    const deepLink = `chairside:///(tabs)/shift/${shiftId}`;
    const smsOptIn = clinicSmsAllowed && worker.fill_in_sms_opt_in === true;
    const e164 = smsOptIn ? normalizeE164(worker.phone as string | null) : null;
    if (smsOptIn && !e164) {
      console.warn(
        `[notify] fill_in_posted: SMS opted in but phone invalid/missing (workerId=${worker.id})`,
      );
    }

    try {
      const result = await withIdempotentDispatch(
        supabase,
        idempotencyKey,
        'fill_in_posted',
        async () => {
          const replyCode =
            smsReplyEnabled && e164
              ? await createSmsFillInOffer(supabase, {
                  workerId: worker.id,
                  shiftPostId: shiftId,
                  phone: e164,
                })
              : null;
          const { smsTrackingId } = await sendUserAlert(
            supabase,
            pingramKey,
            pingramBase,
            {
              type: PINGRAM_TYPES.fillInPosted,
              userId: worker.id,
              phone: e164 ?? undefined,
              title: fillInCopy.title,
              message: fillInCopy.message,
              deepLink,
              secondaryId: idempotencyKey,
              includePush: pushPreferences.get(worker.id) ?? true,
              includeSms: Boolean(smsOptIn && e164),
              smsMessage: replyCode
                ? buildFillInSms({
                    ...fillInCopyInput,
                    replyCode,
                    listingUrl: fillInCopyInput.listingUrl,
                    listingCta: 'Details',
                  })
                : fillInCopy.smsMessage,
            },
          );
          if (replyCode && smsTrackingId) {
            await recordSmsOfferTrackingId(supabase, {
              workerId: worker.id,
              shiftPostId: shiftId,
              trackingId: smsTrackingId,
            });
          }
        },
      );
      if (result === 'skipped') continue;
    } catch (error) {
      console.error(
        `[notify] fill_in_posted: failed (workerId=${worker.id}, key=${idempotencyKey})`,
        error,
      );
      continue;
    }
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
  const clinicId = (record.clinic_id as string | null | undefined) ?? null;
  const isSourced = record.is_sourced === true;
  const roleType = record.role_type as string;
  const title = record.title as string;

  let clinicName = 'A clinic';
  let cityLabel = '';

  if (isSourced) {
    clinicName =
      (typeof record.display_clinic_name === 'string' && record.display_clinic_name.trim()) ||
      'A clinic';
    const city =
      typeof record.display_city === 'string' ? record.display_city.trim() : '';
    cityLabel = city ? ` · ${city}` : '';
  } else if (clinicId) {
    const { data: clinic } = await supabase
      .from('clinic_profiles')
      .select('clinic_name, city')
      .eq('id', clinicId)
      .maybeSingle();
    clinicName = clinic?.clinic_name?.trim() || 'A clinic';
    cityLabel = clinic?.city ? ` · ${clinic.city}` : '';
  }

  const { data: workers, error } = await supabase
    .from('worker_profiles')
    .select('id')
    .eq('job_notification_opt_in', true)
    .or(`role_type.eq.${roleType},role_types.cs.{${roleType}}`)
    .not('setup_completed_at', 'is', null);

  if (error) throw error;

  const recipients = await filterWorkerNotificationRecipients(
    supabase,
    workers ?? [],
    clinicId ? [clinicId] : [],
  );

  const pushPreferences = await loadPushPreferenceMap(
    supabase,
    recipients.map((worker) => worker.id),
    NOTIFICATION_PREFERENCE_CATEGORIES.jobAlerts,
  );

  for (const worker of recipients) {
    const idempotencyKey = `${PINGRAM_TYPES.jobPosted}:${jobId}:${worker.id}`;

    const notifTitle = `New role · ${title}`;
    const message = `${clinicName}${cityLabel} posted ${title}.`;
    const deepLink = 'chairside:///(tabs)/browse';

    try {
      const result = await withIdempotentDispatch(
        supabase,
        idempotencyKey,
        'job_posted',
        async () => {
          await sendUserAlert(
            supabase,
            pingramKey,
            pingramBase,
            {
              type: PINGRAM_TYPES.jobPosted,
              userId: worker.id,
              title: notifTitle,
              message,
              deepLink,
              secondaryId: idempotencyKey,
              includePush: pushPreferences.get(worker.id) ?? true,
            },
          );
        },
      );
      if (result === 'skipped') continue;
    } catch (error) {
      console.error(
        `[notify] job_posted: failed (workerId=${worker.id}, key=${idempotencyKey})`,
        error,
      );
      continue;
    }
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

// Edits to these fields re-alert the pool (push + SMS). Pay-only edits (compensation) do not,
// so a pay tweak never re-texts every matching worker (each re-text costs an SMS segment).
const FILL_IN_NOTIFY_FIELDS = [
  'role_type',
  'shift_date',
  'start_time',
  'end_time',
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
  clinicId: string | null,
): Promise<Array<{ id: string }>> {
  const { data, error } = await supabase
    .from('worker_saved_posts')
    .select('worker_id')
    .eq('job_post_id', jobId);

  if (error) throw error;
  const workers = (data ?? []).map((row) => ({ id: row.worker_id as string }));
  return filterWorkerNotificationRecipients(supabase, workers, clinicId ? [clinicId] : []);
}

async function listSavedWorkersForShift(
  supabase: ReturnType<typeof createClient>,
  shiftId: string,
  clinicId: string | null,
): Promise<Array<{ id: string }>> {
  const { data, error } = await supabase
    .from('worker_saved_posts')
    .select('worker_id')
    .eq('shift_post_id', shiftId);

  if (error) throw error;
  const workers = (data ?? []).map((row) => ({ id: row.worker_id as string }));
  return filterWorkerNotificationRecipients(supabase, workers, clinicId ? [clinicId] : []);
}

async function handleSavedJobPostUpdate(
  supabase: ReturnType<typeof createClient>,
  pingramKey: string,
  pingramBase: string,
  record: Record<string, unknown>,
  oldRecord: Record<string, unknown>,
) {
  const jobId = record.id as string;
  const clinicId = (record.clinic_id as string | null | undefined) ?? null;
  const isSourced = record.is_sourced === true;
  const title = record.title as string;
  const updatedAt = (record.updated_at as string | undefined) ?? jobId;
  const unavailable = savedJobBecameUnavailable(record, oldRecord);

  const savers = await listSavedWorkersForJob(supabase, jobId, clinicId);
  if (!savers.length) return;

  let clinicName = 'A clinic';
  let cityLabel = '';
  if (isSourced) {
    clinicName =
      (typeof record.display_clinic_name === 'string' && record.display_clinic_name.trim()) ||
      'A clinic';
    const city =
      typeof record.display_city === 'string' ? record.display_city.trim() : '';
    cityLabel = city ? ` · ${city}` : '';
  } else if (clinicId) {
    const { data: clinic } = await supabase
      .from('clinic_profiles')
      .select('clinic_name, city')
      .eq('id', clinicId)
      .maybeSingle();
    clinicName = clinic?.clinic_name?.trim() || 'A clinic';
    cityLabel = clinic?.city ? ` · ${clinic.city}` : '';
  }
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

    try {
      const result = await withIdempotentDispatch(
        supabase,
        idempotencyKey,
        pingramType,
        async () => {
          await sendUserAlert(
            supabase,
            pingramKey,
            pingramBase,
            {
              type: pingramType,
              userId: worker.id,
              title: notifTitle,
              message,
              deepLink,
              secondaryId: idempotencyKey,
              includePush: pushPreferences.get(worker.id) ?? true,
            },
          );
        },
      );
      if (result === 'skipped') continue;
    } catch (error) {
      console.error(
        `[notify] ${pingramType}: failed (workerId=${worker.id}, key=${idempotencyKey})`,
        error,
      );
      continue;
    }
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
  const clinicId = (record.clinic_id as string | null | undefined) ?? null;
  const isSourced = record.is_sourced === true;
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

  let clinicName = 'A clinic';
  let locationLabel = '';
  if (isSourced) {
    clinicName =
      (typeof record.display_clinic_name === 'string' && record.display_clinic_name.trim()) ||
      'A clinic';
    locationLabel = formatClinicLocation({
      city: typeof record.display_city === 'string' ? record.display_city : null,
      province: typeof record.display_province === 'string' ? record.display_province : null,
    });
  } else if (clinicId) {
    const { data: clinic } = await supabase
      .from('clinic_profiles')
      .select('clinic_name, city, province')
      .eq('id', clinicId)
      .maybeSingle();
    clinicName = clinic?.clinic_name?.trim() || 'A clinic';
    locationLabel = formatClinicLocation(clinic ?? {});
  }
  const locationSuffix = locationLabel ? ` · ${locationLabel}` : '';
  const deepLink = 'chairside:///(tabs)/fillins';
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

    try {
      const result = await withIdempotentDispatch(
        supabase,
        idempotencyKey,
        pingramType,
        async () => {
          await sendUserAlert(
            supabase,
            pingramKey,
            pingramBase,
            {
              type: pingramType,
              userId: worker.id,
              title: notifTitle,
              message,
              deepLink,
              secondaryId: idempotencyKey,
              includePush: pushPreferences.get(worker.id) ?? true,
            },
          );
        },
      );
      if (result === 'skipped') continue;
    } catch (error) {
      console.error(
        `[notify] ${pingramType}: failed (workerId=${worker.id}, key=${idempotencyKey})`,
        error,
      );
      continue;
    }
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

    const pingramKey = Deno.env.get('PINGRAM_API_KEY') ?? '';
    const pingramBase = Deno.env.get('PINGRAM_API_URL') ?? DEFAULT_PINGRAM_API_URL;
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !serviceRoleKey) {
      return jsonResponse({ error: 'Supabase service configuration missing' }, 500);
    }
    if (!pingramKey) {
      console.warn(
        '[notify] PINGRAM_API_KEY not set — email/SMS channels disabled; in-app + Expo push still run',
      );
    }

    const payload = (await req.json()) as WebhookPayload;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    if (payload.table === 'applications') {
      console.log(`[notify] applications ${payload.type} received`);
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
