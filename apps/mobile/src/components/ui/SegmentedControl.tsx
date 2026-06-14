import { DashboardStatGrid } from '@/components/dashboard/DashboardStatGrid';

type SegmentedControlProps<T extends string> = {
  options: { value: T; label: string }[];
  selected: T;
  onChange: (value: T) => void;
  density?: 'default' | 'compact';
};

export function SegmentedControl<T extends string>({
  options,
  selected,
  onChange,
  density = 'default',
}: SegmentedControlProps<T>) {
  return (
    <DashboardStatGrid
      variant="label"
      density={density}
      stats={options.map((option) => ({
        key: option.value,
        label: option.label,
        value: 0,
      }))}
      selected={selected}
      onSelect={onChange}
      accessibilityRole="tab"
    />
  );
}
