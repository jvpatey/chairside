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
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useThemedStyles, spacing } from '@/theme';

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
};

const FOOTER_SCROLL_CLEARANCE = 88;
const SCROLL_INTO_VIEW_DELAYS_MS = [50, 200, 400];

export function OnboardingShell({ children, footer, contentStyle }: OnboardingShellProps) {
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollView>(null);
  const contentRef = useRef<View>(null);
  const scrollYRef = useRef(0);
  const viewportHeightRef = useRef(0);
  const keyboardHeightRef = useRef(0);
  const pendingScrollRef = useRef<View | null>(null);
  const scrollTimeoutIdsRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  const styles = useThemedStyles(({ colors, spacing }) => ({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    scroll: {
      flex: 1,
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

  const performScroll = useCallback(
    (wrapRef: View | null, keyboardBlock: number) => {
      if (!wrapRef || !contentRef.current || keyboardBlock <= 0) return;

      const viewportHeight = viewportHeightRef.current;
      if (viewportHeight <= 0) return;

      wrapRef.measureLayout(
        contentRef.current,
        (_x, y, _width, height) => {
          const margin = 24;
          const footerBlock = footer ? FOOTER_SCROLL_CLEARANCE : 0;
          const visibleHeight = viewportHeight - keyboardBlock - footerBlock - margin;
          const targetScrollY = y + height - visibleHeight;

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
      scheduleDelayedRuns(() => performScroll(wrapRef, keyboardHeightRef.current));
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
        scheduleDelayedRuns(() => performScroll(pending, height));
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
            (footer ? FOOTER_SCROLL_CLEARANCE : 0) +
            keyboardHeight,
        },
      ]}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
      automaticallyAdjustKeyboardInsets={Platform.OS === 'ios' && !footer}
      showsVerticalScrollIndicator={false}>
      <View ref={contentRef} style={[styles.body, contentStyle]} collapsable={false}>
        {children}
      </View>
    </ScrollView>
  );

  const shell = footer ? (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      {scrollView}
      <View style={[styles.footer, { paddingBottom: footerPaddingBottom }]}>
        {footer}
      </View>
    </KeyboardAvoidingView>
  ) : Platform.OS === 'android' ? (
    <KeyboardAvoidingView style={styles.container} behavior="height">
      {scrollView}
    </KeyboardAvoidingView>
  ) : (
    <View style={styles.container}>{scrollView}</View>
  );

  return (
    <FormScrollContext.Provider value={{ scrollWrapIntoView: scheduleScrollIntoView }}>
      {shell}
    </FormScrollContext.Provider>
  );
}
