import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppAtmosphere } from '@/components/navigation/AppAtmosphere';
import { PageHeroGlow, type PageHeroGlowVariant } from '@/components/ui/PageHeroGlow';
import { useMobileTabDockInset } from '@/components/navigation/mobileTabDockInset';
import {
  useShellAtmosphere,
  useTabAtmosphere,
  useTabAtmosphereAccent,
} from '@/contexts/TabAtmosphereContext';
import { useTheme, useThemedStyles, spacing, type GradientAccent } from '@/theme';
import { WebPageEnter } from '@/components/ui/WebPageEnter';

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
  /** Fixed page header rendered above the scroll region (not inside scroll content). */
  header?: ReactNode;
  contentStyle?: StyleProp<ViewStyle>;
  /** Renders behind scroll content (e.g. welcome screen top glow). Overrides `atmosphere`. */
  backgroundAccessory?: ReactNode;
  /** Built-in orb backdrop when no custom `backgroundAccessory` is provided. */
  atmosphere?: PageHeroGlowVariant | 'none';
  atmosphereAccent?: GradientAccent;
  /** Lets tab atmosphere show through (used on stack screens with sidebar layouts). */
  transparentBackground?: boolean;
  /** Stretch content to the scroll viewport height (welcome / landing layouts). */
  fillViewport?: boolean;
  /** Web-only: use split-screen auth marketing layout. */
  authSplit?: boolean;
  /** Web-only: centered column for decision steps (e.g. role selection). */
  webLayout?: 'default' | 'centeredDecision';
  /** Web-only: left panel headline when authSplit is enabled. */
  brandHeadline?: string;
  /** Web-only: left panel subtitle when authSplit is enabled. */
  brandSubtitle?: string;
  /** Web-only: left panel visual when authSplit is enabled. */
  brandVisual?: 'appPreview' | 'rolePaths';
};

const FOOTER_SCROLL_CLEARANCE_FALLBACK = 88;
const SCROLL_INTO_VIEW_DELAYS_MS = [50, 150, 300, 450, 650];
const SCROLL_INTO_VIEW_MARGIN = 24;

export function OnboardingShell({
  children,
  footer,
  header,
  contentStyle,
  backgroundAccessory,
  transparentBackground = false,
  fillViewport = false,
  atmosphere = 'none',
  atmosphereAccent = 'primary',
}: OnboardingShellProps) {
  const insets = useSafeAreaInsets();
  const tabDockInset = useMobileTabDockInset();
  const tabAtmosphere = useTabAtmosphere();
  const tabAtmosphereAccent = useTabAtmosphereAccent();
  const shellAtmosphere = useShellAtmosphere();
  const { colors } = useTheme();
  const showTabAtmosphere = tabAtmosphere !== 'none';
  // Match Screen / web shell: stay transparent under the shared tab wash.
  const passThroughAtmosphere =
    transparentBackground || shellAtmosphere || showTabAtmosphere;
  const containerBackground = passThroughAtmosphere
    ? 'transparent'
    : colors.backgroundGrouped;
  const paintTabWash = showTabAtmosphere && !shellAtmosphere;
  const atmosphereLayer = paintTabWash ? (
    <AppAtmosphere intensity={tabAtmosphere} accent={tabAtmosphereAccent} />
  ) : null;
  const resolvedBackgroundAccessory =
    backgroundAccessory ??
    (atmosphere !== 'none' && !paintTabWash && !shellAtmosphere && !transparentBackground ? (
      <PageHeroGlow variant={atmosphere} accent={atmosphereAccent} />
    ) : null);
  const scrollRef = useRef<ScrollView>(null);
  const contentRef = useRef<View>(null);
  const scrollYRef = useRef(0);
  const viewportHeightRef = useRef(0);
  const keyboardHeightRef = useRef(0);
  const footerHeightRef = useRef(0);
  const pendingScrollRef = useRef<View | null>(null);
  const scrollTimeoutIdsRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [footerHeight, setFooterHeight] = useState(0);
  const [scrollViewportHeight, setScrollViewportHeight] = useState(0);

  const styles = useThemedStyles(({ colors, spacing }) => ({
    container: {
      flex: 1,
    },
    scroll: {
      flex: 1,
      backgroundColor: 'transparent',
    },
    backgroundLayer: {
      ...StyleSheet.absoluteFillObject,
      pointerEvents: 'none',
    },
    shellInner: {
      flex: 1,
      backgroundColor: 'transparent',
    },
    content: {
      flexGrow: 1,
      paddingHorizontal: spacing.lg,
    },
    body: {
      flexGrow: 1,
      ...(fillViewport ? { flex: 1, minHeight: 0 } : null),
    },
    footer: {
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.md,
      backgroundColor: colors.backgroundGrouped,
    },
    headerSlot: {
      flexShrink: 0,
      paddingTop: insets.top + spacing.md,
      paddingHorizontal: spacing.lg,
      paddingBottom: spacing.sm,
    },
    shellFlex: {
      flex: 1,
      minHeight: 0,
    },
  }));

  const footerScrollClearance = footer ? footerHeight || FOOTER_SCROLL_CLEARANCE_FALLBACK : 0;

  const performScroll = useCallback((wrapRef: View | null) => {
    const scrollView = scrollRef.current;
    if (!wrapRef || !scrollView) return;

    // Use on-screen geometry so sticky headers/footers and keyboard padding are
    // reflected correctly (layout-relative math under-counted with a fixed footer).
    scrollView.measureInWindow((_sx, scrollY, _sw, scrollHeight) => {
      if (scrollHeight <= 0) return;

      wrapRef.measureInWindow((_x, fieldY, _w, fieldHeight) => {
        const visibleTop = scrollY + SCROLL_INTO_VIEW_MARGIN;
        const visibleBottom = scrollY + scrollHeight - SCROLL_INTO_VIEW_MARGIN;
        const fieldBottom = fieldY + fieldHeight;

        if (fieldBottom > visibleBottom + 4) {
          scrollView.scrollTo({
            y: Math.max(0, scrollYRef.current + (fieldBottom - visibleBottom)),
            animated: true,
          });
          return;
        }

        if (fieldY < visibleTop - 4) {
          scrollView.scrollTo({
            y: Math.max(0, scrollYRef.current - (visibleTop - fieldY)),
            animated: true,
          });
        }
      });
    });
  }, []);

  const clearScrollTimeouts = useCallback(() => {
    for (const id of scrollTimeoutIdsRef.current) {
      clearTimeout(id);
    }
    scrollTimeoutIdsRef.current = [];
  }, []);

  const scheduleDelayedRuns = useCallback(
    (run: () => void) => {
      clearScrollTimeouts();
      run();
      for (const delay of SCROLL_INTO_VIEW_DELAYS_MS) {
        const id = setTimeout(run, delay);
        scrollTimeoutIdsRef.current.push(id);
      }
    },
    [clearScrollTimeouts],
  );

  const scheduleScrollIntoView = useCallback(
    (wrapRef: View | null) => {
      if (!wrapRef) return;

      pendingScrollRef.current = wrapRef;
      scheduleDelayedRuns(() => performScroll(wrapRef));
    },
    [performScroll, scheduleDelayedRuns],
  );

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSubscription = Keyboard.addListener(showEvent, (event) => {
      const height = event.endCoordinates.height;
      keyboardHeightRef.current = height;
      setKeyboardHeight(height);

      if (pendingScrollRef.current) {
        const pending = pendingScrollRef.current;
        scheduleDelayedRuns(() => performScroll(pending));
      }
    });

    const hideSubscription = Keyboard.addListener(hideEvent, () => {
      keyboardHeightRef.current = 0;
      setKeyboardHeight(0);
      pendingScrollRef.current = null;
      clearScrollTimeouts();
    });

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
      clearScrollTimeouts();
    };
  }, [performScroll, scheduleDelayedRuns, clearScrollTimeouts]);

  useEffect(() => {
    if (footerHeight <= 0 || !pendingScrollRef.current) return;
    scheduleDelayedRuns(() => performScroll(pendingScrollRef.current));
  }, [footerHeight, performScroll, scheduleDelayedRuns]);

  useEffect(() => {
    if (scrollViewportHeight <= 0 || !pendingScrollRef.current) return;
    scheduleDelayedRuns(() => performScroll(pendingScrollRef.current));
  }, [scrollViewportHeight, performScroll, scheduleDelayedRuns]);

  // Lift the sticky footer above the keyboard. Prefer keyboard height over home /
  // tab insets while open so Continue stays visible and the scroll viewport shrinks.
  const footerPaddingBottom = footer
    ? spacing.md + (keyboardHeight > 0 ? keyboardHeight : tabDockInset)
    : insets.bottom + spacing.md;

  const scrollBottomInset = footer ? 0 : tabDockInset > 0 ? tabDockInset : insets.bottom;

  const scrollView = (
    <ScrollView
      ref={scrollRef}
      style={styles.scroll}
      scrollEnabled={!fillViewport}
      onLayout={(event) => {
        const height = event.nativeEvent.layout.height;
        viewportHeightRef.current = height;
        setScrollViewportHeight(height);
      }}
      onScroll={(event) => {
        scrollYRef.current = event.nativeEvent.contentOffset.y;
      }}
      scrollEventThrottle={16}
      contentContainerStyle={[
        styles.content,
        fillViewport && scrollViewportHeight > 0 ? { minHeight: scrollViewportHeight } : null,
        {
          paddingTop: header ? spacing.lg : insets.top + 16,
          paddingBottom:
            spacing.lg +
            scrollBottomInset +
            (fillViewport ? 0 : footerScrollClearance) +
            // No sticky footer: Android needs manual bottom inset; iOS uses
            // automaticallyAdjustKeyboardInsets on the ScrollView.
            (Platform.OS === 'android' && !footer ? keyboardHeight : 0),
        },
      ]}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
      directionalLockEnabled
      automaticallyAdjustKeyboardInsets={Platform.OS === 'ios' && !footer}
      showsVerticalScrollIndicator={false}
    >
      <View ref={contentRef} style={[styles.body, contentStyle]} collapsable={false}>
        <WebPageEnter style={styles.body}>{children}</WebPageEnter>
      </View>
    </ScrollView>
  );

  const stickyFooter = footer ? (
    <View
      style={[
        styles.footer,
        {
          paddingBottom: footerPaddingBottom,
          backgroundColor: passThroughAtmosphere ? 'transparent' : colors.backgroundGrouped,
        },
      ]}
      onLayout={(event) => {
        const height = event.nativeEvent.layout.height;
        footerHeightRef.current = height;
        setFooterHeight(height);
      }}
    >
      {footer}
    </View>
  ) : null;

  // Sticky-footer forms lift the footer with keyboard padding instead of
  // KeyboardAvoidingView (KAV + fixed header under-scrolled lower fields on iOS).
  const shell = footer ? (
    <View style={styles.shellInner}>
      {scrollView}
      {stickyFooter}
    </View>
  ) : Platform.OS === 'android' ? (
    <KeyboardAvoidingView style={styles.shellInner} behavior="height">
      {scrollView}
    </KeyboardAvoidingView>
  ) : (
    <View style={styles.shellInner}>{scrollView}</View>
  );

  return (
    <FormScrollContext.Provider value={{ scrollWrapIntoView: scheduleScrollIntoView }}>
      <View style={[styles.container, { backgroundColor: containerBackground }]}>
        {atmosphereLayer}
        {resolvedBackgroundAccessory ? (
          <View style={styles.backgroundLayer}>{resolvedBackgroundAccessory}</View>
        ) : null}
        {header ? <View style={styles.headerSlot}>{header}</View> : null}
        <View style={styles.shellFlex}>{shell}</View>
      </View>
    </FormScrollContext.Provider>
  );
}
