import { ReactNode } from 'react';
import { ScrollView, View, type StyleProp, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useThemedStyles } from '@/theme';

type OnboardingShellProps = {
  children: ReactNode;
  footer?: ReactNode;
  contentStyle?: StyleProp<ViewStyle>;
};

export function OnboardingShell({ children, footer, contentStyle }: OnboardingShellProps) {
  const insets = useSafeAreaInsets();
  const styles = useThemedStyles(({ colors, spacing }) => ({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    content: {
      flexGrow: 1,
      paddingHorizontal: spacing.lg,
    },
    body: {
      flex: 1,
    },
    footer: {
      paddingBottom: spacing.sm,
    },
  }));

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[
        styles.content,
        {
          paddingTop: insets.top + 16,
          paddingBottom: insets.bottom + 16,
          minHeight: '100%',
        },
      ]}
      keyboardShouldPersistTaps="handled">
      <View style={[styles.body, contentStyle]}>{children}</View>
      {footer ? <View style={styles.footer}>{footer}</View> : null}
    </ScrollView>
  );
}
