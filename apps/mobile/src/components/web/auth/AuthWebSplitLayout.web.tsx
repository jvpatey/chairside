import { ReactNode } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ChairsideWordmark } from '@/components/brand/ChairsideWordmark';
import { WelcomeHeroAppPanel } from '@/components/onboarding/WelcomeHeroAppPanel.web';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';
import { webScrollbarStyles } from '@/lib/webScrollbarStyles';
import { useTheme, useThemedStyles } from '@/theme';
import { getWebShadow, webTypography } from '@/theme/web';

type AuthWebBrandPanelProps = {
  headline?: string;
  subtitle?: string;
};

export function AuthWebBrandPanel({
  headline = 'Staffing for dental clinics, simplified.',
  subtitle = 'Hire staff, find work, and fill same-day shifts — all in one place.',
}: AuthWebBrandPanelProps) {
  const { colors, isDark } = useTheme();
  const { isWide } = useResponsiveLayout();

  const styles = useThemedStyles(({ colors, spacing, isDark }) => ({
    panel: {
      flex: 1,
      padding: spacing.xl * 1.5,
      justifyContent: 'center' as const,
      gap: spacing.xl,
      position: 'relative' as const,
      overflow: 'hidden' as const,
      // @ts-expect-error web gradient
      backgroundImage: isDark
        ? 'linear-gradient(160deg, rgba(74, 154, 255, 0.14) 0%, rgba(152, 150, 255, 0.08) 40%, rgba(12, 12, 14, 1) 100%)'
        : 'linear-gradient(160deg, rgba(26, 111, 212, 0.1) 0%, rgba(88, 86, 214, 0.06) 40%, rgba(242, 242, 247, 1) 100%)',
    },
    copy: {
      gap: spacing.md,
      maxWidth: 440,
    },
    headline: {
      ...(isWide ? webTypography.displaySm : webTypography.headline),
      color: colors.labelPrimary,
    },
    subtitle: {
      ...webTypography.subtitle,
      color: colors.labelSecondary,
    },
    visual: {
      maxWidth: 520,
      width: '100%' as const,
    },
  }));

  return (
    <View style={styles.panel}>
      <ChairsideWordmark variant="small" />
      <View style={styles.copy}>
        <Text style={styles.headline}>{headline}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
      </View>
      <View style={styles.visual}>
        <WelcomeHeroAppPanel />
      </View>
    </View>
  );
}

type AuthWebFormPanelProps = {
  children: ReactNode;
  footer?: ReactNode;
};

export function AuthWebFormPanel({ children, footer }: AuthWebFormPanelProps) {
  const insets = useSafeAreaInsets();
  const { isDark } = useTheme();

  const styles = useThemedStyles(({ colors, spacing, isDark }) => ({
    outer: {
      flex: 1,
      backgroundColor: colors.backgroundGrouped,
      minWidth: 0,
    },
    scroll: {
      flex: 1,
    },
    inner: {
      flexGrow: 1,
      paddingHorizontal: spacing.xl,
      paddingTop: insets.top + spacing.xl,
      paddingBottom: spacing.lg,
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
    },
    card: {
      width: '100%' as const,
      maxWidth: 440,
      borderRadius: 24,
      padding: spacing.xl,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.separator,
      gap: spacing.lg,
      // @ts-expect-error web shadow
      boxShadow: getWebShadow(isDark, 'raised'),
    },
    footer: {
      width: '100%' as const,
      maxWidth: 440,
      paddingTop: spacing.md,
      paddingBottom: insets.bottom + spacing.lg,
      paddingHorizontal: spacing.xl,
      alignSelf: 'center' as const,
    },
  }));

  return (
    <View style={styles.outer}>
      <ScrollView
        style={[styles.scroll, webScrollbarStyles()]}
        contentContainerStyle={styles.inner}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.card}>{children}</View>
      </ScrollView>
      {footer ? <View style={styles.footer}>{footer}</View> : null}
    </View>
  );
}

type AuthWebSplitLayoutProps = {
  children: ReactNode;
  footer?: ReactNode;
  brandHeadline?: string;
  brandSubtitle?: string;
};

export function AuthWebSplitLayout({
  children,
  footer,
  brandHeadline,
  brandSubtitle,
}: AuthWebSplitLayoutProps) {
  const { isWide } = useResponsiveLayout();

  const styles = useThemedStyles(() => ({
    root: {
      flex: 1,
      flexDirection: isWide ? ('row' as const) : ('column' as const),
    },
    brand: {
      flex: isWide ? 1 : undefined,
      minHeight: isWide ? undefined : 280,
    },
    form: {
      flex: isWide ? 1 : undefined,
      minWidth: isWide ? 480 : undefined,
    },
  }));

  return (
    <View style={styles.root}>
      <View style={styles.brand}>
        <AuthWebBrandPanel headline={brandHeadline} subtitle={brandSubtitle} />
      </View>
      <View style={styles.form}>
        <AuthWebFormPanel footer={footer}>{children}</AuthWebFormPanel>
      </View>
    </View>
  );
}
