import type {
  ConfirmedFillInSummary,
  Conversation,
  JobApplicationSummary,
  JobPost,
  LiveJobPost,
  WorkerApplication,
} from '@chairside/api';
import type { Ionicons } from '@expo/vector-icons';

import { isTodayOrUpcomingShiftDate } from '@/lib/fillInFilters';
import type { GradientAccent } from '@/theme';

export type DashboardSpotlightItem = {
  id: string;
  eyebrow: string;
  headline: string;
  body: string;
  ctaLabel: string;
  accent: GradientAccent;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
};

type WorkerSpotlightInput = {
  conversations: Conversation[];
  jobApplications: WorkerApplication[];
  shiftApplications: WorkerApplication[];
  openJobs: LiveJobPost[];
  unreadMap: Record<string, boolean>;
  dismissedIds?: ReadonlySet<string>;
  onOpenConversation: (conversation: Conversation) => void;
  onOpenApplication: (application: WorkerApplication) => void;
  onOpenJob: (jobId: string) => void;
  onOpenApplicationsTab: () => void;
  onOpenMessages: () => void;
};

type ClinicSpotlightInput = {
  fillInUpdateCount: number;
  applicationUpdateCount: number;
  confirmedFillIns: ConfirmedFillInSummary[];
  jobs: JobPost[];
  jobApplicationSummaries: JobApplicationSummary[];
  dismissedIds?: ReadonlySet<string>;
  onOpenFillIns: () => void;
  onOpenApplications: () => void;
  onOpenConfirmedFillIn: (summary: ConfirmedFillInSummary) => void;
  onOpenJobApplicants: (jobId: string) => void;
};

function pickFirstVisible(
  candidates: DashboardSpotlightItem[],
  dismissedIds?: ReadonlySet<string>,
): DashboardSpotlightItem | null {
  if (candidates.length === 0) return null;
  if (!dismissedIds?.size) return candidates[0];
  return candidates.find((item) => !dismissedIds.has(item.id)) ?? null;
}

export function pickWorkerSpotlight(input: WorkerSpotlightInput): DashboardSpotlightItem | null {
  const candidates: DashboardSpotlightItem[] = [];

  const unreadConversation = input.conversations.find((conversation) => conversation.unread);
  if (unreadConversation) {
    candidates.push({
      id: `message-${unreadConversation.id}`,
      eyebrow: 'New message',
      headline: `Message from ${unreadConversation.counterpart_name}`,
      body:
        unreadConversation.last_message_preview?.trim() ||
        'You have an unread message waiting for a reply.',
      ctaLabel: 'Open conversation',
      accent: 'primary',
      icon: 'chatbubble-ellipses-outline',
      onPress: () => input.onOpenConversation(unreadConversation),
    });
  }

  const applicationsWithUnread = [...input.jobApplications, ...input.shiftApplications]
    .filter((application) => input.unreadMap[application.id])
    .sort(
      (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime(),
    );

  const applicationUpdate = applicationsWithUnread[0];
  if (applicationUpdate) {
    candidates.push({
      id: `application-${applicationUpdate.id}`,
      eyebrow: 'Application update',
      headline: `Update on ${applicationUpdate.post_title}`,
      body: `Status: ${formatApplicationStatus(applicationUpdate.status)} at ${applicationUpdate.clinic_name}.`,
      ctaLabel: 'View application',
      accent: applicationUpdate.post_type === 'shift' ? 'secondary' : 'primary',
      icon: 'document-text-outline',
      onPress: () => input.onOpenApplication(applicationUpdate),
    });
  }

  const confirmedFillIn = [...input.shiftApplications]
    .filter(
      (application) =>
        application.status === 'hired' && isTodayOrUpcomingShiftDate(application.shift_date),
    )
    .sort((a, b) => {
      const aDate = a.shift_date ?? '';
      const bDate = b.shift_date ?? '';
      return aDate.localeCompare(bDate);
    })[0];

  if (confirmedFillIn) {
    candidates.push({
      id: `confirmed-${confirmedFillIn.id}`,
      eyebrow: 'Confirmed shift',
      headline: `Confirmed fill-in at ${confirmedFillIn.clinic_name}`,
      body: confirmedFillIn.shift_date
        ? `Your shift on ${formatShortDate(confirmedFillIn.shift_date)} is confirmed.`
        : 'Your upcoming fill-in shift is confirmed.',
      ctaLabel: 'View shift',
      accent: 'secondary',
      icon: 'calendar-outline',
      onPress: () => input.onOpenApplication(confirmedFillIn),
    });
  }

  const newestJob = input.openJobs[0];
  if (newestJob) {
    candidates.push({
      id: `role-${newestJob.id}`,
      eyebrow: 'New role',
      headline: newestJob.title,
      body: `${newestJob.clinic.clinic_name}${newestJob.clinic.city ? ` · ${newestJob.clinic.city}` : ''} — a new role matches your search area.`,
      ctaLabel: 'View role',
      accent: 'primary',
      icon: 'briefcase-outline',
      onPress: () => input.onOpenJob(newestJob.id),
    });
  }

  return pickFirstVisible(candidates, input.dismissedIds);
}

export function pickClinicSpotlight(input: ClinicSpotlightInput): DashboardSpotlightItem | null {
  const candidates: DashboardSpotlightItem[] = [];

  if (input.fillInUpdateCount > 0) {
    const label =
      input.fillInUpdateCount === 1
        ? '1 fill-in needs your review'
        : `${input.fillInUpdateCount} fill-ins need your review`;
    candidates.push({
      id: 'cover-requests',
      eyebrow: 'Needs review',
      headline: 'Cover requests waiting',
      body: `${label}. Review applicants to keep shifts covered.`,
      ctaLabel: 'Review fill-ins',
      accent: 'secondary',
      icon: 'people-outline',
      onPress: input.onOpenFillIns,
    });
  }

  if (input.applicationUpdateCount > 0) {
    const newestSummary = [...input.jobApplicationSummaries].sort(
      (a, b) => b.unseen_count - a.unseen_count,
    )[0];

    candidates.push({
      id: newestSummary ? `applications-${newestSummary.job_post_id}` : 'applications',
      eyebrow: input.applicationUpdateCount === 1 ? 'New applicant' : 'New applicants',
      headline:
        input.applicationUpdateCount === 1
          ? 'New application to review'
          : `${input.applicationUpdateCount} application updates`,
      body: newestSummary
        ? `${newestSummary.post_title} has ${newestSummary.applicant_count} applicant${newestSummary.applicant_count === 1 ? '' : 's'}.`
        : 'Review applicants and respond while interest is high.',
      ctaLabel: 'Review applications',
      accent: 'primary',
      icon: 'document-text-outline',
      onPress: () => {
        if (newestSummary && newestSummary.applicant_count > 0) {
          input.onOpenJobApplicants(newestSummary.job_post_id);
          return;
        }
        input.onOpenApplications();
      },
    });
  }

  const nextConfirmed = input.confirmedFillIns[0];
  if (nextConfirmed) {
    candidates.push({
      id: `confirmed-${nextConfirmed.applicationId}`,
      eyebrow: 'Confirmed shift',
      headline: `Confirmed fill-in with ${nextConfirmed.workerName}`,
      body: nextConfirmed.shiftDate
        ? `Shift on ${formatShortDate(nextConfirmed.shiftDate)} is locked in.`
        : 'An upcoming confirmed fill-in is on your schedule.',
      ctaLabel: 'View fill-in',
      accent: 'secondary',
      icon: 'calendar-outline',
      onPress: () => input.onOpenConfirmedFillIn(nextConfirmed),
    });
  }

  const openJob = input.jobs.find((job) => job.status === 'live');
  if (openJob) {
    candidates.push({
      id: `posting-${openJob.id}`,
      eyebrow: 'Live role',
      headline: openJob.title,
      body: 'Your open role is live — share it or review incoming interest.',
      ctaLabel: 'Manage role',
      accent: 'primary',
      icon: 'briefcase-outline',
      onPress: () => input.onOpenJobApplicants(openJob.id),
    });
  }

  return pickFirstVisible(candidates, input.dismissedIds);
}

function formatApplicationStatus(status: string) {
  return status.replace(/_/g, ' ');
}

function formatShortDate(isoDate: string) {
  const parsed = new Date(`${isoDate}T12:00:00`);
  if (Number.isNaN(parsed.getTime())) return isoDate;
  return parsed.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
}
