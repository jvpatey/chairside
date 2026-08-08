import { ReactNode } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ChairsideWordmark } from '@/components/brand/ChairsideWordmark';
import { WelcomeHeroAppPanel } from '@/components/onboarding/WelcomeHeroAppPanel.web';
import { AuthWebRolePathsVisual } from '@/components/web/auth/AuthWebRolePathsVisual.web';
import { ONBOARDING_SUBTITLE } from '@/constants';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';
import { webOnlyStyle } from '@/lib/webPressableStyles';
import { webScrollbarStyles } from '@/lib/webScrollbarStyles';
import { useTheme, useThemedStyles } from '@/theme';
import { getElevationStyle, radii } from '@/theme/tokens';
import { webOnboardingAtmosphereStyle, webTypography } from '@/theme/web';

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
  const { isWide } = useResponsiveLayout();
  const insets = useSafeAreaInsets();

  const styles = useThemedStyles(({ colors, spacing, isDark }) => ({
    panel: {
      flex: isWide ? 1 : undefined,
      position: 'relative' as const,
      overflow: isWide ? ('hidden' as const) : ('visible' as const),
      backgroundColor: colors.backgroundGrouped,
    },
    atmosphere: {
      ...StyleSheet.absoluteFillObject,
      pointerEvents: 'none' as const,
      ...webOnboardingAtmosphereStyle(isDark),
    },
    content: {
      paddingTop: isWide ? spacing.xl * 1.5 : insets.top + spacing.lg,
      paddingBottom: isWide ? spacing.xl * 1.5 : spacing.lg,
      paddingHorizontal: isWide ? spacing.xl * 1.5 : spacing.lg,
      justifyContent: 'center' as const,
      gap: isWide ? spacing.xl : spacing.md,
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
      <View style={styles.atmosphere} />
      <View style={styles.content}>
        <ChairsideWordmark variant="small" />
        <View style={styles.copy}>
          <Text style={styles.headline}>{headline}</Text>
          <Text style={styles.subtitle}>{subtitle}</Text>
        </View>
        {isWide ? (
          <View style={styles.visual}>
            <AuthWebBrandVisualPanel visual={visual} />
          </View>
        ) : null}
      </View>
    </View>
  );
}

type AuthWebFormPanelProps = {
  children: ReactNode;
  footer?: ReactNode;
  /** When false, content flows in a parent ScrollView (narrow auth layout). */
  scrollable?: boolean;
};

export function AuthWebFormPanel({ children, footer, scrollable = true }: AuthWebFormPanelProps) {
  const insets = useSafeAreaInsets();
  const { isDark } = useTheme();

  const styles = useThemedStyles(({ colors, spacing, isDark }) => ({
    outer: {
      flex: scrollable ? 1 : undefined,
      backgroundColor: colors.backgroundGrouped,
      minWidth: 0,
      minHeight: scrollable ? 0 : undefined,
    },
    scroll: {
      flex: 1,
      minHeight: 0,
    },
    inner: {
      flexGrow: 1,
      paddingHorizontal: spacing.xl,
      paddingTop: scrollable ? insets.top + spacing.xl : spacing.lg,
      paddingBottom: insets.bottom + spacing.xl,
      alignItems: 'center' as const,
      ...(scrollable ? webOnlyStyle({ minHeight: '100%' } as object) : {}),
    },
    stack: {
      width: '100%' as const,
      maxWidth: 440,
      gap: spacing.md,
      ...(scrollable ? webOnlyStyle({ marginTop: 'auto', marginBottom: 'auto' } as object) : {}),
    },
    card: {
      width: '100%' as const,
      borderRadius: radii.lg,
      padding: spacing.xl,
      backgroundColor: colors.surface,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.separator,
      gap: spacing.lg,
      ...getElevationStyle({ isDark, level: 'subtle' }),
    },
    footer: {
      width: '100%' as const,
      gap: spacing.md,
    },
  }));

  const formBody = (
    <View style={styles.stack}>
      <View style={styles.card}>{children}</View>
      {footer ? <View style={styles.footer}>{footer}</View> : null}
    </View>
  );

  if (!scrollable) {
    return (
      <View style={styles.outer}>
        <View style={styles.inner}>{formBody}</View>
      </View>
    );
  }

  return (
    <View style={styles.outer}>
      <ScrollView
        style={[styles.scroll, webScrollbarStyles()]}
        contentContainerStyle={styles.inner}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {formBody}
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
  const insets = useSafeAreaInsets();

  const styles = useThemedStyles(({ colors, spacing }) => ({
    root: {
      flex: 1,
      minHeight: 0,
      flexDirection: isWide ? ('row' as const) : ('column' as const),
    },
    narrowScroll: {
      flex: 1,
      backgroundColor: colors.backgroundGrouped,
    },
    narrowScrollContent: {
      flexGrow: 1,
      paddingBottom: insets.bottom + spacing.md,
    },
    brand: {
      flex: isWide ? 1 : undefined,
    },
    form: {
      flex: isWide ? 1 : undefined,
      minWidth: isWide ? 480 : undefined,
      minHeight: 0,
    },
  }));

  const brandPanel = (
    <AuthWebBrandPanel
      headline={brandHeadline}
      subtitle={brandSubtitle}
      visual={brandVisual}
    />
  );

  const formPanel = (
    <AuthWebFormPanel scrollable={isWide} footer={footer}>
      {children}
    </AuthWebFormPanel>
  );

  if (!isWide) {
    return (
      <ScrollView
        style={[styles.narrowScroll, webScrollbarStyles()]}
        contentContainerStyle={styles.narrowScrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {brandPanel}
        {formPanel}
      </ScrollView>
    );
  }

  return (
    <View style={styles.root}>
      <View style={styles.brand}>{brandPanel}</View>
      <View style={styles.form}>{formPanel}</View>
    </View>
  );
}
