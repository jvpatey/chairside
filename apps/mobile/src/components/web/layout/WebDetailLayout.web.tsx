import { ReactNode } from 'react';
import { View } from 'react-native';

import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';
import { useThemedStyles } from '@/theme';
import { getWebShadow } from '@/theme/web';

type WebDetailLayoutProps = {
  main: ReactNode;
  rail: ReactNode;
};

/** Two-column detail page with sticky action rail on wide web. */
export function WebDetailLayout({ main, rail }: WebDetailLayoutProps) {
  const { isWide } = useResponsiveLayout();
  const styles = useThemedStyles(({ colors, spacing, isDark }) => ({
    row: {
      flexDirection: isWide ? ('row' as const) : ('column' as const),
      gap: spacing.xl,
      alignItems: 'flex-start' as const,
    },
    main: {
      flex: 1,
      minWidth: 0,
      gap: spacing.lg,
    },
    rail: {
      width: isWide ? 300 : undefined,
      flexShrink: 0,
      gap: spacing.md,
      ...(isWide
        ? ({
            position: 'sticky' as const,
            top: 88,
            alignSelf: 'flex-start' as const,
            padding: spacing.lg,
            borderRadius: 20,
            backgroundColor: colors.surface,
            borderWidth: 1,
            borderColor: colors.separator,
            boxShadow: getWebShadow(isDark, 'subtle'),
          } as object)
        : {}),
    },
  }));

  return (
    <View style={styles.row}>
      <View style={styles.main}>{main}</View>
      <View style={styles.rail}>{rail}</View>
    </View>
  );
}
