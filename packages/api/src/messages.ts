import { getSupabaseClient } from './client';
import {
  DELETED_CANDIDATE_LABEL,
  DELETED_CLINIC_LABEL,
} from '@chairside/config';
import type { ApplicationStatus } from './applications';

export type ConversationType = 'application' | 'general';

export type ConversationRow = {
  id: string;
  application_id: string | null;
  conversation_type: ConversationType;
  worker_id: string;
  clinic_id: string;
  worker_last_read_at: string | null;
  clinic_last_read_at: string | null;
  last_message_at: string | null;
  last_message_preview: string | null;
  last_sender_id: string | null;
  messaging_closed_at: string | null;
  worker_hidden_at: string | null;
  clinic_hidden_at: string | null;
  worker_account_deleted_at: string | null;
  clinic_account_deleted_at: string | null;
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
  application_status: ApplicationStatus | null;
  post_title: string | null;
  post_type: 'job' | 'shift' | null;
  post_role_type: string | null;
  shift_date: string | null;
  shift_start_time: string | null;
  shift_end_time: string | null;
  counterpart_name: string;
  counterpart_logo_storage_path: string | null;
  counterpart_account_deleted: boolean;
  unread: boolean;
  can_send: boolean;
};

export type MessageableClinic = {
  id: string;
  clinic_name: string;
  city: string | null;
  province: string;
  specialty: string;
  description: string | null;
  logo_storage_path: string | null;
  existing_conversation_id: string | null;
};

export type Message = MessageRow;

const MESSAGE_BODY_MAX_LENGTH = 2000;

const CONVERSATION_UNREAD_SELECT =
  'application_id, last_message_at, last_sender_id, worker_last_read_at, clinic_last_read_at, worker_hidden_at, clinic_hidden_at' as const;

type ConversationUnreadSnapshot = Pick<
  ConversationRow,
  | 'application_id'
  | 'last_message_at'
  | 'last_sender_id'
  | 'worker_last_read_at'
  | 'clinic_last_read_at'
  | 'worker_hidden_at'
  | 'clinic_hidden_at'
>;

function isUnreadForRole(
  conversation: ConversationUnreadSnapshot,
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

function isConversationCounterpartDeleted(
  conversation: Pick<ConversationRow, 'worker_account_deleted_at' | 'clinic_account_deleted_at'>,
  role: 'worker' | 'clinic',
): boolean {
  return role === 'worker'
    ? Boolean(conversation.clinic_account_deleted_at)
    : Boolean(conversation.worker_account_deleted_at);
}

function canSendApplicationMessages(
  applicationStatus: ApplicationStatus,
  messagingClosedAt: string | null,
  conversation: Pick<ConversationRow, 'worker_account_deleted_at' | 'clinic_account_deleted_at'>,
): boolean {
  if (messagingClosedAt) return false;
  if (conversation.worker_account_deleted_at || conversation.clinic_account_deleted_at) {
    return false;
  }
  return (
    applicationStatus === 'applied' ||
    applicationStatus === 'reviewed' ||
    applicationStatus === 'in_progress' ||
    applicationStatus === 'interview_offered' ||
    applicationStatus === 'interview_scheduled' ||
    applicationStatus === 'selected'
  );
}

function canSendGeneralMessages(
  messagingClosedAt: string | null,
  clinicAcceptsGeneral: boolean,
  conversation: Pick<ConversationRow, 'worker_account_deleted_at' | 'clinic_account_deleted_at'>,
): boolean {
  if (messagingClosedAt) return false;
  if (conversation.worker_account_deleted_at || conversation.clinic_account_deleted_at) {
    return false;
  }
  return clinicAcceptsGeneral;
}

async function enrichWorkerConversations(
  rows: ConversationRow[],
  workerId: string,
): Promise<Conversation[]> {
  if (rows.length === 0) return [];

  const supabase = getSupabaseClient();
  const applicationRows = rows.filter((row) => row.conversation_type === 'application');
  const generalRows = rows.filter((row) => row.conversation_type === 'general');
  const conversations: Conversation[] = [];

  if (applicationRows.length > 0) {
    const applicationIds = applicationRows.map((row) => row.application_id!);

    const { data: applications, error: applicationsError } = await supabase
      .from('applications')
      .select('id, status, job_post_id, shift_post_id')
      .in('id', applicationIds);

    if (applicationsError) throw applicationsError;

    const applicationMap = new Map((applications ?? []).map((row) => [row.id, row]));
    const jobIds = [
      ...new Set((applications ?? []).map((row) => row.job_post_id).filter(Boolean)),
    ] as string[];
    const shiftIds = [
      ...new Set((applications ?? []).map((row) => row.shift_post_id).filter(Boolean)),
    ] as string[];

    const [jobsResult, shiftsResult] = await Promise.all([
      jobIds.length > 0
        ? supabase.from('job_posts').select('id, title, role_type, clinic_id').in('id', jobIds)
        : Promise.resolve({ data: [], error: null }),
      shiftIds.length > 0
        ? supabase
            .from('shift_posts')
            .select('id, shift_date, start_time, end_time, role_type, clinic_id')
            .in('id', shiftIds)
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

    for (const row of applicationRows) {
      const application = applicationMap.get(row.application_id!);
      if (!application) continue;

      const status = application.status as ApplicationStatus;

      if (application.job_post_id && jobMap.has(application.job_post_id)) {
        const job = jobMap.get(application.job_post_id)!;
        const clinic = clinicMap.get(job.clinic_id);
        const clinicDeleted = isConversationCounterpartDeleted(row, 'worker');
        conversations.push({
          ...row,
          application_status: status,
          post_title: job.title,
          post_type: 'job',
          post_role_type: job.role_type ?? null,
          shift_date: null,
          shift_start_time: null,
          shift_end_time: null,
          counterpart_name: clinicDeleted
            ? DELETED_CLINIC_LABEL
            : clinic?.clinic_name ?? 'Clinic',
          counterpart_logo_storage_path: clinicDeleted
            ? null
            : clinic?.logo_storage_path ?? null,
          counterpart_account_deleted: clinicDeleted,
          unread: isUnreadForRole(row, 'worker', workerId),
          can_send: canSendApplicationMessages(status, row.messaging_closed_at, row),
        });
      } else if (application.shift_post_id && shiftMap.has(application.shift_post_id)) {
        const shift = shiftMap.get(application.shift_post_id)!;
        const clinic = clinicMap.get(shift.clinic_id);
        const clinicDeleted = isConversationCounterpartDeleted(row, 'worker');
        conversations.push({
          ...row,
          application_status: status,
          post_title: `Fill-in · ${shift.shift_date}`,
          post_type: 'shift',
          post_role_type: shift.role_type ?? null,
          shift_date: shift.shift_date,
          shift_start_time: shift.start_time,
          shift_end_time: shift.end_time,
          counterpart_name: clinicDeleted
            ? DELETED_CLINIC_LABEL
            : clinic?.clinic_name ?? 'Clinic',
          counterpart_logo_storage_path: clinicDeleted
            ? null
            : clinic?.logo_storage_path ?? null,
          counterpart_account_deleted: clinicDeleted,
          unread: isUnreadForRole(row, 'worker', workerId),
          can_send: canSendApplicationMessages(status, row.messaging_closed_at, row),
        });
      }
    }
  }

  if (generalRows.length > 0) {
    const clinicIds = [...new Set(generalRows.map((row) => row.clinic_id))];
    const { data: clinics, error: clinicsError } = await supabase
      .from('clinic_profiles')
      .select('id, clinic_name, logo_storage_path, accepts_general_candidate_messages')
      .in('id', clinicIds);

    if (clinicsError) throw clinicsError;
    const clinicMap = new Map((clinics ?? []).map((clinic) => [clinic.id, clinic]));

    for (const row of generalRows) {
      const clinic = clinicMap.get(row.clinic_id);
      const clinicDeleted = isConversationCounterpartDeleted(row, 'worker');
      conversations.push({
        ...row,
        application_status: null,
        post_title: null,
        post_type: null,
        post_role_type: null,
        shift_date: null,
        shift_start_time: null,
        shift_end_time: null,
        counterpart_name: clinicDeleted
          ? DELETED_CLINIC_LABEL
          : clinic?.clinic_name ?? 'Clinic',
        counterpart_logo_storage_path: clinicDeleted
          ? null
          : clinic?.logo_storage_path ?? null,
        counterpart_account_deleted: clinicDeleted,
        unread: isUnreadForRole(row, 'worker', workerId),
        can_send: canSendGeneralMessages(
          row.messaging_closed_at,
          clinic?.accepts_general_candidate_messages ?? false,
          row,
        ),
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
  const applicationRows = rows.filter((row) => row.conversation_type === 'application');
  const generalRows = rows.filter((row) => row.conversation_type === 'general');
  const conversations: Conversation[] = [];

  const { data: clinicProfile, error: clinicError } = await supabase
    .from('clinic_profiles')
    .select('accepts_general_candidate_messages')
    .eq('id', clinicId)
    .maybeSingle();

  if (clinicError) throw clinicError;
  const clinicAcceptsGeneral = clinicProfile?.accepts_general_candidate_messages ?? false;

  if (applicationRows.length > 0) {
    const applicationIds = applicationRows.map((row) => row.application_id!);
    const workerIds = [...new Set(applicationRows.map((row) => row.worker_id))];

    const [applicationsResult, workersResult] = await Promise.all([
      supabase
        .from('applications')
        .select('id, status, job_post_id, shift_post_id, worker_display_name, worker_account_deleted_at')
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
        ? supabase.from('job_posts').select('id, title, role_type').in('id', jobIds)
        : Promise.resolve({ data: [], error: null }),
      shiftIds.length > 0
        ? supabase
            .from('shift_posts')
            .select('id, shift_date, start_time, end_time, role_type')
            .in('id', shiftIds)
        : Promise.resolve({ data: [], error: null }),
    ]);

    if (jobsResult.error) throw jobsResult.error;
    if (shiftsResult.error) throw shiftsResult.error;

    const jobMap = new Map((jobsResult.data ?? []).map((job) => [job.id, job]));
    const shiftMap = new Map((shiftsResult.data ?? []).map((shift) => [shift.id, shift]));

    for (const row of applicationRows) {
      const application = applicationMap.get(row.application_id!);
      if (!application) continue;

      const status = application.status as ApplicationStatus;
      const worker = workerMap.get(row.worker_id);
      const workerDeleted =
        isConversationCounterpartDeleted(row, 'clinic') ||
        Boolean(application.worker_account_deleted_at);
      const counterpartName = workerDeleted
        ? DELETED_CANDIDATE_LABEL
        : application.worker_display_name?.trim() || 'Applicant';

      if (application.job_post_id && jobMap.has(application.job_post_id)) {
        const job = jobMap.get(application.job_post_id)!;
        conversations.push({
          ...row,
          application_status: status,
          post_title: job.title,
          post_type: 'job',
          post_role_type: job.role_type ?? null,
          shift_date: null,
          shift_start_time: null,
          shift_end_time: null,
          counterpart_name: counterpartName,
          counterpart_logo_storage_path: workerDeleted
            ? null
            : worker?.photo_storage_path ?? null,
          counterpart_account_deleted: workerDeleted,
          unread: isUnreadForRole(row, 'clinic', clinicId),
          can_send: canSendApplicationMessages(status, row.messaging_closed_at, row),
        });
      } else if (application.shift_post_id && shiftMap.has(application.shift_post_id)) {
        const shift = shiftMap.get(application.shift_post_id)!;
        conversations.push({
          ...row,
          application_status: status,
          post_title: `Fill-in · ${shift.shift_date}`,
          post_type: 'shift',
          post_role_type: shift.role_type ?? null,
          shift_date: shift.shift_date,
          shift_start_time: shift.start_time,
          shift_end_time: shift.end_time,
          counterpart_name: counterpartName,
          counterpart_logo_storage_path: workerDeleted
            ? null
            : worker?.photo_storage_path ?? null,
          counterpart_account_deleted: workerDeleted,
          unread: isUnreadForRole(row, 'clinic', clinicId),
          can_send: canSendApplicationMessages(status, row.messaging_closed_at, row),
        });
      }
    }
  }

  if (generalRows.length > 0) {
    const workerIds = [...new Set(generalRows.map((row) => row.worker_id))];
    const { data: workers, error: workersError } = await supabase
      .from('worker_profiles')
      .select('id, photo_storage_path')
      .in('id', workerIds);

    if (workersError) throw workersError;

    const workerMap = new Map((workers ?? []).map((worker) => [worker.id, worker]));

    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, display_name')
      .in('id', workerIds);

    if (profilesError) throw profilesError;
    const profileMap = new Map((profiles ?? []).map((profile) => [profile.id, profile]));

    for (const row of generalRows) {
      const worker = workerMap.get(row.worker_id);
      const profile = profileMap.get(row.worker_id);
      const workerDeleted = isConversationCounterpartDeleted(row, 'clinic');
      conversations.push({
        ...row,
        application_status: null,
        post_title: null,
        post_type: null,
        post_role_type: null,
        shift_date: null,
        shift_start_time: null,
        shift_end_time: null,
        counterpart_name: workerDeleted
          ? DELETED_CANDIDATE_LABEL
          : profile?.display_name?.trim() || 'Applicant',
        counterpart_logo_storage_path: workerDeleted
          ? null
          : worker?.photo_storage_path ?? null,
        counterpart_account_deleted: workerDeleted,
        unread: isUnreadForRole(row, 'clinic', clinicId),
        can_send: canSendGeneralMessages(row.messaging_closed_at, clinicAcceptsGeneral, row),
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
    .is('worker_hidden_at', null)
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
    .is('clinic_hidden_at', null)
    .order('last_message_at', { ascending: false, nullsFirst: false });

  if (error) throw error;
  return enrichClinicConversations((data ?? []) as ConversationRow[], clinicId);
}

export async function hideWorkerConversation(
  workerId: string,
  conversationId: string,
): Promise<ConversationRow> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.rpc('hide_worker_conversation', {
    p_conversation_id: conversationId,
  });

  if (error) throw error;
  const row = data as ConversationRow | null;
  if (!row || row.worker_id !== workerId) {
    throw new Error('Conversation not found or cannot be deleted');
  }
  return row;
}

export async function hideClinicConversation(
  clinicId: string,
  conversationId: string,
): Promise<ConversationRow> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.rpc('hide_clinic_conversation', {
    p_conversation_id: conversationId,
  });

  if (error) throw error;
  const row = data as ConversationRow | null;
  if (!row || row.clinic_id !== clinicId) {
    throw new Error('Conversation not found or cannot be deleted');
  }
  return row;
}

export async function listMessageableClinicsForWorker(
  workerId: string,
): Promise<MessageableClinic[]> {
  const supabase = getSupabaseClient();
  const { data: worker, error: workerError } = await supabase
    .from('worker_profiles')
    .select('province, setup_completed_at')
    .eq('id', workerId)
    .maybeSingle();

  if (workerError) throw workerError;
  if (!worker?.setup_completed_at || !worker.province) return [];

  const { data: clinics, error: clinicsError } = await supabase
    .from('clinic_profiles')
    .select('id, clinic_name, city, province, specialty, description, logo_storage_path')
    .eq('accepts_general_candidate_messages', true)
    .eq('province', worker.province)
    .not('setup_completed_at', 'is', null)
    .order('clinic_name');

  if (clinicsError) throw clinicsError;

  const { data: conversations, error: conversationsError } = await supabase
    .from('conversations')
    .select('id, clinic_id')
    .eq('worker_id', workerId)
    .eq('conversation_type', 'general');

  if (conversationsError) throw conversationsError;

  const conversationMap = new Map(
    (conversations ?? []).map((conversation) => [conversation.clinic_id, conversation.id]),
  );

  return (clinics ?? []).map((clinic) => ({
    ...clinic,
    existing_conversation_id: conversationMap.get(clinic.id) ?? null,
  }));
}

export async function getOrCreateGeneralConversation(clinicId: string): Promise<string> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.rpc('get_or_create_general_conversation', {
    p_clinic_id: clinicId,
  });

  if (error) throw error;
  return data as string;
}

export async function getConversationByApplicationId(
  userId: string,
  role: 'worker' | 'clinic',
  applicationId: string,
): Promise<Conversation | null> {
  const supabase = getSupabaseClient();
  let query = supabase
    .from('conversations')
    .select('*')
    .eq('application_id', applicationId)
    .eq('conversation_type', 'application');

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

async function listConversationUnreadSnapshots(
  userId: string,
  role: 'worker' | 'clinic',
): Promise<ConversationUnreadSnapshot[]> {
  const supabase = getSupabaseClient();
  let query = supabase.from('conversations').select(CONVERSATION_UNREAD_SELECT);

  if (role === 'worker') {
    query = query.eq('worker_id', userId);
  } else {
    query = query.eq('clinic_id', userId);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as ConversationUnreadSnapshot[];
}

export async function getUnreadConversationCount(
  userId: string,
  role: 'worker' | 'clinic',
): Promise<number> {
  const conversations = await listConversationUnreadSnapshots(userId, role);
  return conversations.filter((conversation) => {
    if (role === 'worker' && conversation.worker_hidden_at) return false;
    if (role === 'clinic' && conversation.clinic_hidden_at) return false;
    return isUnreadForRole(conversation, role, userId);
  }).length;
}

export async function getUnreadConversationMap(
  userId: string,
  role: 'worker' | 'clinic',
): Promise<Record<string, boolean>> {
  const conversations = await listConversationUnreadSnapshots(userId, role);

  const map: Record<string, boolean> = {};
  for (const conversation of conversations) {
    if (role === 'worker' && conversation.worker_hidden_at) continue;
    if (role === 'clinic' && conversation.clinic_hidden_at) continue;
    if (conversation.application_id && isUnreadForRole(conversation, role, userId)) {
      map[conversation.application_id] = true;
    }
  }
  return map;
}
