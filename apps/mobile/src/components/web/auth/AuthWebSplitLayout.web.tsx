import { ReactNode } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ChairsideWordmark } from '@/components/brand/ChairsideWordmark';
import { WelcomeHeroAppPanel } from '@/components/onboarding/WelcomeHeroAppPanel.web';
import { AuthWebRolePathsVisual } from '@/components/web/auth/AuthWebRolePathsVisual.web';
import { ONBOARDING_SUBTITLE } from '@/constants';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';
import { webOnlyStyle } from '@/lib/webPressableStyles';
import { webScrollbarStyles } from '@/lib/webScrollbarStyles';
import { useTheme, useThemedStyles } from '@/theme';
import { getWebShadow, webTypography } from '@/theme/web';

type AuthWebBrandVisual = 'appPreview' | 'rolePaths';

type AuthWebBrandPanelProps = {
  headline?: string;
  subtitle?: string;
  visual?: AuthWebBrandVisual;
};

function AuthWebBrandVisualPanel({ visual }: { visual: AuthWebBrandVisual }) {
  if (visual === 'rolePaths') {
    return <AuthWebRolePathsVisual />;
  }

  return <WelcomeHeroAppPanel />;
}

export function AuthWebBrandPanel({
  headline = 'Staffing for dental clinics, simplified.',
  subtitle = ONBOARDING_SUBTITLE,
  visual = 'appPreview',
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
        <AuthWebBrandVisualPanel visual={visual} />
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
      minHeight: 0,
    },
    scroll: {
      flex: 1,
      minHeight: 0,
    },
    inner: {
      flexGrow: 1,
      paddingHorizontal: spacing.xl,
      paddingTop: insets.top + spacing.xl,
      paddingBottom: insets.bottom + spacing.xl,
      alignItems: 'center' as const,
      ...webOnlyStyle({ minHeight: '100%' } as object),
    },
    stack: {
      width: '100%' as const,
      maxWidth: 440,
      gap: spacing.md,
      ...webOnlyStyle({ marginTop: 'auto', marginBottom: 'auto' } as object),
    },
    card: {
      width: '100%' as const,
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
      gap: spacing.md,
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
        <View style={styles.stack}>
          <View style={styles.card}>{children}</View>
          {footer ? <View style={styles.footer}>{footer}</View> : null}
        </View>
      </ScrollView>
    </View>
  );
}

type AuthWebSplitLayoutProps = {
  children: ReactNode;
  footer?: ReactNode;
  brandHeadline?: string;
  brandSubtitle?: string;
  brandVisual?: AuthWebBrandVisual;
};

export function AuthWebSplitLayout({
  children,
  footer,
  brandHeadline,
  brandSubtitle,
  brandVisual = 'appPreview',
}: AuthWebSplitLayoutProps) {
  const { isWide } = useResponsiveLayout();

  const styles = useThemedStyles(() => ({
    root: {
      flex: 1,
      minHeight: 0,
      flexDirection: isWide ? ('row' as const) : ('column' as const),
    },
    brand: {
      flex: isWide ? 1 : undefined,
      minHeight: isWide ? undefined : 280,
    },
    form: {
      flex: isWide ? 1 : undefined,
      minWidth: isWide ? 480 : undefined,
      minHeight: 0,
    },
  }));

  return (
    <View style={styles.root}>
      <View style={styles.brand}>
        <AuthWebBrandPanel
          headline={brandHeadline}
          subtitle={brandSubtitle}
          visual={brandVisual}
        />
      </View>
      <View style={styles.form}>
        <AuthWebFormPanel footer={footer}>{children}</AuthWebFormPanel>
      </View>
    </View>
  );
}
