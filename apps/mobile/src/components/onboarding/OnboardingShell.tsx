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

import { useThemedStyles, spacing } from '@/theme';
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
  contentStyle?: StyleProp<ViewStyle>;
  /** Renders behind scroll content (e.g. welcome screen top glow). */
  backgroundAccessory?: ReactNode;
};

const FOOTER_SCROLL_CLEARANCE_FALLBACK = 88;
const SCROLL_INTO_VIEW_DELAYS_MS = [50, 150, 300, 500];
const SCROLL_INTO_VIEW_MARGIN = 32;

export function OnboardingShell({
  children,
  footer,
  contentStyle,
  backgroundAccessory,
}: OnboardingShellProps) {
  const insets = useSafeAreaInsets();
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

  const styles = useThemedStyles(({ colors, spacing }) => ({
    container: {
      flex: 1,
      backgroundColor: colors.background,
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
    },
    footer: {
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.md,
      backgroundColor: colors.background,
    },
  }));

  const footerScrollClearance = footer
    ? footerHeight || FOOTER_SCROLL_CLEARANCE_FALLBACK
    : 0;

  const performScroll = useCallback(
    (wrapRef: View | null) => {
      if (!wrapRef || !contentRef.current) return;

      const viewportHeight = viewportHeightRef.current;
      if (viewportHeight <= 0) return;

      wrapRef.measureLayout(
        contentRef.current,
        (_x, y, _width, height) => {
          const footerBlock = footer
            ? footerHeightRef.current || FOOTER_SCROLL_CLEARANCE_FALLBACK
            : 0;
          // Sticky footer screens use KeyboardAvoidingView, which already shrinks
          // the scroll viewport. Other screens need an explicit keyboard allowance.
          const keyboardBlock = footer ? 0 : keyboardHeightRef.current;
          const visibleHeight =
            viewportHeight - keyboardBlock - footerBlock - SCROLL_INTO_VIEW_MARGIN;
          const fieldBottom = y + height;
          const targetScrollY = fieldBottom - visibleHeight;

          if (targetScrollY > scrollYRef.current + 4) {
            scrollRef.current?.scrollTo({
              y: Math.max(0, targetScrollY),
              animated: true,
            });
          }
        },
        () => {},
      );
    },
    [footer],
  );

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

  const footerPaddingBottom = footer ? spacing.md : insets.bottom + spacing.md;

  const scrollView = (
    <ScrollView
      ref={scrollRef}
      style={styles.scroll}
      onLayout={(event) => {
        viewportHeightRef.current = event.nativeEvent.layout.height;
      }}
      onScroll={(event) => {
        scrollYRef.current = event.nativeEvent.contentOffset.y;
      }}
      scrollEventThrottle={16}
      contentContainerStyle={[
        styles.content,
        {
          paddingTop: insets.top + 16,
          paddingBottom:
            spacing.lg +
            insets.bottom +
            footerScrollClearance +
            // iOS without a footer uses automaticallyAdjustKeyboardInsets; with a
            // footer, KeyboardAvoidingView handles the inset — avoid double padding.
            (Platform.OS === 'android' && !footer ? keyboardHeight : 0),
        },
      ]}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
      automaticallyAdjustKeyboardInsets={Platform.OS === 'ios' && !footer}
      showsVerticalScrollIndicator={false}>
      <View ref={contentRef} style={[styles.body, contentStyle]} collapsable={false}>
        <WebPageEnter style={styles.body}>{children}</WebPageEnter>
      </View>
    </ScrollView>
  );

  const shell = footer ? (
    <KeyboardAvoidingView
      style={styles.shellInner}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      {scrollView}
      <View
        style={[styles.footer, { paddingBottom: footerPaddingBottom }]}
        onLayout={(event) => {
          const height = event.nativeEvent.layout.height;
          footerHeightRef.current = height;
          setFooterHeight(height);
        }}>
        {footer}
      </View>
    </KeyboardAvoidingView>
  ) : Platform.OS === 'android' ? (
    <KeyboardAvoidingView style={styles.shellInner} behavior="height">
      {scrollView}
    </KeyboardAvoidingView>
  ) : (
    <View style={styles.shellInner}>{scrollView}</View>
  );

  return (
    <FormScrollContext.Provider value={{ scrollWrapIntoView: scheduleScrollIntoView }}>
      <View style={styles.container}>
        {backgroundAccessory ? (
          <View style={styles.backgroundLayer}>{backgroundAccessory}</View>
        ) : null}
        {shell}
      </View>
    </FormScrollContext.Provider>
  );
}
