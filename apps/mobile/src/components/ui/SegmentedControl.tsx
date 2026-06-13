import { DashboardStatGrid } from '@/components/dashboard/DashboardStatGrid';

type SegmentedControlProps<T extends string> = {
  options: { value: T; label: string }[];
  selected: T;
  onChange: (value: T) => void;
};

export function SegmentedControl<T extends string>({
  options,
  selected,
  onChange,
}: SegmentedControlProps<T>) {
  return (
    <DashboardStatGrid
      variant="label"
      stats={options.map((option) => ({
        key: option.value,
        label: option.label,
        value: 0,
      }))}
      selected={selected}
      onSelect={onChange}
    />
  );
}
