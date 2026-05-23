import { ReactNode } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useThemedStyles } from '@/theme';

type ScreenProps = {
  title?: string;
  subtitle?: string;
  children?: ReactNode;
  showHeader?: boolean;
};

export function Screen({ title, subtitle, children, showHeader = true }: ScreenProps) {
  const insets = useSafeAreaInsets();
  const styles = useThemedStyles(({ colors, spacing, typography }) => ({
    container: {
      flex: 1,
      backgroundColor: colors.backgroundGrouped,
    },
    content: {
      flexGrow: 1,
      paddingHorizontal: spacing.lg,
    },
    header: {
      gap: spacing.sm,
      marginBottom: spacing.lg,
    },
    headerHidden: {
      marginBottom: 0,
    },
    title: typography.title,
    subtitle: typography.subtitle,
  }));

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 24 },
      ]}>
      <View style={[styles.header, !showHeader && styles.headerHidden]}>
        {showHeader && title ? <Text style={styles.title}>{title}</Text> : null}
        {showHeader && subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      {children}
    </ScrollView>
  );
}
