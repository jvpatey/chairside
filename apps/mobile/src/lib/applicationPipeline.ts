import type { ClinicApplication } from '@chairside/api';
import {
  isClinicWorkerCrmFollowUpDue,
  isClinicWorkerCrmFollowUpScheduled,
} from '@chairside/config';

export type ApplicantPipelineSectionId =
  | 'screening'
  | 'needs_review'
  | 'shortlisted'
  | 'interview_set'
  | 'decided';

export type ApplicantPipelineSection = {
  id: ApplicantPipelineSectionId;
  title: string;
  applications: ClinicApplication[];
  defaultExpanded: boolean;
};

const MATCH_TIER_ORDER: Record<string, number> = {
  strong: 0,
  good: 1,
  partial: 2,
  none: 3,
};

function getFollowUpTime(followUpAt: string | null | undefined): number {
  const trimmed = followUpAt?.trim();
  if (!trimmed) return Number.POSITIVE_INFINITY;
  const time = new Date(trimmed).getTime();
  return Number.isFinite(time) ? time : Number.POSITIVE_INFINITY;
}

export type ApplicantListFilter =
  | 'all'
  | 'screening'
  | 'shortlisted'
  | 'interview'
  | 'decided'
  | 'follow_up';

export type ApplicantFilterCounts = Record<ApplicantListFilter, number>;

export const APPLICANT_FILTER_SECTION_TITLES: Record<
  Exclude<ApplicantListFilter, 'all'>,
  string
> = {
  screening: 'Screening',
  shortlisted: 'Shortlisted',
  interview: 'Interview',
  decided: 'Decided',
  follow_up: 'Follow-up',
};

function compareApplications(a: ClinicApplication, b: ClinicApplication): number {
  const tierA = MATCH_TIER_ORDER[a.match_tier ?? 'none'] ?? 4;
  const tierB = MATCH_TIER_ORDER[b.match_tier ?? 'none'] ?? 4;
  if (tierA !== tierB) return tierA - tierB;

  return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
}

function compareFollowUpApplications(a: ClinicApplication, b: ClinicApplication): number {
  const aFollowUp = a.clinic_crm?.follow_up_at;
  const bFollowUp = b.clinic_crm?.follow_up_at;
  const aDue = isClinicWorkerCrmFollowUpDue(aFollowUp);
  const bDue = isClinicWorkerCrmFollowUpDue(bFollowUp);
  if (aDue !== bDue) return aDue ? -1 : 1;

  const aTime = getFollowUpTime(aFollowUp);
  const bTime = getFollowUpTime(bFollowUp);
  if (aTime !== bTime) return aTime - bTime;

  return compareApplications(a, b);
}

const SECTION_CONFIG: {
  id: ApplicantPipelineSectionId;
  title: string;
  defaultExpanded: boolean;
  statuses: string[];
}[] = [
  {
    id: 'screening',
    title: 'Screening',
    defaultExpanded: true,
    statuses: ['screening_submitted'],
  },
  {
    id: 'needs_review',
    title: 'Needs review',
    defaultExpanded: true,
    statuses: ['applied', 'reviewed'],
  },
  {
    id: 'shortlisted',
    title: 'Shortlisted',
    defaultExpanded: true,
    statuses: ['in_progress'],
  },
  {
    id: 'interview_set',
    title: 'Interview',
    defaultExpanded: true,
    statuses: ['interview_offered', 'interview_scheduled'],
  },
  {
    id: 'decided',
    title: 'Decided',
    defaultExpanded: false,
    statuses: ['selected', 'rejected', 'hired'],
  },
];

export function groupApplicationsByPipeline(
  applications: ClinicApplication[],
): ApplicantPipelineSection[] {
  return SECTION_CONFIG.map((section) => ({
    id: section.id,
    title: section.title,
    defaultExpanded: section.defaultExpanded,
    applications: applications
      .filter((application) => section.statuses.includes(application.status))
      .sort(compareApplications),
  })).filter((section) => section.applications.length > 0);
}

const FILTER_STATUS_MAP: Record<Exclude<ApplicantListFilter, 'all' | 'follow_up'>, string[]> = {
  screening: ['screening_submitted'],
  shortlisted: ['in_progress'],
  interview: ['interview_offered', 'interview_scheduled'],
  decided: ['selected', 'rejected', 'hired'],
};

export function hasApplicantFollowUpScheduled(application: ClinicApplication): boolean {
  return isClinicWorkerCrmFollowUpScheduled(application.clinic_crm?.follow_up_at);
}

export function getApplicantFilterCounts(applications: ClinicApplication[]): ApplicantFilterCounts {
  return {
    all: applications.length,
    screening: applications.filter((application) =>
      FILTER_STATUS_MAP.screening.includes(application.status),
    ).length,
    shortlisted: applications.filter((application) =>
      FILTER_STATUS_MAP.shortlisted.includes(application.status),
    ).length,
    interview: applications.filter((application) =>
      FILTER_STATUS_MAP.interview.includes(application.status),
    ).length,
    decided: applications.filter((application) =>
      FILTER_STATUS_MAP.decided.includes(application.status),
    ).length,
    follow_up: applications.filter(hasApplicantFollowUpScheduled).length,
  };
}

export function filterApplicationsByView(
  applications: ClinicApplication[],
  filter: ApplicantListFilter,
): ClinicApplication[] {
  if (filter === 'all') {
    return [...applications].sort(compareApplications);
  }

  if (filter === 'follow_up') {
    return applications.filter(hasApplicantFollowUpScheduled).sort(compareFollowUpApplications);
  }

  const statuses = FILTER_STATUS_MAP[filter];
  return applications
    .filter((application) => statuses.includes(application.status))
    .sort(compareApplications);
}

/** Controls New highlight vs pipeline status badge on clinic applicant surfaces. */
export function getClinicApplicantBadgeVisibility(
  application: Pick<ClinicApplication, 'status'>,
  isHighlighted: boolean,
): { showNewBadge: boolean; showStatusBadge: boolean } {
  const isFreshApplicant =
    application.status === 'applied' || application.status === 'screening_submitted';

  return {
    showNewBadge: isHighlighted,
    showStatusBadge: isFreshApplicant ? !isHighlighted : true,
  };
}
