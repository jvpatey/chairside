import type { ClinicApplication, JobApplicationSummary } from '@chairside/api';

import type { DashboardAttentionItem } from '@/components/dashboard/DashboardNeedsAttention';
import { getDueFollowUpApplications } from '@/lib/applicationPipeline';

type BuildClinicAttentionInput = {
  newApplications: number;
  applicationUpdateCount: number;
  fillInUpdateCount: number;
  applications?: ClinicApplication[];
  canUseCrmFollowups?: boolean;
  onOpenApplications: () => void;
  onOpenFillIns: () => void;
  onOpenFollowUp?: (application: ClinicApplication) => void;
};

export function buildClinicAttentionItems({
  newApplications,
  applicationUpdateCount,
  fillInUpdateCount,
  applications = [],
  canUseCrmFollowups = false,
  onOpenApplications,
  onOpenFillIns,
  onOpenFollowUp,
}: BuildClinicAttentionInput): DashboardAttentionItem[] {
  const items: DashboardAttentionItem[] = [];

  if (newApplications > 0) {
    items.push({
      id: 'new-applications',
      label: 'New applications',
      description:
        newApplications === 1
          ? '1 applicant waiting for review'
          : `${newApplications} applicants waiting for review`,
      icon: 'document-text-outline',
      accent: 'primary',
      onPress: onOpenApplications,
    });
  } else if (applicationUpdateCount > 0) {
    items.push({
      id: 'application-updates',
      label: 'Application updates',
      description:
        applicationUpdateCount === 1
          ? '1 update to review'
          : `${applicationUpdateCount} updates to review`,
      icon: 'document-text-outline',
      accent: 'primary',
      onPress: onOpenApplications,
    });
  }

  if (fillInUpdateCount > 0) {
    items.push({
      id: 'cover-requests',
      label: 'Cover requests',
      description:
        fillInUpdateCount === 1
          ? '1 pending fill-in request'
          : `${fillInUpdateCount} pending fill-in requests`,
      icon: 'calendar-outline',
      accent: 'secondary',
      urgent: true,
      onPress: onOpenFillIns,
    });
  }

  if (canUseCrmFollowups && onOpenFollowUp) {
    const dueFollowUps = getDueFollowUpApplications(applications);
    if (dueFollowUps.length > 0) {
      items.push({
        id: 'crm-follow-ups',
        label: 'Follow-ups due',
        description:
          dueFollowUps.length === 1
            ? '1 candidate needs a follow-up'
            : `${dueFollowUps.length} candidates need follow-up`,
        icon: 'alarm-outline',
        accent: 'tertiary',
        urgent: true,
        onPress: () => onOpenFollowUp(dueFollowUps[0]),
      });
    }
  }

  return items;
}

type BuildWorkerAttentionInput = {
  applicationUpdateCount: number;
  fillInPendingCount: number;
  onOpenApplications: () => void;
  onOpenFillIns: () => void;
};

export function buildWorkerAttentionItems({
  applicationUpdateCount,
  fillInPendingCount,
  onOpenApplications,
  onOpenFillIns,
}: BuildWorkerAttentionInput): DashboardAttentionItem[] {
  const items: DashboardAttentionItem[] = [];

  if (applicationUpdateCount > 0) {
    items.push({
      id: 'application-updates',
      label: 'Application updates',
      description:
        applicationUpdateCount === 1
          ? '1 update to check'
          : `${applicationUpdateCount} updates to check`,
      icon: 'document-text-outline',
      accent: 'tertiary',
      onPress: onOpenApplications,
    });
  }

  if (fillInPendingCount > 0) {
    items.push({
      id: 'fill-in-updates',
      label: 'Fill-in updates',
      description:
        fillInPendingCount === 1
          ? '1 update to check'
          : `${fillInPendingCount} updates to check`,
      icon: 'calendar-outline',
      accent: 'secondary',
      onPress: onOpenFillIns,
    });
  }

  return items;
}

export function summarizeApplicantPreviews(
  applications: Array<{
    worker_display_name?: string | null;
    worker_photo_storage_path?: string | null;
  }>,
  maxVisible = 3,
): { names: string[]; photoPaths: (string | null)[] } {
  const names: string[] = [];
  const photoPaths: (string | null)[] = [];
  for (const application of applications) {
    const name = application.worker_display_name?.trim();
    if (!name) continue;
    names.push(name);
    photoPaths.push(application.worker_photo_storage_path ?? null);
    if (names.length >= maxVisible) break;
  }
  return { names, photoPaths };
}

export function summarizeClinicLogoPreviews(
  posts: Array<{ logo_storage_path?: string | null; clinic?: { logo_storage_path?: string | null; clinic_name?: string | null } }>,
  maxVisible = 3,
): { names: string[]; photoPaths: (string | null)[] } {
  const names: string[] = [];
  const photoPaths: (string | null)[] = [];
  for (const post of posts) {
    const path = post.logo_storage_path?.trim() || post.clinic?.logo_storage_path?.trim() || null;
    if (!path || photoPaths.includes(path)) continue;
    names.push(post.clinic?.clinic_name?.trim() || 'Clinic');
    photoPaths.push(path);
    if (photoPaths.length >= maxVisible) break;
  }
  return { names, photoPaths };
}

export type JobApplicantPreview = {
  id: string;
  name: string;
  photoPath: string | null;
};

export type JobApplicantPreviewMap = Record<string, JobApplicantPreview[]>;

export function summarizeJobApplicantPreviews(
  applications: Array<{
    id: string;
    job_post_id: string | null;
    worker_display_name: string | null;
    worker_photo_storage_path: string | null;
  }>,
): JobApplicantPreviewMap {
  const map: JobApplicantPreviewMap = {};

  for (const application of applications) {
    if (!application.job_post_id) continue;
    const jobId = application.job_post_id;
    const existing = map[jobId] ?? [];
    const name = application.worker_display_name?.trim() || 'Applicant';
    existing.push({
      id: application.id,
      name,
      photoPath: application.worker_photo_storage_path,
    });
    map[jobId] = existing;
  }

  return map;
}

export function countSavedPosts(savedJobIds: Set<string>, savedShiftIds: Set<string>): number {
  return savedJobIds.size + savedShiftIds.size;
}

export type { JobApplicationSummary };
