/**
 * Screens prioritized for iPad master/detail (list + detail side-by-side) layouts.
 * Ordered by expected workflow value on tablet.
 */
export type ListDetailPriority = 'high' | 'medium';

export type ListDetailCandidate = {
  id: string;
  role: 'worker' | 'clinic';
  label: string;
  listRoute: string;
  detailRoute: string;
  priority: ListDetailPriority;
  rationale: string;
};

export const IPAD_LIST_DETAIL_CANDIDATES: readonly ListDetailCandidate[] = [
  {
    id: 'worker-messages',
    role: 'worker',
    label: 'Messages',
    listRoute: '/(tabs)/messages',
    detailRoute: '/(tabs)/conversation/[id]',
    priority: 'high',
    rationale: 'Conversation inbox benefits most from persistent thread context while browsing.',
  },
  {
    id: 'clinic-messages',
    role: 'clinic',
    label: 'Messages',
    listRoute: '/(clinic-tabs)/messages',
    detailRoute: '/(clinic-tabs)/conversation/[id]',
    priority: 'high',
    rationale: 'Clinic messaging is high-frequency and reads well in a split layout.',
  },
  {
    id: 'worker-applications',
    role: 'worker',
    label: 'Applications',
    listRoute: '/(tabs)/applications',
    detailRoute: '/(tabs)/application/[id]',
    priority: 'high',
    rationale: 'Application status review pairs naturally with detail and message threads.',
  },
  {
    id: 'clinic-applications',
    role: 'clinic',
    label: 'Applications',
    listRoute: '/(clinic-tabs)/applications',
    detailRoute: '/(clinic-tabs)/application/[id]',
    priority: 'high',
    rationale: 'Reviewing applicants alongside profile and screening answers saves navigation.',
  },
  {
    id: 'worker-browse',
    role: 'worker',
    label: 'Role browse',
    listRoute: '/(tabs)/browse',
    detailRoute: '/(tabs)/job/[id]',
    priority: 'medium',
    rationale: 'Job browsing can show listing cards beside role detail on wide screens.',
  },
  {
    id: 'worker-fillins',
    role: 'worker',
    label: 'Fill-ins',
    listRoute: '/(tabs)/fillins',
    detailRoute: '/(tabs)/shift/[id]',
    priority: 'medium',
    rationale: 'Shift comparison is easier when detail stays visible beside the list.',
  },
  {
    id: 'clinic-postings',
    role: 'clinic',
    label: 'Postings',
    listRoute: '/(clinic-tabs)/postings',
    detailRoute: '/(clinic-tabs)/job/[id]',
    priority: 'medium',
    rationale: 'Managing active roles alongside posting detail reduces back-and-forth.',
  },
  {
    id: 'clinic-fillins',
    role: 'clinic',
    label: 'Fill-ins',
    listRoute: '/(clinic-tabs)/fill-ins',
    detailRoute: '/(clinic-tabs)/shift/[id]',
    priority: 'medium',
    rationale: 'Fill-in management involves reviewing applicants and shift details together.',
  },
  {
    id: 'clinic-role-applicants',
    role: 'clinic',
    label: 'Role applicants',
    listRoute: '/(clinic-tabs)/role-applicants/[jobId]',
    detailRoute: '/(clinic-tabs)/application/[id]',
    priority: 'medium',
    rationale: 'Applicant triage for a single role is a classic master/detail workflow.',
  },
  {
    id: 'clinic-shift-applicants',
    role: 'clinic',
    label: 'Shift applicants',
    listRoute: '/(clinic-tabs)/shift-applicants/[shiftId]',
    detailRoute: '/(clinic-tabs)/application/[id]',
    priority: 'medium',
    rationale: 'Urgent fill-in review benefits from persistent applicant detail.',
  },
] as const;

export function getListDetailCandidates(role: 'worker' | 'clinic'): ListDetailCandidate[] {
  return IPAD_LIST_DETAIL_CANDIDATES.filter((candidate) => candidate.role === role);
}

export function getHighPriorityListDetailCandidates(
  role: 'worker' | 'clinic',
): ListDetailCandidate[] {
  return getListDetailCandidates(role).filter((candidate) => candidate.priority === 'high');
}
