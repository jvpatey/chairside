import { SegmentedControl } from '@/components/ui/SegmentedControl';
import {
  WORKER_BROWSE_VIEW_MODE_OPTIONS,
  type WorkerBrowseViewMode,
} from '@/lib/postingFilters';

type WorkerBrowseViewToggleProps = {
  selected: WorkerBrowseViewMode;
  onChange: (value: WorkerBrowseViewMode) => void;
};

export function WorkerBrowseViewToggle({ selected, onChange }: WorkerBrowseViewToggleProps) {
  return (
    <SegmentedControl
      options={WORKER_BROWSE_VIEW_MODE_OPTIONS}
      selected={selected}
      onChange={onChange}
      density="compact"
    />
  );
}
