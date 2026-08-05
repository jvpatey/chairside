import { createContext, ReactNode, useContext } from 'react';
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
  contentStyle?: StyleProp<ViewStyle>;
  backgroundAccessory?: ReactNode;
  transparentBackground?: boolean;
  fillViewport?: boolean;
  atmosphere?: PageHeroGlowVariant | 'none';
  atmosphereAccent?: GradientAccent;
  authSplit?: boolean;
  /** Web-only layout mode. `centeredDecision` for choice screens; `authSplit` for auth forms. */
  webLayout?: 'default' | 'centeredDecision';
  brandHeadline?: string;
  brandSubtitle?: string;
  brandVisual?: 'appPreview' | 'rolePaths';
};

/** Web onboarding shell — auth split layout or polished scroll form. */
export function OnboardingShell({
  children,
  footer,
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
  const { colors } = useTheme();
  const tabAtmosphere = useTabAtmosphere();
  const tabAtmosphereAccent = useTabAtmosphereAccent();
  const shellAtmosphere = useShellAtmosphere();
  const showTabAtmosphere = tabAtmosphere !== 'none';
  // Under the shared shell wash, stay transparent and skip a second AppAtmosphere.
  // Outside the shell, paint local atmosphere when the tab route asks for it.
  const useTabGlow = showTabAtmosphere && !shellAtmosphere;
  const passThroughAtmosphere = transparentBackground || shellAtmosphere || useTabGlow;
  const containerBackground = passThroughAtmosphere ? 'transparent' : colors.backgroundGrouped;
  // Shell already paints the shared wash — a local PageHeroGlow double-tints the
  // content pane and makes it diverge from the sidebar/gaps.
  const resolvedBackgroundAccessory =
    backgroundAccessory ??
    (atmosphere !== 'none' && !shellAtmosphere ? (
      <PageHeroGlow variant={atmosphere} accent={atmosphereAccent} />
    ) : null);
  const tabAtmosphereLayer =
    useTabGlow && !transparentBackground ? (
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
    scroll: {
      flex: 1,
    },
    content: {
      flexGrow: 1,
      paddingHorizontal: spacing.lg,
      paddingTop: insets.top + spacing.lg,
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
  }));

  const body = (
    <View style={[styles.body, contentStyle]} collapsable={false}>
      <WebPageEnter style={styles.body}>{children}</WebPageEnter>
    </View>
  );

  const backgroundLayer = resolvedBackgroundAccessory ? (
    <View style={styles.backgroundLayer}>{resolvedBackgroundAccessory}</View>
  ) : null;

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
            {body}
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
        <ScrollView
          style={[styles.scroll, webScrollbarStyles(), { backgroundColor: 'transparent' }]}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
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
            ]}>
            {footer}
          </View>
        ) : null}
      </View>
    </FormScrollContext.Provider>
  );
}
