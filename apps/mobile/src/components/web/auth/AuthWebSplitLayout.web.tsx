import { ReactNode, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ChairsideWordmark } from '@/components/brand/ChairsideWordmark';
import { WelcomeHeroAppPanel } from '@/components/onboarding/WelcomeHeroAppPanel.web';
import { AuthWebRolePathsVisual } from '@/components/web/auth/AuthWebRolePathsVisual.web';
import { ONBOARDING_SUBTITLE } from '@/constants';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';
import { webScrollbarStyles } from '@/lib/webScrollbarStyles';
import { useThemedStyles } from '@/theme';
import { getElevationStyle, radii } from '@/theme/tokens';
import { webTypography } from '@/theme/web';

type AuthWebBrandVisual = 'appPreview' | 'rolePaths';

type AuthWebBrandPanelProps = {
  headline?: string;
  subtitle?: string;
  visual?: AuthWebBrandVisual;
};

function AuthWebBrandVisualPanel({
  visual,
  maxHeight,
}: {
  visual: AuthWebBrandVisual;
  maxHeight?: number;
}) {
  if (visual === 'rolePaths') {
    return <AuthWebRolePathsVisual />;
  }

  return <WelcomeHeroAppPanel compact showPhone={false} maxHeight={maxHeight} />;
}

export function AuthWebBrandPanel({
  headline = 'Staffing for dental clinics, simplified.',
  subtitle = ONBOARDING_SUBTITLE,
  visual = 'appPreview',
}: AuthWebBrandPanelProps) {
  const { isWide } = useResponsiveLayout();
  const insets = useSafeAreaInsets();
  const [previewMaxHeight, setPreviewMaxHeight] = useState(0);

  const styles = useThemedStyles(({ colors, spacing }) => ({
    panel: {
      flex: isWide ? 1 : undefined,
      minHeight: isWide ? 0 : undefined,
      position: 'relative' as const,
      overflow: 'visible' as const,
      backgroundColor: 'transparent',
    },
    content: {
      flex: isWide ? 1 : undefined,
      minHeight: isWide ? 0 : undefined,
      paddingTop: isWide ? spacing.xl : insets.top + spacing.lg,
      paddingBottom: isWide ? spacing.xl : spacing.lg,
      paddingHorizontal: isWide ? 0 : spacing.lg,
      justifyContent: 'flex-start' as const,
    },
    column: {
      width: '100%' as const,
      maxWidth: 480,
      flex: isWide ? 1 : undefined,
      minHeight: isWide ? 0 : undefined,
      gap: spacing.md,
    },
    copy: {
      gap: spacing.sm,
      flexShrink: 0,
      zIndex: 1,
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
      width: '100%' as const,
      flex: isWide ? 1 : undefined,
      flexShrink: 1,
      minHeight: 0,
      justifyContent: 'flex-start' as const,
      overflow: 'visible' as const,
    },
  }));

  return (
    <View style={styles.panel}>
      <View style={styles.content}>
        <View style={styles.column}>
          <ChairsideWordmark variant="small" align="left" />
          <View style={styles.copy}>
            <Text style={styles.headline}>{headline}</Text>
            <Text style={styles.subtitle}>{subtitle}</Text>
          </View>
          {isWide ? (
            <View
              style={styles.visual}
              onLayout={(event) => {
                const next = event.nativeEvent.layout.height;
                if (next > 0 && Math.abs(next - previewMaxHeight) > 2) {
                  setPreviewMaxHeight(next);
                }
              }}
            >
              <AuthWebBrandVisualPanel
                visual={visual}
                maxHeight={previewMaxHeight > 0 ? previewMaxHeight : undefined}
              />
            </View>
          ) : null}
        </View>
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
  const { isWide } = useResponsiveLayout();

  const styles = useThemedStyles(({ colors, spacing, isDark }) => ({
    outer: {
      flex: scrollable ? 1 : undefined,
      backgroundColor: 'transparent',
      minWidth: 0,
      minHeight: scrollable ? 0 : undefined,
      overflow: 'visible' as const,
    },
    scroll: {
      flex: 1,
      minHeight: 0,
    },
    inner: {
      flexGrow: 1,
      paddingHorizontal: isWide ? 0 : spacing.lg,
      paddingTop: isWide ? spacing.xl : scrollable ? insets.top + spacing.lg : spacing.lg,
      paddingBottom: isWide ? spacing.xl : insets.bottom + spacing.lg,
      alignItems: 'stretch' as const,
      justifyContent: isWide ? ('flex-start' as const) : ('center' as const),
      overflow: 'visible' as const,
    },
    stack: {
      width: '100%' as const,
      gap: spacing.md,
      overflow: 'visible' as const,
    },
    wordmarkSpacer: {
      opacity: 0,
      pointerEvents: 'none' as const,
    },
    cardShadow: {
      width: '100%' as const,
      borderRadius: radii.lg,
      overflow: 'visible' as const,
      ...getElevationStyle({ isDark, level: 'subtle' }),
    },
    card: {
      width: '100%' as const,
      borderRadius: radii.lg,
      padding: spacing.lg,
      backgroundColor: colors.surface,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.separator,
      gap: spacing.md,
      overflow: 'hidden' as const,
    },
    footer: {
      width: '100%' as const,
      gap: spacing.sm,
      paddingTop: spacing.sm,
    },
  }));

  const formBody = (
    <View style={styles.stack}>
      {isWide ? (
        <View style={styles.wordmarkSpacer} accessibilityElementsHidden>
          <ChairsideWordmark variant="small" align="left" />
        </View>
      ) : null}
      <View style={styles.cardShadow}>
        <View style={styles.card}>
          {children}
          {footer ? <View style={styles.footer}>{footer}</View> : null}
        </View>
      </View>
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

  const styles = useThemedStyles(({ spacing }) => ({
    root: {
      flex: 1,
      minHeight: 0,
      width: '100%' as const,
      maxWidth: isWide ? 1120 : undefined,
      alignSelf: 'center' as const,
      justifyContent: isWide ? ('flex-start' as const) : undefined,
      paddingHorizontal: isWide ? spacing.xl : 0,
      overflow: 'visible' as const,
    },
    row: {
      flexDirection: 'row' as const,
      alignItems: 'stretch' as const,
      gap: spacing.xl,
      width: '100%' as const,
      overflow: 'visible' as const,
    },
    narrowScroll: {
      flex: 1,
      backgroundColor: 'transparent',
    },
    narrowScrollContent: {
      flexGrow: 1,
      paddingBottom: insets.bottom + spacing.md,
    },
    brand: {
      flex: isWide ? 1 : undefined,
      minWidth: isWide ? 0 : undefined,
      minHeight: isWide ? 0 : undefined,
      overflow: 'visible' as const,
    },
    form: {
      width: isWide ? 440 : undefined,
      flexGrow: 0,
      flexShrink: 0,
      overflow: 'visible' as const,
    },
  }));

  const brandPanel = (
    <AuthWebBrandPanel headline={brandHeadline} subtitle={brandSubtitle} visual={brandVisual} />
  );

  const formPanel = (
    <AuthWebFormPanel scrollable={!isWide} footer={footer}>
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
      <View style={styles.row}>
        <View style={styles.brand}>{brandPanel}</View>
        <View style={styles.form}>{formPanel}</View>
      </View>
    </View>
  );
}
