import { PillBadge } from '@/components/ui/PillBadge';
import { useTheme } from '@/theme';

type CountBadgeProps = {
  label: string;
  /** Solid primary fill for unread/new emphasis. */
  highlighted?: boolean;
  onPress?: () => void;
  accessibilityLabel?: string;
};

export function CountBadge({
  label,
  highlighted = false,
  onPress,
  accessibilityLabel,
}: CountBadgeProps) {
  const { colors } = useTheme();

  return (
    <PillBadge
      label={label}
      color={highlighted ? colors.primaryOnPrimary : colors.primary}
      backgroundColor={highlighted ? colors.primary : colors.primarySubtle}
      onPress={onPress}
      accessibilityLabel={accessibilityLabel}
    />
  );
}

export function formatApplicantCountLabel(count: number): string {
  return count === 1 ? '1 applicant' : `${count} applicants`;
}

export function formatApplicantCountLabelWithNew(count: number, unseenCount: number): string {
  if (unseenCount > 0) {
    return unseenCount === 1 ? '1 new applicant' : `${unseenCount} new applicants`;
  }
  return formatApplicantCountLabel(count);
}

export function formatRequestCountLabel(count: number): string {
  return count === 1 ? '1 request' : `${count} requests`;
}
