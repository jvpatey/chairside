import { createContext, ReactNode, useCallback, useContext, useState } from 'react';
import { ScrollView, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AuthWebSplitLayout } from '@/components/web/auth/AuthWebSplitLayout.web';
import { AppAtmosphere } from '@/components/navigation/AppAtmosphere';
import { OnboardingWebCenteredLayout } from '@/components/onboarding/OnboardingWebCenteredLayout.web';
import { PageHeroGlow, type PageHeroGlowVariant } from '@/components/ui/PageHeroGlow';
import { WebPageEnter } from '@/components/ui/WebPageEnter';
import { useShellAtmosphere, useTabAtmosphere, useTabAtmosphereAccent } from '@/contexts/TabAtmosphereContext';
import { webScrollbarStyles } from '@/lib/webScrollbarStyles';
import { useTheme, useThemedStyles, type GradientAccent } from '@/theme';
import { webStickyHeaderGlass, webTransition } from '@/theme/web';

const HEADER_SCROLL_THRESHOLD = 8;
const HEADER_GLASS_RAMP = 56;

type FormScrollContextValue = {
  scrollWrapIntoView: (wrapRef: View | null) => void;
};

const FormScrollContext = createContext<FormScrollContextValue | null>(null);

export function useFormScroll() {
  const context = useContext(FormScrollContext);
  return context ?? { scrollWrapIntoView: () => {} };
}

type OnboardingShellProps = {
  children: ReactNode;
  footer?: ReactNode;
  header?: ReactNode;
  contentStyle?: StyleProp<ViewStyle>;
  backgroundAccessory?: ReactNode;
  transparentBackground?: boolean;
  fillViewport?: boolean;
  atmosphere?: PageHeroGlowVariant | 'none';
  atmosphereAccent?: GradientAccent;
  authSplit?: boolean;
  webLayout?: 'default' | 'centeredDecision';
  brandHeadline?: string;
  brandSubtitle?: string;
  brandVisual?: 'appPreview' | 'rolePaths';
};

function headerGlassProgress(scrollY: number) {
  if (scrollY <= HEADER_SCROLL_THRESHOLD) return 0;
  return Math.min((scrollY - HEADER_SCROLL_THRESHOLD) / HEADER_GLASS_RAMP, 1);
}

/** Web onboarding shell — auth split layout or polished scroll form. */
export function OnboardingShell({
  children,
  footer,
  header,
  contentStyle,
  backgroundAccessory,
  transparentBackground = false,
  atmosphere = 'none',
  atmosphereAccent = 'primary',
  authSplit = false,
  webLayout = 'default',
  brandHeadline,
  brandSubtitle,
  brandVisual,
}: OnboardingShellProps) {
  const insets = useSafeAreaInsets();
  const { colors, isDark, spacing } = useTheme();
  const [scrollY, setScrollY] = useState(0);
  const [headerHeight, setHeaderHeight] = useState(() => insets.top + 72);
  const glassProgress = headerGlassProgress(scrollY);

  const handleScroll = useCallback((event: { nativeEvent: { contentOffset: { y: number } } }) => {
    setScrollY(event.nativeEvent.contentOffset.y);
  }, []);

  const handleHeaderLayout = useCallback((height: number) => {
    if (height > 0) setHeaderHeight(height);
  }, []);

  const tabAtmosphere = useTabAtmosphere();
  const tabAtmosphereAccent = useTabAtmosphereAccent();
  const shellAtmosphere = useShellAtmosphere();
  const showTabAtmosphere = tabAtmosphere !== 'none';
  const useTabGlow = showTabAtmosphere && !shellAtmosphere;
  const passThroughAtmosphere = transparentBackground || shellAtmosphere || useTabGlow;
  const containerBackground = passThroughAtmosphere ? 'transparent' : colors.backgroundGrouped;
  const paintTabWash = useTabGlow;
  const resolvedBackgroundAccessory =
    backgroundAccessory ??
    (atmosphere !== 'none' && !paintTabWash && !shellAtmosphere && !transparentBackground ? (
      <PageHeroGlow variant={atmosphere} accent={atmosphereAccent} />
    ) : null);
  const tabAtmosphereLayer = paintTabWash ? (
    <AppAtmosphere intensity={tabAtmosphere} accent={tabAtmosphereAccent} />
  ) : null;

  const styles = useThemedStyles(({ colors, spacing }) => ({
    container: {
      flex: 1,
      overflow: 'hidden',
    },
    backgroundLayer: {
      ...StyleSheet.absoluteFillObject,
      pointerEvents: 'none',
    },
    overlayHeader: {
      position: 'absolute' as const,
      top: 0,
      left: 0,
      right: 0,
      zIndex: 10,
      paddingTop: insets.top + spacing.sm,
      paddingBottom: spacing.sm,
      paddingHorizontal: spacing.lg,
      ...webTransition(['background-color', 'border-color', 'backdrop-filter']),
    },
    scroll: {
      flex: 1,
    },
    content: {
      flexGrow: 1,
      paddingHorizontal: spacing.lg,
      paddingBottom: insets.bottom + spacing.lg,
    },
    body: {
      flexGrow: 1,
      gap: spacing.md,
    },
    footerInner: {
      gap: spacing.md,
      paddingHorizontal: spacing.lg,
      paddingBottom: insets.bottom + spacing.md,
    },
    shellFlex: {
      flex: 1,
      minHeight: 0,
    },
  }));

  const body = (
    <View style={[styles.body, contentStyle]} collapsable={false}>
      <WebPageEnter style={styles.body}>{children}</WebPageEnter>
    </View>
  );

  const backgroundLayer = resolvedBackgroundAccessory ? (
    <View style={styles.backgroundLayer}>{resolvedBackgroundAccessory}</View>
  ) : null;

  const overlayHeaderBlock = header ? (
    <View
      onLayout={(event) => handleHeaderLayout(event.nativeEvent.layout.height)}
      style={[
        styles.overlayHeader,
        webStickyHeaderGlass(isDark, glassProgress),
        glassProgress <= 0 && {
          borderBottomWidth: StyleSheet.hairlineWidth,
          borderBottomColor: 'transparent',
        },
      ]}
    >
      {header}
    </View>
  ) : null;

  const scrollContent = (
    <>
      <ScrollView
        style={[styles.scroll, webScrollbarStyles(), { backgroundColor: 'transparent' }]}
        contentContainerStyle={[
          styles.content,
          header
            ? { paddingTop: headerHeight + spacing.md }
            : { paddingTop: insets.top + spacing.lg },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        {body}
      </ScrollView>
      {footer ? (
        <View
          style={[
            styles.footerInner,
            {
              backgroundColor: passThroughAtmosphere
                ? 'transparent'
                : colors.backgroundGrouped,
            },
          ]}
        >
          {footer}
        </View>
      ) : null}
    </>
  );

  if (webLayout === 'centeredDecision') {
    return (
      <FormScrollContext.Provider value={{ scrollWrapIntoView: () => {} }}>
        <View style={[styles.container, { backgroundColor: containerBackground }]}>
          {tabAtmosphereLayer}
          {backgroundLayer}
          <OnboardingWebCenteredLayout footer={footer}>{body}</OnboardingWebCenteredLayout>
        </View>
      </FormScrollContext.Provider>
    );
  }

  if (authSplit) {
    return (
      <FormScrollContext.Provider value={{ scrollWrapIntoView: () => {} }}>
        <View style={[styles.container, { backgroundColor: containerBackground }]}>
          {tabAtmosphereLayer}
          {backgroundLayer}
          <AuthWebSplitLayout
            footer={footer}
            brandHeadline={brandHeadline}
            brandSubtitle={brandSubtitle}
            brandVisual={brandVisual}
          >
            <View style={[{ gap: spacing.md }, contentStyle]}>{children}</View>
          </AuthWebSplitLayout>
        </View>
      </FormScrollContext.Provider>
    );
  }

  return (
    <FormScrollContext.Provider value={{ scrollWrapIntoView: () => {} }}>
      <View style={[styles.container, { backgroundColor: containerBackground }]}>
        {tabAtmosphereLayer}
        {backgroundLayer}
        {overlayHeaderBlock}
        <View style={styles.shellFlex}>{scrollContent}</View>
      </View>
    </FormScrollContext.Provider>
  );
}
