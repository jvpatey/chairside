import { getSupabaseClient } from './client';
import type { ApplicationStatus } from './applications';

export type ConversationRow = {
  id: string;
  application_id: string;
  worker_id: string;
  clinic_id: string;
  worker_last_read_at: string | null;
  clinic_last_read_at: string | null;
  last_message_at: string | null;
  last_message_preview: string | null;
  last_sender_id: string | null;
  messaging_closed_at: string | null;
  created_at: string;
  updated_at: string;
};

export type MessageRow = {
  id: string;
  conversation_id: string;
  sender_id: string;
  body: string;
  created_at: string;
};

export type Conversation = ConversationRow & {
  application_status: ApplicationStatus;
  post_title: string;
  post_type: 'job' | 'shift';
  counterpart_name: string;
  counterpart_logo_storage_path: string | null;
  unread: boolean;
  can_send: boolean;
};

export type Message = MessageRow;

const MESSAGE_BODY_MAX_LENGTH = 2000;

function isUnreadForRole(
  conversation: ConversationRow,
  role: 'worker' | 'clinic',
  viewerId: string,
): boolean {
  if (!conversation.last_message_at) return false;
  if (conversation.last_sender_id === viewerId) return false;

  const lastReadAt =
    role === 'worker' ? conversation.worker_last_read_at : conversation.clinic_last_read_at;
  if (!lastReadAt) return true;
  return new Date(conversation.last_message_at).getTime() > new Date(lastReadAt).getTime();
}

function canSendMessages(
  applicationStatus: ApplicationStatus,
  messagingClosedAt: string | null,
): boolean {
  if (messagingClosedAt) return false;
  return (
    applicationStatus === 'applied' ||
    applicationStatus === 'reviewed' ||
    applicationStatus === 'in_progress' ||
    applicationStatus === 'interview_offered' ||
    applicationStatus === 'interview_scheduled' ||
    applicationStatus === 'selected'
  );
}

async function enrichWorkerConversations(
  rows: ConversationRow[],
  workerId: string,
): Promise<Conversation[]> {
  if (rows.length === 0) return [];

  const supabase = getSupabaseClient();
  const applicationIds = rows.map((row) => row.application_id);

  const { data: applications, error: applicationsError } = await supabase
    .from('applications')
    .select('id, status, job_post_id, shift_post_id')
    .in('id', applicationIds);

  if (applicationsError) throw applicationsError;

  const applicationMap = new Map((applications ?? []).map((row) => [row.id, row]));
  const jobIds = [...new Set((applications ?? []).map((row) => row.job_post_id).filter(Boolean))] as string[];
  const shiftIds = [
    ...new Set((applications ?? []).map((row) => row.shift_post_id).filter(Boolean)),
  ] as string[];

  const [jobsResult, shiftsResult] = await Promise.all([
    jobIds.length > 0
      ? supabase.from('job_posts').select('id, title, clinic_id').in('id', jobIds)
      : Promise.resolve({ data: [], error: null }),
    shiftIds.length > 0
      ? supabase.from('shift_posts').select('id, shift_date, clinic_id').in('id', shiftIds)
      : Promise.resolve({ data: [], error: null }),
  ]);

  if (jobsResult.error) throw jobsResult.error;
  if (shiftsResult.error) throw shiftsResult.error;

  const jobMap = new Map((jobsResult.data ?? []).map((job) => [job.id, job]));
  const shiftMap = new Map((shiftsResult.data ?? []).map((shift) => [shift.id, shift]));
  const clinicIds = [
    ...new Set([
      ...(jobsResult.data ?? []).map((job) => job.clinic_id),
      ...(shiftsResult.data ?? []).map((shift) => shift.clinic_id),
    ]),
  ];

  const { data: clinics, error: clinicsError } =
    clinicIds.length > 0
      ? await supabase
          .from('clinic_profiles')
          .select('id, clinic_name, logo_storage_path')
          .in('id', clinicIds)
      : { data: [], error: null };

  if (clinicsError) throw clinicsError;
  const clinicMap = new Map((clinics ?? []).map((clinic) => [clinic.id, clinic]));

  const conversations: Conversation[] = [];

  for (const row of rows) {
    const application = applicationMap.get(row.application_id);
    if (!application) continue;

    const status = application.status as ApplicationStatus;

    if (application.job_post_id && jobMap.has(application.job_post_id)) {
      const job = jobMap.get(application.job_post_id)!;
      const clinic = clinicMap.get(job.clinic_id);
      conversations.push({
        ...row,
        application_status: status,
        post_title: job.title,
        post_type: 'job',
        counterpart_name: clinic?.clinic_name ?? 'Clinic',
        counterpart_logo_storage_path: clinic?.logo_storage_path ?? null,
        unread: isUnreadForRole(row, 'worker', workerId),
        can_send: canSendMessages(status, row.messaging_closed_at),
      });
    } else if (application.shift_post_id && shiftMap.has(application.shift_post_id)) {
      const shift = shiftMap.get(application.shift_post_id)!;
      const clinic = clinicMap.get(shift.clinic_id);
      conversations.push({
        ...row,
        application_status: status,
        post_title: `Fill-in · ${shift.shift_date}`,
        post_type: 'shift',
        counterpart_name: clinic?.clinic_name ?? 'Clinic',
        counterpart_logo_storage_path: clinic?.logo_storage_path ?? null,
        unread: isUnreadForRole(row, 'worker', workerId),
        can_send: canSendMessages(status, row.messaging_closed_at),
      });
    }
  }

  return conversations.sort((a, b) => {
    const aTime = a.last_message_at ? new Date(a.last_message_at).getTime() : 0;
    const bTime = b.last_message_at ? new Date(b.last_message_at).getTime() : 0;
    return bTime - aTime;
  });
}

async function enrichClinicConversations(
  rows: ConversationRow[],
  clinicId: string,
): Promise<Conversation[]> {
  if (rows.length === 0) return [];

  const supabase = getSupabaseClient();
  const applicationIds = rows.map((row) => row.application_id);
  const workerIds = [...new Set(rows.map((row) => row.worker_id))];

  const [applicationsResult, workersResult] = await Promise.all([
    supabase
      .from('applications')
      .select('id, status, job_post_id, shift_post_id, worker_display_name')
      .in('id', applicationIds),
    supabase
      .from('worker_profiles')
      .select('id, photo_storage_path')
      .in('id', workerIds),
  ]);

  if (applicationsResult.error) throw applicationsResult.error;
  if (workersResult.error) throw workersResult.error;

  const applicationMap = new Map((applicationsResult.data ?? []).map((row) => [row.id, row]));
  const workerMap = new Map((workersResult.data ?? []).map((row) => [row.id, row]));

  const jobIds = [
    ...new Set((applicationsResult.data ?? []).map((row) => row.job_post_id).filter(Boolean)),
  ] as string[];
  const shiftIds = [
    ...new Set((applicationsResult.data ?? []).map((row) => row.shift_post_id).filter(Boolean)),
  ] as string[];

  const [jobsResult, shiftsResult] = await Promise.all([
    jobIds.length > 0
      ? supabase.from('job_posts').select('id, title').in('id', jobIds)
      : Promise.resolve({ data: [], error: null }),
    shiftIds.length > 0
      ? supabase.from('shift_posts').select('id, shift_date').in('id', shiftIds)
      : Promise.resolve({ data: [], error: null }),
  ]);

  if (jobsResult.error) throw jobsResult.error;
  if (shiftsResult.error) throw shiftsResult.error;

  const jobMap = new Map((jobsResult.data ?? []).map((job) => [job.id, job]));
  const shiftMap = new Map((shiftsResult.data ?? []).map((shift) => [shift.id, shift]));

  const conversations: Conversation[] = [];

  for (const row of rows) {
    const application = applicationMap.get(row.application_id);
    if (!application) continue;

    const status = application.status as ApplicationStatus;
    const worker = workerMap.get(row.worker_id);
    const counterpartName =
      application.worker_display_name?.trim() || 'Applicant';

    if (application.job_post_id && jobMap.has(application.job_post_id)) {
      const job = jobMap.get(application.job_post_id)!;
      conversations.push({
        ...row,
        application_status: status,
        post_title: job.title,
        post_type: 'job',
        counterpart_name: counterpartName,
        counterpart_logo_storage_path: worker?.photo_storage_path ?? null,
        unread: isUnreadForRole(row, 'clinic', clinicId),
        can_send: canSendMessages(status, row.messaging_closed_at),
      });
    } else if (application.shift_post_id && shiftMap.has(application.shift_post_id)) {
      const shift = shiftMap.get(application.shift_post_id)!;
      conversations.push({
        ...row,
        application_status: status,
        post_title: `Fill-in · ${shift.shift_date}`,
        post_type: 'shift',
        counterpart_name: counterpartName,
        counterpart_logo_storage_path: worker?.photo_storage_path ?? null,
        unread: isUnreadForRole(row, 'clinic', clinicId),
        can_send: canSendMessages(status, row.messaging_closed_at),
      });
    }
  }

  return conversations.sort((a, b) => {
    const aTime = a.last_message_at ? new Date(a.last_message_at).getTime() : 0;
    const bTime = b.last_message_at ? new Date(b.last_message_at).getTime() : 0;
    return bTime - aTime;
  });
}

export async function listConversationsForWorker(workerId: string): Promise<Conversation[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('conversations')
    .select('*')
    .eq('worker_id', workerId)
    .order('last_message_at', { ascending: false, nullsFirst: false });

  if (error) throw error;
  return enrichWorkerConversations((data ?? []) as ConversationRow[], workerId);
}

export async function listConversationsForClinic(clinicId: string): Promise<Conversation[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('conversations')
    .select('*')
    .eq('clinic_id', clinicId)
    .order('last_message_at', { ascending: false, nullsFirst: false });

  if (error) throw error;
  return enrichClinicConversations((data ?? []) as ConversationRow[], clinicId);
}

export async function getConversationByApplicationId(
  userId: string,
  role: 'worker' | 'clinic',
  applicationId: string,
): Promise<Conversation | null> {
  const supabase = getSupabaseClient();
  let query = supabase.from('conversations').select('*').eq('application_id', applicationId);

  if (role === 'worker') {
    query = query.eq('worker_id', userId);
  } else {
    query = query.eq('clinic_id', userId);
  }

  const { data, error } = await query.maybeSingle();
  if (error) throw error;
  if (!data) return null;

  const enriched =
    role === 'worker'
      ? await enrichWorkerConversations([data as ConversationRow], userId)
      : await enrichClinicConversations([data as ConversationRow], userId);

  return enriched[0] ?? null;
}

export async function getConversation(
  userId: string,
  role: 'worker' | 'clinic',
  conversationId: string,
): Promise<Conversation | null> {
  const supabase = getSupabaseClient();
  let query = supabase.from('conversations').select('*').eq('id', conversationId);

  if (role === 'worker') {
    query = query.eq('worker_id', userId);
  } else {
    query = query.eq('clinic_id', userId);
  }

  const { data, error } = await query.maybeSingle();
  if (error) throw error;
  if (!data) return null;

  const enriched =
    role === 'worker'
      ? await enrichWorkerConversations([data as ConversationRow], userId)
      : await enrichClinicConversations([data as ConversationRow], userId);

  return enriched[0] ?? null;
}

export async function listMessages(
  conversationId: string,
  options?: { before?: string; limit?: number },
): Promise<Message[]> {
  const supabase = getSupabaseClient();
  const limit = options?.limit ?? 50;

  let query = supabase
    .from('messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (options?.before) {
    query = query.lt('created_at', options.before);
  }

  const { data, error } = await query;
  if (error) throw error;

  return ((data ?? []) as MessageRow[]).reverse();
}

export async function sendMessage(
  userId: string,
  conversationId: string,
  body: string,
): Promise<Message> {
  const trimmed = body.trim();
  if (!trimmed) {
    throw new Error('Message cannot be empty.');
  }
  if (trimmed.length > MESSAGE_BODY_MAX_LENGTH) {
    throw new Error(`Message must be ${MESSAGE_BODY_MAX_LENGTH} characters or fewer.`);
  }

  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('messages')
    .insert({
      conversation_id: conversationId,
      sender_id: userId,
      body: trimmed,
    })
    .select('*')
    .single();

  if (error) throw error;
  return data as Message;
}

export async function markConversationRead(conversationId: string): Promise<void> {
  const supabase = getSupabaseClient();
  const { error } = await supabase.rpc('mark_conversation_read', {
    p_conversation_id: conversationId,
  });

  if (error) throw error;
}

export async function getUnreadConversationCount(
  userId: string,
  role: 'worker' | 'clinic',
): Promise<number> {
  const conversations =
    role === 'worker'
      ? await listConversationsForWorker(userId)
      : await listConversationsForClinic(userId);

  return conversations.filter((conversation) => conversation.unread).length;
}

export async function getUnreadConversationMap(
  userId: string,
  role: 'worker' | 'clinic',
): Promise<Record<string, boolean>> {
  const conversations =
    role === 'worker'
      ? await listConversationsForWorker(userId)
      : await listConversationsForClinic(userId);

  const map: Record<string, boolean> = {};
  for (const conversation of conversations) {
    if (conversation.unread) {
      map[conversation.application_id] = true;
    }
  }
  return map;
}
