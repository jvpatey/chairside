import { ReactNode, useCallback, useState, type RefObject } from 'react';
import {
  Platform,
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
import { PageHeader, type PageHeaderVariant } from '@/components/ui/PageHeader';
import { WebPageEnter } from '@/components/ui/WebPageEnter';
import { useShellAtmosphere, useTabAtmosphere, useTabAtmosphereAccent } from '@/contexts/TabAtmosphereContext';
import { WEB_SIDEBAR_OUTER_INSET } from '@/lib/breakpoints';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';
import { webScrollbarStyles } from '@/lib/webScrollbarStyles';
import { useTheme, useThemedStyles } from '@/theme';
import { webStickyHeaderGlass, webTransition, webTypography } from '@/theme/web';

const HEADER_SCROLL_THRESHOLD = 8;
const HEADER_GLASS_RAMP = 56;

export type ScreenProps = {
  eyebrow?: string;
  title?: string;
  subtitle?: string;
  children?: ReactNode;
  showHeader?: boolean;
  showNotifications?: boolean;
  onBack?: () => void;
  backLabel?: string;
  headerAccessory?: ReactNode;
  headerVariant?: PageHeaderVariant;
  constrainWidth?: boolean;
  scroll?: boolean;
  scrollEnabled?: boolean;
  fillsContainer?: boolean;
  animateEntry?: boolean;
  transparentBackground?: boolean;
  hideAtmosphere?: boolean;
  contentContainerStyle?: StyleProp<ViewStyle>;
  scrollRef?: RefObject<ScrollView | null>;
  scrollContentRef?: RefObject<View | null>;
};

function headerGlassProgress(scrollY: number) {
  if (scrollY <= HEADER_SCROLL_THRESHOLD) return 0;
  return Math.min((scrollY - HEADER_SCROLL_THRESHOLD) / HEADER_GLASS_RAMP, 1);
}

function resolveHeaderVariant(
  explicit: PageHeaderVariant | undefined,
  isTablet: boolean,
  onBack: (() => void) | undefined,
  showHeader: boolean,
): PageHeaderVariant {
  if (explicit) return explicit;
  if (!showHeader) return 'hub';
  if (onBack) return 'detail';
  if (isTablet) return 'tabletSection';
  return 'hub';
}

/** Web Screen with sticky header and refined typography. */
export function Screen({
  eyebrow,
  title,
  subtitle,
  children,
  showHeader = true,
  showNotifications = true,
  onBack,
  backLabel = 'Back',
  headerAccessory,
  headerVariant,
  constrainWidth = true,
  scroll = true,
  scrollEnabled = true,
  fillsContainer = false,
  animateEntry = true,
  transparentBackground = false,
  hideAtmosphere = false,
  contentContainerStyle,
  scrollRef,
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
  const variant = resolveHeaderVariant(headerVariant, isTablet, onBack, showHeader);
  const tabDockInset = useMobileTabDockInset();
  const tabAtmosphere = useTabAtmosphere();
  const tabAtmosphereAccent = useTabAtmosphereAccent();
  const shellAtmosphere = useShellAtmosphere();
  const showAtmosphere = tabAtmosphere !== 'none' && !hideAtmosphere && !shellAtmosphere;
  const atmosphereLayer =
    showAtmosphere && Platform.OS === 'web' ? (
      <AppAtmosphere intensity={tabAtmosphere} accent={tabAtmosphereAccent} />
    ) : null;
  const passThroughAtmosphere = showAtmosphere || shellAtmosphere;
  const containerBackground =
    passThroughAtmosphere || transparentBackground ? 'transparent' : colors.backgroundGrouped;
  const showTopBar = showHeader || showNotifications || Boolean(headerAccessory) || Boolean(onBack);
  const topPadding = isTablet && !showHeader ? WEB_SIDEBAR_OUTER_INSET : insets.top + 16;

  const styles = useThemedStyles(({ colors, spacing }) => ({
    container: {
      flex: 1,
      minHeight: 0,
      overflow: 'hidden',
      flexDirection: 'column' as const,
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
    staticHeader: {
      flexShrink: 0,
      paddingTop: insets.top + spacing.sm,
      paddingBottom: spacing.sm,
      paddingHorizontal: spacing.lg,
      backgroundColor: 'transparent',
    },
    tabletSubtitle: {
      ...webTypography.subtitle,
      fontSize: 15,
      color: colors.labelSecondary,
      marginBottom: spacing.md,
    },
  }));

  const scrollPaddingStyle = {
    paddingBottom: spacing.lg + tabDockInset,
  };

  const staticPaddingStyle = {
    paddingTop: showTopBar ? spacing.md : topPadding,
    paddingBottom: spacing.lg + tabDockInset,
  };

  const pageHeader = showTopBar ? (
    <View style={styles.stickyInner}>
      <PageHeader
        eyebrow={eyebrow}
        title={showHeader ? title : undefined}
        subtitle={variant === 'tabletSection' ? undefined : showHeader ? subtitle : undefined}
        onBack={onBack}
        backLabel={backLabel}
        trailing={headerAccessory}
        showNotifications={showNotifications}
        variant={variant}
      />
    </View>
  ) : null;

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
      {pageHeader}
    </View>
  ) : null;

  const staticHeaderBlock = showTopBar ? (
    <View style={styles.staticHeader}>{pageHeader}</View>
  ) : null;

  const tabletSubtitleBlock =
    variant === 'tabletSection' && showHeader && subtitle ? (
      <Text style={styles.tabletSubtitle}>{subtitle}</Text>
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
            {tabletSubtitleBlock}
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
        ref={scrollRef}
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
        <WebPageEnter animate={animateEntry}>
          {tabletSubtitleBlock}
          {children}
        </WebPageEnter>
      </ScrollView>
    </View>
  );
}
