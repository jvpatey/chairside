import { ReactNode } from 'react';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { webOnlyStyle } from '@/lib/webPressableStyles';
import { webScrollbarStyles } from '@/lib/webScrollbarStyles';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';
import { useThemedStyles } from '@/theme';

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
      ...webOnlyStyle({
        backgroundImage: isDark
          ? 'radial-gradient(ellipse 70% 50% at 50% 0%, rgba(74, 154, 255, 0.1) 0%, transparent 55%), radial-gradient(ellipse 60% 40% at 80% 100%, rgba(152, 150, 255, 0.08) 0%, transparent 50%)'
          : 'radial-gradient(ellipse 70% 50% at 50% 0%, rgba(26, 111, 212, 0.08) 0%, transparent 55%), radial-gradient(ellipse 60% 40% at 80% 100%, rgba(88, 86, 214, 0.06) 0%, transparent 50%)',
      } as object),
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
