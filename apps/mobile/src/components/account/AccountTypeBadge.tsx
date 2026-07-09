import { PillBadge } from '@/components/ui/PillBadge';
import { useTheme, useThemedStyles } from '@/theme';

type AccountTypeBadgeProps = {
  label: string;
  inRow?: boolean;
};

export function AccountTypeBadge({ label, inRow = false }: AccountTypeBadgeProps) {
  const { colors } = useTheme();

  const styles = useThemedStyles(({ spacing }) => ({
    standalone: {
      marginTop: spacing.xs,
      alignSelf: 'center' as const,
    },
  }));

  return (
    <PillBadge
      label={`${label} account`}
      color={colors.labelSecondary}
      backgroundColor={colors.fillSubtle}
      size="sm"
      style={inRow ? undefined : styles.standalone}
    />
  );
}
