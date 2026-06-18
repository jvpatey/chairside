import { DashboardStatGrid } from '@/components/dashboard/DashboardStatGrid';
import { useTabAtmosphereAccent } from '@/contexts/TabAtmosphereContext';
import type { GradientAccent } from '@/theme';

type SegmentedControlProps<T extends string> = {
  options: { value: T; label: string }[];
  selected: T;
  onChange: (value: T) => void;
  density?: 'default' | 'compact';
  accent?: GradientAccent;
};

export function SegmentedControl<T extends string>({
  options,
  selected,
  onChange,
  density = 'default',
  accent,
}: SegmentedControlProps<T>) {
  const tabAccent = useTabAtmosphereAccent();

  return (
    <DashboardStatGrid
      variant="label"
      density={density}
      accent={accent ?? tabAccent}
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
