import { DashboardStatGrid } from '@/components/dashboard/DashboardStatGrid';
import type { ApplicantFilterCounts, ApplicantListFilter } from '@/lib/applicationPipeline';

type ApplicantFilterBarProps = {
  selected: ApplicantListFilter;
  counts: ApplicantFilterCounts;
  onChange: (filter: ApplicantListFilter) => void;
};

const FILTER_TABS: { value: ApplicantListFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'screening', label: 'Screening' },
  { value: 'shortlisted', label: 'Shortlisted' },
  { value: 'interview', label: 'Interview' },
  { value: 'decided', label: 'Decided' },
  { value: 'follow_up', label: 'Follow-up' },
];

export function ApplicantFilterBar({ selected, counts, onChange }: ApplicantFilterBarProps) {
  return (
    <DashboardStatGrid
      stats={FILTER_TABS.map((tab) => ({
        key: tab.value,
        label: tab.label,
        value: counts[tab.value],
      }))}
      selected={selected}
      onSelect={onChange}
      accessibilityRole="tab"
    />
  );
}
