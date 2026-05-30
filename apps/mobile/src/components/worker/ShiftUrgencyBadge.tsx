import { getUrgencyLabel } from '@chairside/config';
import { PillBadge } from '@/components/ui/PillBadge';
import { useTheme } from '@/theme';

type ShiftUrgencyBadgeProps = {
  urgency: string;
};

export function ShiftUrgencyBadge({ urgency }: ShiftUrgencyBadgeProps) {
  const { colors } = useTheme();

  if (urgency === 'normal') return null;

  return (
    <PillBadge
      label={getUrgencyLabel(urgency)}
      color={colors.warning}
      backgroundColor={`${colors.warning}18`}
    />
  );
}
