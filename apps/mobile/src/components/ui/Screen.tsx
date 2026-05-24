import { ReactNode } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { NotificationBell } from '@/components/notifications/NotificationBell';
import { useThemedStyles } from '@/theme';

type ScreenProps = {
  title?: string;
  subtitle?: string;
  children?: ReactNode;
  showHeader?: boolean;
  showNotifications?: boolean;
};

export function Screen({
  title,
  subtitle,
  children,
  showHeader = true,
  showNotifications = true,
}: ScreenProps) {
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
    headerRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      gap: spacing.sm,
    },
    headerText: { flex: 1, gap: spacing.sm },
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
        {showHeader && (title || showNotifications) ? (
          <View style={styles.headerRow}>
            <View style={styles.headerText}>
              {title ? <Text style={styles.title}>{title}</Text> : null}
              {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
            </View>
            {showNotifications ? <NotificationBell /> : null}
          </View>
        ) : null}
      </View>
      {children}
    </ScrollView>
  );
}
