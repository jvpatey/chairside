import { ReactNode } from 'react';
import { Pressable, ScrollView, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useMobileTabDockInset } from '@/components/navigation/mobileTabDockInset';
import { NotificationBell } from '@/components/notifications/NotificationBell';
import { WebPageEnter } from '@/components/ui/WebPageEnter';
import { TABLET_TOP_INSET_EXTRA } from '@/lib/breakpoints';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';
import { webHover, webPointer, webTextLinkHoverStyles } from '@/lib/webPressableStyles';
import { webScrollbarStyles } from '@/lib/webScrollbarStyles';
import { useTheme, useThemedStyles } from '@/theme';

type ScreenProps = {
  title?: string;
  subtitle?: string;
  children?: ReactNode;
  showHeader?: boolean;
  showNotifications?: boolean;
  onBack?: () => void;
  backLabel?: string;
  /** Renders in the top header row, left of the notification bell. */
  headerAccessory?: ReactNode;
  /** When true (default), constrain and center content on tablet widths. */
  constrainWidth?: boolean;
  /** When false, use a flex container instead of ScrollView (split-view panes). */
  scroll?: boolean;
  /** Fills available height; use with scroll={false} in master/detail panes. */
  fillsContainer?: boolean;
  /** When false, skip the web fade-in animation (split-view / tab surfaces). */
  animateEntry?: boolean;
  contentContainerStyle?: StyleProp<ViewStyle>;
};

export function Screen({
  title,
  subtitle,
  children,
  showHeader = true,
  showNotifications = true,
  onBack,
  backLabel = 'Back',
  headerAccessory,
  constrainWidth = true,
  scroll = true,
  fillsContainer = false,
  animateEntry = true,
  contentContainerStyle,
}: ScreenProps) {
  const insets = useSafeAreaInsets();
  const { spacing } = useTheme();
  const { contentMaxWidth, isTablet } = useResponsiveLayout();
  const tabDockInset = useMobileTabDockInset();
  const showTopBar = showHeader || showNotifications || Boolean(headerAccessory);
  const topPadding =
    isTablet && !showHeader ? insets.top + TABLET_TOP_INSET_EXTRA : insets.top + 16;

  const styles = useThemedStyles(({ colors, spacing, typography }) => ({
    container: {
      flex: 1,
      backgroundColor: colors.backgroundGrouped,
    },
    content: {
      flexGrow: fillsContainer ? 1 : undefined,
      paddingHorizontal: spacing.lg,
      width: '100%',
      ...(constrainWidth && contentMaxWidth
        ? { maxWidth: contentMaxWidth, alignSelf: 'center' as const }
        : {}),
    },
    body: {
      flex: fillsContainer ? 1 : undefined,
      minHeight: fillsContainer ? 0 : undefined,
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
    headerText: { flex: 1, minWidth: 0, gap: spacing.sm },
    titleFlex: { flex: 1, minWidth: 0 },
    headerActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      flexShrink: 0,
    },
    headerHidden: {
      marginBottom: 0,
    },
    headerCompact: {
      marginBottom: spacing.sm,
    },
    title: typography.title,
    subtitle: {
      ...typography.subtitle,
      width: '100%',
    },
    back: {
      alignSelf: 'flex-start',
      paddingVertical: spacing.xs,
      minHeight: 44,
      justifyContent: 'center',
      paddingHorizontal: spacing.xs,
      marginLeft: -spacing.xs,
      borderRadius: 8,
      ...webPointer(),
    },
    backHovered: webTextLinkHoverStyles(colors),
    backText: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.primary,
    },
  }));

  const paddingStyle = {
    paddingTop: topPadding,
    paddingBottom: (fillsContainer ? spacing.md : 24) + tabDockInset,
  };

  const headerBlock = (
    <View
      style={[
        styles.header,
        !showTopBar && styles.headerHidden,
        !showHeader && showTopBar && styles.headerCompact,
      ]}
    >
      {onBack ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={backLabel}
          onPress={onBack}
          style={({ pressed, hovered }) => [
            styles.back,
            webHover(hovered, pressed, styles.backHovered),
            pressed && { opacity: 0.75 },
          ]}>
          <Text style={styles.backText}>{backLabel}</Text>
        </Pressable>
      ) : null}
      {showTopBar ? (
        <>
          <View style={styles.headerRow}>
            {showHeader && title ? (
              <Text style={[styles.title, styles.titleFlex]}>{title}</Text>
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
          {showHeader && subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </>
      ) : null}
    </View>
  );

  if (!scroll) {
    return (
      <View style={[styles.container, fillsContainer && { minHeight: 0 }]}>
        <WebPageEnter
          animate={animateEntry}
          style={fillsContainer ? { flex: 1, minHeight: 0 } : undefined}>
          <View
            style={[
              styles.content,
              paddingStyle,
              fillsContainer && { flex: 1, minHeight: 0 },
              contentContainerStyle,
            ]}
          >
            {headerBlock}
            <View style={styles.body}>{children}</View>
          </View>
        </WebPageEnter>
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, webScrollbarStyles()]}
      contentContainerStyle={[
        styles.content,
        paddingStyle,
        contentContainerStyle,
      ]}
    >
      <WebPageEnter animate={animateEntry}>
        {headerBlock}
        {children}
      </WebPageEnter>
    </ScrollView>
  );
}
