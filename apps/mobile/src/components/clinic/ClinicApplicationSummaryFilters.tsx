import { useState } from 'react';

import { FilterSheet, FilterSheetSection } from '@/components/ui/FilterSheet';
import { FilterTriggerButton } from '@/components/ui/FilterTriggerButton';
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
  const [sheetOpen, setSheetOpen] = useState(false);
  const activeCount = selected === 'all' ? 0 : 1;

  return (
    <>
      <FilterTriggerButton
        activeCount={activeCount}
        onPress={() => setSheetOpen(true)}
        accessibilityLabel="Filter applications"
      />
      <FilterSheet
        visible={sheetOpen}
        title="Filter applications"
        onClose={() => setSheetOpen(false)}
        onReset={() => onChange('all')}
      >
        <FilterSheetSection
          label="Show"
          options={CLINIC_APPLICATION_SUMMARY_FILTER_OPTIONS}
          selected={selected}
          onChange={onChange}
        />
      </FilterSheet>
    </>
  );
}
