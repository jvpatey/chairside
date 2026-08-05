import { ReactNode, useCallback, useState } from 'react';
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useMobileTabDockInset } from '@/components/navigation/mobileTabDockInset';
import { AppAtmosphere } from '@/components/navigation/AppAtmosphere';
import { NotificationBell } from '@/components/notifications/NotificationBell';
import { WebPageEnter } from '@/components/ui/WebPageEnter';
import { useShellAtmosphere, useTabAtmosphere, useTabAtmosphereAccent } from '@/contexts/TabAtmosphereContext';
import { WEB_SIDEBAR_OUTER_INSET } from '@/lib/breakpoints';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';
import { webHover, webPointer, webTextLinkHoverStyles } from '@/lib/webPressableStyles';
import { webScrollbarStyles } from '@/lib/webScrollbarStyles';
import { useTheme, useThemedStyles } from '@/theme';
import { webStickyHeaderGlass, webTransition, webTypography } from '@/theme/web';

const HEADER_SCROLL_THRESHOLD = 8;
const HEADER_GLASS_RAMP = 56;

type ScreenProps = {
  title?: string;
  subtitle?: string;
  children?: ReactNode;
  showHeader?: boolean;
  showNotifications?: boolean;
  onBack?: () => void;
  backLabel?: string;
  headerAccessory?: ReactNode;
  constrainWidth?: boolean;
  scroll?: boolean;
  scrollEnabled?: boolean;
  fillsContainer?: boolean;
  animateEntry?: boolean;
  transparentBackground?: boolean;
  /** When true, skip the tab atmosphere layer (e.g. master/detail panes paint their own). */
  hideAtmosphere?: boolean;
  contentContainerStyle?: StyleProp<ViewStyle>;
};

function headerGlassProgress(scrollY: number) {
  if (scrollY <= HEADER_SCROLL_THRESHOLD) return 0;
  return Math.min((scrollY - HEADER_SCROLL_THRESHOLD) / HEADER_GLASS_RAMP, 1);
}

/** Web Screen with sticky header and refined typography. */
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
  hideAtmosphere = false,
  contentContainerStyle,
}: ScreenProps) {
  const insets = useSafeAreaInsets();
  const { colors, spacing, isDark } = useTheme();
  const [scrollY, setScrollY] = useState(0);
  const [headerHeight, setHeaderHeight] = useState(() => insets.top + 84);
  const glassProgress = scroll ? headerGlassProgress(scrollY) : 0;

  const handleScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    setScrollY(event.nativeEvent.contentOffset.y);
  }, []);

  const handleHeaderLayout = useCallback((height: number) => {
    if (height > 0) setHeaderHeight(height);
  }, []);

  const { contentMaxWidth, isTablet } = useResponsiveLayout();
  const tabDockInset = useMobileTabDockInset();
  const tabAtmosphere = useTabAtmosphere();
  const tabAtmosphereAccent = useTabAtmosphereAccent();
  const shellAtmosphere = useShellAtmosphere();
  // Shell owns the wash — skip local gradient, but stay transparent so it shows through.
  const showAtmosphere = tabAtmosphere !== 'none' && !hideAtmosphere && !shellAtmosphere;
  const atmosphereLayer =
    showAtmosphere && Platform.OS === 'web' ? (
      <AppAtmosphere intensity={tabAtmosphere} accent={tabAtmosphereAccent} />
    ) : null;
  const passThroughAtmosphere = showAtmosphere || shellAtmosphere;
  const containerBackground =
    passThroughAtmosphere || transparentBackground ? 'transparent' : colors.backgroundGrouped;
  const showTopBar = showHeader || showNotifications || Boolean(headerAccessory);
  const topPadding = isTablet && !showHeader ? WEB_SIDEBAR_OUTER_INSET : insets.top + 16;

  const styles = useThemedStyles(({ colors, spacing }) => ({
    container: {
      flex: 1,
      overflow: 'hidden',
      position: 'relative' as const,
    },
    overlayHeader: {
      position: 'absolute' as const,
      top: 0,
      left: 0,
      right: 0,
      zIndex: 10,
      paddingTop: insets.top + spacing.sm,
      paddingBottom: spacing.sm,
      paddingHorizontal: spacing.lg,
      ...webTransition(['background-color', 'border-color', 'backdrop-filter']),
    },
    stickyInner: {
      flexDirection: 'row' as const,
      alignItems: 'flex-start' as const,
      justifyContent: 'space-between' as const,
      gap: spacing.sm,
      width: '100%' as const,
      maxWidth: constrainWidth ? contentMaxWidth : undefined,
      alignSelf: 'center' as const,
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
    headerText: { flex: 1, minWidth: 0, gap: spacing.xs },
    title: {
      ...webTypography.title,
      color: colors.labelPrimary,
    },
    subtitle: {
      ...webTypography.subtitle,
      fontSize: 15,
      color: colors.labelSecondary,
    },
    headerActions: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: spacing.sm,
      flexShrink: 0,
    },
    back: {
      alignSelf: 'flex-start' as const,
      paddingVertical: spacing.xs,
      minHeight: 44,
      justifyContent: 'center' as const,
      paddingHorizontal: spacing.xs,
      marginLeft: -spacing.xs,
      marginBottom: spacing.xs,
      borderRadius: 8,
      ...webPointer(),
    },
    backHovered: webTextLinkHoverStyles(colors),
    backText: {
      fontSize: 15,
      fontWeight: '600' as const,
      color: colors.primary,
    },
    staticHeader: {
      paddingTop: insets.top + spacing.sm,
      paddingBottom: spacing.sm,
      paddingHorizontal: spacing.lg,
      backgroundColor: 'transparent',
    },
  }));

  const scrollPaddingStyle = {
    paddingBottom: spacing.lg + tabDockInset,
  };

  const staticPaddingStyle = {
    paddingTop: topPadding,
    paddingBottom: spacing.lg + tabDockInset,
  };

  const headerInner = (
    <View style={styles.stickyInner}>
      <View style={styles.headerText}>
        {onBack ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={backLabel}
            onPress={onBack}
            style={({ pressed, hovered }) => [
              styles.back,
              webHover(hovered, pressed, styles.backHovered),
              pressed && { opacity: 0.75 },
            ]}
          >
            <Text style={styles.backText}>{backLabel}</Text>
          </Pressable>
        ) : null}
        {showHeader && title ? <Text style={styles.title}>{title}</Text> : null}
        {showHeader && subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      {headerAccessory || showNotifications ? (
        <View style={styles.headerActions}>
          {headerAccessory}
          {showNotifications ? <NotificationBell /> : null}
        </View>
      ) : null}
    </View>
  );

  const overlayHeaderBlock = showTopBar ? (
    <View
      onLayout={(event) => handleHeaderLayout(event.nativeEvent.layout.height)}
      style={[
        styles.overlayHeader,
        webStickyHeaderGlass(isDark, glassProgress),
        glassProgress <= 0 && {
          borderBottomWidth: StyleSheet.hairlineWidth,
          borderBottomColor: 'transparent',
        },
      ]}
    >
      {headerInner}
    </View>
  ) : null;

  const staticHeaderBlock = showTopBar ? (
    <View style={styles.staticHeader}>{headerInner}</View>
  ) : null;

  if (!scroll) {
    return (
      <View
        style={[
          styles.container,
          { backgroundColor: containerBackground },
          fillsContainer && { minHeight: 0 },
        ]}
      >
        {atmosphereLayer}
        {staticHeaderBlock}
        <WebPageEnter
          animate={animateEntry}
          style={fillsContainer ? { flex: 1, minHeight: 0 } : { flex: 1 }}
        >
          <View
            style={[
              styles.content,
              staticPaddingStyle,
              fillsContainer && styles.contentFill,
              contentContainerStyle,
            ]}
          >
            <View style={styles.body}>{children}</View>
          </View>
        </WebPageEnter>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: containerBackground }]}>
      {atmosphereLayer}
      {overlayHeaderBlock}
      <ScrollView
        scrollEnabled={scrollEnabled}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        style={[
          {
            flex: 1,
            backgroundColor: passThroughAtmosphere ? 'transparent' : colors.backgroundGrouped,
          },
          webScrollbarStyles(),
        ]}
        contentContainerStyle={[
          styles.content,
          scrollPaddingStyle,
          showTopBar ? { paddingTop: headerHeight + spacing.md } : { paddingTop: topPadding },
          contentContainerStyle,
        ]}
      >
        <WebPageEnter animate={animateEntry}>{children}</WebPageEnter>
      </ScrollView>
    </View>
  );
}
