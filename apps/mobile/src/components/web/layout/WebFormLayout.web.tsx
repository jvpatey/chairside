import { ReactNode } from 'react';
import { View } from 'react-native';

import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';
import { useThemedStyles } from '@/theme';
import { getWebShadow } from '@/theme/web';

type WebFormLayoutProps = {
  children: ReactNode;
  footer?: ReactNode;
};

/** Centered form column with sticky submit bar on wide web. */
export function WebFormLayout({ children, footer }: WebFormLayoutProps) {
  const { isWide } = useResponsiveLayout();
  const styles = useThemedStyles(({ colors, spacing, isDark }) => ({
    outer: {
      flex: 1,
      alignItems: 'center' as const,
    },
    column: {
      width: '100%' as const,
      maxWidth: isWide ? 640 : undefined,
      gap: spacing.lg,
    },
    stickyFooter: {
      ...(isWide
        ? ({
            position: 'sticky' as const,
            bottom: 0,
            paddingVertical: spacing.md,
            paddingHorizontal: spacing.lg,
            marginHorizontal: -spacing.lg,
            backgroundColor: colors.surface,
            borderTopWidth: 1,
            borderTopColor: colors.separator,
            boxShadow: getWebShadow(isDark, 'subtle'),
          } as object)
        : { paddingTop: spacing.md }),
    },
  }));

  return (
    <View style={styles.outer}>
      <View style={styles.column}>
        {children}
        {footer ? <View style={styles.stickyFooter}>{footer}</View> : null}
      </View>
    </View>
  );
}
