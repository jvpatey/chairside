import { FilterSheetSection } from '@/components/ui/FilterSheet';
import { AdaptiveFilterShell } from '@/components/ui/AdaptiveFilterShell';
import {
  CLINIC_APPLICATION_SUMMARY_FILTER_OPTIONS,
  type ClinicApplicationSummaryFilter,
} from '@/lib/clinicListSearch';

type ClinicApplicationSummaryFiltersProps = {
  selected: ClinicApplicationSummaryFilter;
  onChange: (filter: ClinicApplicationSummaryFilter) => void;
};

export function ClinicApplicationSummaryFilters({
  selected,
  onChange,
}: ClinicApplicationSummaryFiltersProps) {
  const activeCount = selected === 'all' ? 0 : 1;

  return (
    <AdaptiveFilterShell
      activeCount={activeCount}
      onReset={() => onChange('all')}
      title="Filter applications"
      accessibilityLabel="Filter applications"
    >
      <FilterSheetSection
        label="Show"
        options={CLINIC_APPLICATION_SUMMARY_FILTER_OPTIONS}
        selected={selected}
        onChange={onChange}
      />
    </AdaptiveFilterShell>
  );
}
