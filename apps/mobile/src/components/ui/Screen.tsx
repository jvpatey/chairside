import { ReactNode } from 'react';
import { ScrollView, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { NotificationBell } from '@/components/notifications/NotificationBell';
import { TABLET_TOP_INSET_EXTRA } from '@/lib/breakpoints';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';
import { useThemedStyles } from '@/theme';

type ScreenProps = {
  title?: string;
  subtitle?: string;
  children?: ReactNode;
  showHeader?: boolean;
  showNotifications?: boolean;
  /** Renders in the top header row, left of the notification bell. */
  headerAccessory?: ReactNode;
  /** When true (default), constrain and center content on tablet widths. */
  constrainWidth?: boolean;
  contentContainerStyle?: StyleProp<ViewStyle>;
};

export function Screen({
  title,
  subtitle,
  children,
  showHeader = true,
  showNotifications = true,
  headerAccessory,
  constrainWidth = true,
  contentContainerStyle,
}: ScreenProps) {
  const insets = useSafeAreaInsets();
  const { contentMaxWidth, isTablet } = useResponsiveLayout();
  const showTopBar = showHeader || showNotifications || Boolean(headerAccessory);
  const topPadding =
    isTablet && !showHeader ? insets.top + TABLET_TOP_INSET_EXTRA : insets.top + 16;

  const styles = useThemedStyles(({ colors, spacing, typography }) => ({
    container: {
      flex: 1,
      backgroundColor: colors.backgroundGrouped,
    },
    content: {
      flexGrow: 1,
      paddingHorizontal: spacing.lg,
      width: '100%',
      ...(constrainWidth && contentMaxWidth
        ? { maxWidth: contentMaxWidth, alignSelf: 'center' as const }
        : {}),
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
    headerActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    headerHidden: {
      marginBottom: 0,
    },
    headerCompact: {
      marginBottom: spacing.sm,
    },
    title: typography.title,
    subtitle: typography.subtitle,
  }));

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[
        styles.content,
        { paddingTop: topPadding, paddingBottom: insets.bottom + 24 },
        contentContainerStyle,
      ]}
    >
      <View
        style={[
          styles.header,
          !showTopBar && styles.headerHidden,
          !showHeader && showTopBar && styles.headerCompact,
        ]}
      >
        {showTopBar ? (
          <View style={styles.headerRow}>
            {showHeader ? (
              <View style={styles.headerText}>
                {title ? <Text style={styles.title}>{title}</Text> : null}
                {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
              </View>
            ) : (
              <View style={styles.headerText} />
            )}
            {headerAccessory || showNotifications ? (
              <View style={styles.headerActions}>
                {headerAccessory}
                {showNotifications ? <NotificationBell /> : null}
              </View>
            ) : null}
          </View>
        ) : null}
      </View>
      {children}
    </ScrollView>
  );
}
