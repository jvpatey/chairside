import type { ClinicApplication } from '@chairside/api';

export type ApplicantPipelineSectionId =
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

export type ApplicantListFilter = 'all' | 'shortlisted' | 'interview';

export type ApplicantFilterCounts = Record<ApplicantListFilter, number>;

function compareApplications(a: ClinicApplication, b: ClinicApplication): number {
  const tierA = MATCH_TIER_ORDER[a.match_tier ?? 'none'] ?? 4;
  const tierB = MATCH_TIER_ORDER[b.match_tier ?? 'none'] ?? 4;
  if (tierA !== tierB) return tierA - tierB;

  return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
}

const SECTION_CONFIG: {
  id: ApplicantPipelineSectionId;
  title: string;
  defaultExpanded: boolean;
  statuses: string[];
}[] = [
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

const FILTER_STATUS_MAP: Record<Exclude<ApplicantListFilter, 'all'>, string[]> = {
  shortlisted: ['in_progress'],
  interview: ['interview_offered', 'interview_scheduled'],
};

export function getApplicantFilterCounts(
  applications: ClinicApplication[],
): ApplicantFilterCounts {
  return {
    all: applications.length,
    shortlisted: applications.filter((application) =>
      FILTER_STATUS_MAP.shortlisted.includes(application.status),
    ).length,
    interview: applications.filter((application) =>
      FILTER_STATUS_MAP.interview.includes(application.status),
    ).length,
  };
}

export function filterApplicationsByView(
  applications: ClinicApplication[],
  filter: ApplicantListFilter,
): ClinicApplication[] {
  if (filter === 'all') {
    return [...applications].sort(compareApplications);
  }

  const statuses = FILTER_STATUS_MAP[filter];
  return applications
    .filter((application) => statuses.includes(application.status))
    .sort(compareApplications);
}
