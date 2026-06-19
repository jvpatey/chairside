import { ReactNode } from 'react';
import { Platform, Pressable, ScrollView, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useMobileTabDockInset } from '@/components/navigation/mobileTabDockInset';
import { AppAtmosphere } from '@/components/navigation/AppAtmosphere';
import { NotificationBell } from '@/components/notifications/NotificationBell';
import { WebPageEnter } from '@/components/ui/WebPageEnter';
import { useTabAtmosphere, useTabAtmosphereAccent } from '@/contexts/TabAtmosphereContext';
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
  /** Disable scrolling while keeping the ScrollView layout shell. */
  scrollEnabled?: boolean;
  /** Fills available height; use with scroll={false} in master/detail panes. */
  fillsContainer?: boolean;
  /** When false, skip the web fade-in animation (split-view / tab surfaces). */
  animateEntry?: boolean;
  /** When true, the screen background is transparent (for layered dashboard atmosphere). */
  transparentBackground?: boolean;
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
  scrollEnabled = true,
  fillsContainer = false,
  animateEntry = true,
  transparentBackground = false,
  contentContainerStyle,
}: ScreenProps) {
  const insets = useSafeAreaInsets();
  const { colors, spacing } = useTheme();
  const { contentMaxWidth, isTablet } = useResponsiveLayout();
  const tabDockInset = useMobileTabDockInset();
  const tabAtmosphere = useTabAtmosphere();
  const tabAtmosphereAccent = useTabAtmosphereAccent();
  const showAtmosphere = tabAtmosphere !== 'none';
  // Web tab scenes are opaque (see useAdaptiveTabScreenOptions); paint atmosphere per screen.
  const atmosphereLayer =
    showAtmosphere && Platform.OS === 'web'
      ? <AppAtmosphere intensity={tabAtmosphere} accent={tabAtmosphereAccent} />
      : null;
  const containerBackground =
    showAtmosphere || transparentBackground ? 'transparent' : colors.backgroundGrouped;
  const showTopBar = showHeader || showNotifications || Boolean(headerAccessory);
  const topPadding =
    isTablet && !showHeader ? insets.top + TABLET_TOP_INSET_EXTRA : insets.top + 16;

  const styles = useThemedStyles(({ colors, spacing, typography }) => ({
    container: {
      flex: 1,
      overflow: 'hidden',
    },
    content: {
      flexGrow: fillsContainer ? 1 : undefined,
      paddingHorizontal: spacing.lg,
      width: '100%',
      ...(constrainWidth && contentMaxWidth
        ? { maxWidth: contentMaxWidth, alignSelf: 'center' as const }
        : {}),
    },
    contentFill: {
      flex: 1,
      minHeight: 0,
      flexDirection: 'column',
    },
    body: {
      flex: fillsContainer ? 1 : undefined,
      minHeight: fillsContainer ? 0 : undefined,
      width: fillsContainer ? '100%' : undefined,
      flexDirection: fillsContainer ? ('column' as const) : undefined,
    },
    header: {
      gap: spacing.sm,
      marginBottom: spacing.lg,
      ...(fillsContainer ? { flexShrink: 0 } : {}),
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
    paddingBottom: spacing.lg + tabDockInset,
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
      <View
        style={[
          styles.container,
          { backgroundColor: containerBackground },
          fillsContainer && { minHeight: 0 },
        ]}>
        {atmosphereLayer}
        <WebPageEnter
          animate={animateEntry}
          style={fillsContainer ? { flex: 1, minHeight: 0 } : { flex: 1 }}>
          <View
            style={[
              styles.content,
              paddingStyle,
              fillsContainer && styles.contentFill,
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
    <View style={[styles.container, { backgroundColor: containerBackground }]}>
      {atmosphereLayer}
      <ScrollView
        scrollEnabled={scrollEnabled}
        style={[
          { flex: 1, backgroundColor: showAtmosphere ? 'transparent' : colors.backgroundGrouped },
          webScrollbarStyles(),
        ]}
        contentContainerStyle={[styles.content, paddingStyle, contentContainerStyle]}
      >
        <WebPageEnter animate={animateEntry}>
          {headerBlock}
          {children}
        </WebPageEnter>
      </ScrollView>
    </View>
  );
}
