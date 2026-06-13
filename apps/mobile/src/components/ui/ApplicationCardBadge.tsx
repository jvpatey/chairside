import { PillBadge } from '@/components/ui/PillBadge';
import { useTheme } from '@/theme';

type ApplicationCardBadgeProps = {
  label?: string;
};

export function ApplicationCardBadge({ label }: ApplicationCardBadgeProps) {
  const { colors } = useTheme();

  return (
    <PillBadge
      label={label ?? 'New'}
      color={colors.primaryOnPrimary}
      backgroundColor={colors.primary}
      size="sm"
      accessibilityLabel={label ?? 'Unread application update'}
    />
  );
}
