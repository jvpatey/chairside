import { ReactNode } from 'react';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { webScrollbarStyles } from '@/lib/webScrollbarStyles';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';
import { useThemedStyles } from '@/theme';
import { webOnboardingAtmosphereStyle } from '@/theme/web';

type OnboardingWebCenteredLayoutProps = {
  children: ReactNode;
  footer?: ReactNode;
};

/** Centered onboarding step — one column, no split marketing panel. */
export function OnboardingWebCenteredLayout({
  children,
  footer,
}: OnboardingWebCenteredLayoutProps) {
  const insets = useSafeAreaInsets();
  const { isCompact } = useResponsiveLayout();

  const styles = useThemedStyles(({ colors, spacing, isDark }) => ({
    page: {
      flex: 1,
      backgroundColor: colors.backgroundGrouped,
      ...webOnboardingAtmosphereStyle(isDark),
    },
    scroll: {
      flex: 1,
    },
    content: {
      flexGrow: 1,
      paddingHorizontal: spacing.lg,
      paddingTop: insets.top + spacing.xl,
      paddingBottom: insets.bottom + spacing.xl * 2,
      alignItems: 'center' as const,
      justifyContent: isCompact ? ('flex-start' as const) : ('center' as const),
    },
    column: {
      width: '100%' as const,
      maxWidth: 560,
      gap: spacing.xl,
    },
    footer: {
      gap: spacing.md,
      marginTop: spacing.sm,
    },
  }));

  return (
    <View style={styles.page}>
      <ScrollView
        style={[styles.scroll, webScrollbarStyles()]}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.column}>
          {children}
          {footer ? <View style={styles.footer}>{footer}</View> : null}
        </View>
      </ScrollView>
    </View>
  );
}
