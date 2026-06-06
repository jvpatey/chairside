import { useState } from 'react';

import { FilterSheet, FilterSheetSection } from '@/components/ui/FilterSheet';
import { FilterTriggerButton } from '@/components/ui/FilterTriggerButton';
import {
  CONVERSATION_INBOX_FILTERS,
  type ConversationFilterCounts,
  type ConversationInboxFilter,
} from '@/lib/conversationInbox';

type ConversationInboxFiltersProps = {
  selected: ConversationInboxFilter;
  counts: ConversationFilterCounts;
  onChange: (filter: ConversationInboxFilter) => void;
};

export function ConversationInboxFilters({
  selected,
  counts,
  onChange,
}: ConversationInboxFiltersProps) {
  const [sheetOpen, setSheetOpen] = useState(false);
  const activeCount = selected === 'all' ? 0 : 1;
  const options = CONVERSATION_INBOX_FILTERS.map((option) => ({
    value: option.value,
    label: `${option.label} (${counts[option.value]})`,
  }));

  return (
    <>
      <FilterTriggerButton
        activeCount={activeCount}
        onPress={() => setSheetOpen(true)}
        accessibilityLabel="Filter conversations"
      />
      <FilterSheet
        visible={sheetOpen}
        title="Filter conversations"
        onClose={() => setSheetOpen(false)}
        onReset={() => onChange('all')}
      >
        <FilterSheetSection
          label="Show"
          options={options}
          selected={selected}
          onChange={onChange}
        />
      </FilterSheet>
    </>
  );
}
