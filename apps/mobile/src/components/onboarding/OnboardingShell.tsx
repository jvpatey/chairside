import { ReactNode, useEffect, useState } from 'react';
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

type OnboardingShellProps = {
  children: ReactNode;
  footer?: ReactNode;
  contentStyle?: StyleProp<ViewStyle>;
};

export function OnboardingShell({ children, footer, contentStyle }: OnboardingShellProps) {
  const insets = useSafeAreaInsets();
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
      paddingTop: spacing.sm,
      backgroundColor: colors.background,
    },
    footerBorder: {
      borderTopWidth: 1,
      borderTopColor: colors.separator,
    },
  }));

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSubscription = Keyboard.addListener(showEvent, (event) => {
      setKeyboardHeight(event.endCoordinates.height);
    });
    const hideSubscription = Keyboard.addListener(hideEvent, () => {
      setKeyboardHeight(0);
    });

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  const footerPaddingBottom = footer
    ? Math.max(insets.bottom, spacing.sm)
    : insets.bottom + spacing.md;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: insets.top + 16,
            paddingBottom: spacing.xl + (footer ? 0 : insets.bottom),
          },
        ]}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        automaticallyAdjustKeyboardInsets={Platform.OS === 'ios'}
        showsVerticalScrollIndicator={false}>
        <View style={[styles.body, contentStyle]}>{children}</View>
        {keyboardHeight > 0 ? <View style={{ height: keyboardHeight * 0.35 }} /> : null}
      </ScrollView>
      {footer ? (
        <View style={[styles.footer, styles.footerBorder, { paddingBottom: footerPaddingBottom }]}>
          {footer}
        </View>
      ) : null}
    </KeyboardAvoidingView>
  );
}
