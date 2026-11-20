import { Children, isValidElement, type ReactNode } from 'react';
import { View } from 'react-native';

import { FadeInSection } from '@/components/dashboard/FadeInSection';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';
import { IS_WEB } from '@/lib/webPressableStyles';
import { useThemedStyles } from '@/theme';

type CoverageCardGridProps = {
  children: ReactNode;
  /** Cap animated items to avoid long cascades. */
  maxAnimatedItems?: number;
};

/**
 * Home / hub card layout — single column on phone, 2-col (3 on xwide) on web.
 */
export function CoverageCardGrid({
  children,
  maxAnimatedItems = 12,
}: CoverageCardGridProps) {
  const { gridColumns, isWide } = useResponsiveLayout();
  const columns = IS_WEB && isWide ? gridColumns : 1;

  const styles = useThemedStyles(({ spacing }) => ({
    grid: {
      width: '100%' as const,
      flexDirection: 'row' as const,
      flexWrap: 'wrap' as const,
      gap: spacing.sm,
    },
    cell: {
      // RN % width + gap: leave room for sibling so wrap stays even.
      width: columns === 1 ? ('100%' as const) : columns === 3 ? ('32%' as const) : ('48.5%' as const),
      minWidth: columns === 1 ? undefined : 260,
      flexGrow: 1,
      maxWidth: columns === 1 ? ('100%' as const) : columns === 3 ? ('33.5%' as const) : ('50%' as const),
    },
  }));

  const items = Children.toArray(children).filter(isValidElement);

  return (
    <View style={styles.grid}>
      {items.map((child, index) => (
        <View key={child.key ?? index} style={styles.cell}>
          {index < maxAnimatedItems ? (
            <FadeInSection delayMs={index * 40}>{child}</FadeInSection>
          ) : (
            child
          )}
        </View>
      ))}
    </View>
  );
}
