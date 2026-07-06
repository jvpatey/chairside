import { PillBadge } from '@/components/ui/PillBadge';
import { useTheme } from '@/theme';

/** Worker-facing badge for Pro clinic priority placement in browse lists. */
export function FeaturedListingBadge() {
  const { colors } = useTheme();
  return (
    <PillBadge
      label="Featured"
      color={colors.primary}
      backgroundColor={colors.primarySubtle}
      size="sm"
      accessibilityLabel="Featured listing"
    />
  );
}
