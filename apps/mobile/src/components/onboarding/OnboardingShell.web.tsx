import {
  createContext,
  ReactNode,
  useContext,
} from 'react';
import { ScrollView, View, type StyleProp, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AuthWebSplitLayout } from '@/components/web/auth/AuthWebSplitLayout.web';
import { OnboardingWebCenteredLayout } from '@/components/onboarding/OnboardingWebCenteredLayout.web';
import { WebPageEnter } from '@/components/ui/WebPageEnter';
import { webScrollbarStyles } from '@/lib/webScrollbarStyles';
import { useTheme, useThemedStyles } from '@/theme';

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
  authSplit = false,
  webLayout = 'default',
  brandHeadline,
  brandSubtitle,
  brandVisual,
}: OnboardingShellProps) {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const styles = useThemedStyles(({ spacing }) => ({
    container: {
      flex: 1,
      backgroundColor: colors.backgroundGrouped,
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
      backgroundColor: colors.background,
    },
  }));

  const body = (
    <View style={[styles.body, contentStyle]} collapsable={false}>
      <WebPageEnter style={styles.body}>{children}</WebPageEnter>
    </View>
  );

  if (webLayout === 'centeredDecision') {
    return (
      <FormScrollContext.Provider value={{ scrollWrapIntoView: () => {} }}>
        <OnboardingWebCenteredLayout footer={footer}>{body}</OnboardingWebCenteredLayout>
      </FormScrollContext.Provider>
    );
  }

  if (authSplit) {
    return (
      <FormScrollContext.Provider value={{ scrollWrapIntoView: () => {} }}>
        <AuthWebSplitLayout
          footer={footer}
          brandHeadline={brandHeadline}
          brandSubtitle={brandSubtitle}
          brandVisual={brandVisual}
        >
          {body}
        </AuthWebSplitLayout>
      </FormScrollContext.Provider>
    );
  }

  return (
    <FormScrollContext.Provider value={{ scrollWrapIntoView: () => {} }}>
      <View style={styles.container}>
        <ScrollView
          style={[styles.scroll, webScrollbarStyles()]}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {body}
        </ScrollView>
        {footer ? <View style={styles.footerInner}>{footer}</View> : null}
      </View>
    </FormScrollContext.Provider>
  );
}
