import { PillBadge } from '@/components/ui/PillBadge';
import { useTheme, type GradientAccent } from '@/theme';

type ApplicationCardBadgeProps = {
  label?: string;
  accent?: GradientAccent;
};

export function ApplicationCardBadge({ label, accent = 'primary' }: ApplicationCardBadgeProps) {
  const { colors } = useTheme();
  const backgroundColor = accent === 'secondary' ? colors.secondary : colors.primary;
  const color = accent === 'secondary' ? colors.secondaryOnSecondary : colors.primaryOnPrimary;

  return (
    <PillBadge
      label={label ?? 'New'}
      color={color}
      backgroundColor={backgroundColor}
      size="sm"
      accessibilityLabel={label ?? 'Unread application update'}
    />
  );
}
