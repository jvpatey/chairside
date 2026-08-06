import type { Conversation, JobApplicationSummary } from '@chairside/api';

import type { DashboardAttentionItem } from '@/components/dashboard/DashboardNeedsAttention';

type BuildClinicAttentionInput = {
  newApplications: number;
  applicationUpdateCount: number;
  fillInUpdateCount: number;
  unreadConversations: Conversation[];
  onOpenApplications: () => void;
  onOpenFillIns: () => void;
  onOpenMessages: () => void;
  onOpenConversation: (conversation: Conversation) => void;
};

export function buildClinicAttentionItems({
  newApplications,
  applicationUpdateCount,
  fillInUpdateCount,
  unreadConversations,
  onOpenApplications,
  onOpenFillIns,
  onOpenMessages,
  onOpenConversation,
}: BuildClinicAttentionInput): DashboardAttentionItem[] {
  const items: DashboardAttentionItem[] = [];

  if (newApplications > 0) {
    items.push({
      id: 'new-applications',
      label: `${newApplications} new application${newApplications === 1 ? '' : 's'}`,
      icon: 'document-text-outline',
      accent: 'primary',
      onPress: onOpenApplications,
    });
  } else if (applicationUpdateCount > 0) {
    items.push({
      id: 'application-updates',
      label: `${applicationUpdateCount} application update${applicationUpdateCount === 1 ? '' : 's'}`,
      icon: 'document-text-outline',
      accent: 'primary',
      onPress: onOpenApplications,
    });
  }

  if (fillInUpdateCount > 0) {
    items.push({
      id: 'cover-requests',
      label: `${fillInUpdateCount} cover request${fillInUpdateCount === 1 ? '' : 's'}`,
      icon: 'calendar-outline',
      accent: 'secondary',
      urgent: true,
      onPress: onOpenFillIns,
    });
  }

  const unread = unreadConversations.filter((c) => c.unread);
  if (unread.length === 1) {
    items.push({
      id: `message-${unread[0].id}`,
      label: 'Unread message',
      icon: 'chatbubble-outline',
      accent: 'primary',
      onPress: () => onOpenConversation(unread[0]),
    });
  } else if (unread.length > 1) {
    items.push({
      id: 'unread-messages',
      label: `${unread.length} unread messages`,
      icon: 'chatbubble-outline',
      accent: 'primary',
      onPress: onOpenMessages,
    });
  }

  return items;
}

type BuildWorkerAttentionInput = {
  applicationUpdateCount: number;
  fillInPendingCount: number;
  unreadConversations: Conversation[];
  onOpenApplications: () => void;
  onOpenFillIns: () => void;
  onOpenMessages: () => void;
  onOpenConversation: (conversation: Conversation) => void;
};

export function buildWorkerAttentionItems({
  applicationUpdateCount,
  fillInPendingCount,
  unreadConversations,
  onOpenApplications,
  onOpenFillIns,
  onOpenMessages,
  onOpenConversation,
}: BuildWorkerAttentionInput): DashboardAttentionItem[] {
  const items: DashboardAttentionItem[] = [];

  if (applicationUpdateCount > 0) {
    items.push({
      id: 'application-updates',
      label: `${applicationUpdateCount} application update${applicationUpdateCount === 1 ? '' : 's'}`,
      icon: 'document-text-outline',
      accent: 'primary',
      onPress: onOpenApplications,
    });
  }

  if (fillInPendingCount > 0) {
    items.push({
      id: 'fill-in-updates',
      label: `${fillInPendingCount} fill-in update${fillInPendingCount === 1 ? '' : 's'}`,
      icon: 'calendar-outline',
      accent: 'secondary',
      onPress: onOpenFillIns,
    });
  }

  const unread = unreadConversations.filter((c) => c.unread);
  if (unread.length === 1) {
    items.push({
      id: `message-${unread[0].id}`,
      label: 'Unread message',
      icon: 'chatbubble-outline',
      accent: 'primary',
      onPress: () => onOpenConversation(unread[0]),
    });
  } else if (unread.length > 1) {
    items.push({
      id: 'unread-messages',
      label: `${unread.length} unread messages`,
      icon: 'chatbubble-outline',
      accent: 'primary',
      onPress: onOpenMessages,
    });
  }

  return items;
}

export function summarizeJobApplicantPreviews(
  applications: Array<{
    job_post_id: string | null;
    worker_display_name: string | null;
    worker_photo_storage_path: string | null;
  }>,
): Record<string, { names: string[]; photoPaths: (string | null)[] }> {
  const map: Record<string, { names: string[]; photoPaths: (string | null)[] }> = {};

  for (const application of applications) {
    if (!application.job_post_id) continue;
    const jobId = application.job_post_id;
    const existing = map[jobId] ?? { names: [], photoPaths: [] };
    if (existing.names.length >= 4) continue;
    const name = application.worker_display_name?.trim() || 'Applicant';
    existing.names.push(name);
    existing.photoPaths.push(application.worker_photo_storage_path);
    map[jobId] = existing;
  }

  return map;
}

export function countSavedPosts(savedJobIds: Set<string>, savedShiftIds: Set<string>): number {
  return savedJobIds.size + savedShiftIds.size;
}

export type { JobApplicationSummary };
