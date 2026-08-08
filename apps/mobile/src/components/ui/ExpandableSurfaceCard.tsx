import type { ReactNode } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';

import type { FeaturedListingGradient } from '@/theme';
import { spacing, useThemedStyles, type GradientAccent } from '@/theme';

import { CardExpandToggle } from './CardExpandToggle';
import { SurfaceCard, type SurfaceCardVariant } from './SurfaceCard';
import type { CardPaddingTier } from './cardLayout';

type ExpandableSurfaceCardProps = {
  header: ReactNode;
  expanded: boolean;
  onToggleExpand: () => void;
  children?: ReactNode;
  variant?: SurfaceCardVariant;
  padding?: CardPaddingTier;
  bleedPadding?: number;
  style?: StyleProp<ViewStyle>;
  accent?: GradientAccent;
  featuredGradient?: FeaturedListingGradient | null;
};

/**
 * Standard expandable card shell: surface + title band + expand toggle + body.
 */
export function ExpandableSurfaceCard({
  header,
  expanded,
  onToggleExpand,
  children,
  variant = 'default',
  padding = 'md',
  bleedPadding,
  style,
  accent,
  featuredGradient,
}: ExpandableSurfaceCardProps) {
  const contentPadding = bleedPadding ?? (padding === 'lg' ? spacing.lg : spacing.md);

  const styles = useThemedStyles(({ spacing }) => ({
    body: {
      paddingHorizontal: contentPadding,
      paddingTop: contentPadding,
      paddingBottom: spacing.sm,
    },
    expandedBody: {
      gap: spacing.md,
      paddingHorizontal: contentPadding,
      paddingBottom: contentPadding,
    },
  }));

  return (
    <SurfaceCard
      variant={variant}
      padding="none"
      style={style}
      featuredOverlay={featuredGradient}>
      <View style={styles.body}>{header}</View>

      <CardExpandToggle
        expanded={expanded}
        onPress={onToggleExpand}
        contentPadding={contentPadding}
        roundedBottom={!expanded || !children}
        accent={accent}
      />

      {expanded && children ? <View style={styles.expandedBody}>{children}</View> : null}
    </SurfaceCard>
  );
}
