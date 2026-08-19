import { ReactNode, type RefObject } from 'react';
import {
  Platform,
  ScrollView,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useMobileTabDockInset } from '@/components/navigation/mobileTabDockInset';
import { AppAtmosphere } from '@/components/navigation/AppAtmosphere';
import { PageHeader, PageHeaderCompactBar, type PageHeaderVariant } from '@/components/ui/PageHeader';
import { AppText } from '@/components/ui/AppText';
import { ThemedRefreshControl } from '@/components/ui/ThemedRefreshControl';
import { WebPageEnter } from '@/components/ui/WebPageEnter';
import { useTabAtmosphere, useTabAtmosphereAccent } from '@/contexts/TabAtmosphereContext';
import {
  TABLET_TOP_INSET_EXTRA,
  TABLET_TOP_INSET_FALLBACK_IOS,
} from '@/lib/breakpoints';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';
import { webScrollbarStyles } from '@/lib/webScrollbarStyles';
import { colorWithAlpha, useTheme, useThemedStyles, type GradientAccent } from '@/theme';

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
  refreshing?: boolean;
  onRefresh?: () => void;
  refreshAccent?: GradientAccent;
  collapseHeader?: boolean;
  scrollRef?: RefObject<ScrollView | null>;
  scrollContentRef?: RefObject<View | null>;
};

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
  refreshing = false,
  onRefresh,
  refreshAccent,
  collapseHeader = true,
  scrollRef,
  scrollContentRef,
}: ScreenProps) {
  const insets = useSafeAreaInsets();
  const { colors, spacing } = useTheme();
  const { contentMaxWidth, isTablet } = useResponsiveLayout();
  const variant = resolveHeaderVariant(headerVariant, isTablet, onBack, showHeader);
  const collapseLargeTitle =
    collapseHeader && showHeader && Boolean(title) && variant === 'hub';
  const scrollY = useSharedValue(0);
  const onScroll = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });
  const largeTitleStyle = useAnimatedStyle(() => ({
    opacity: collapseLargeTitle
      ? interpolate(scrollY.value, [0, 48, 96], [1, 0.4, 0], Extrapolation.CLAMP)
      : 1,
    transform: [
      {
        translateY: collapseLargeTitle
          ? interpolate(scrollY.value, [0, 96], [0, -6], Extrapolation.CLAMP)
          : 0,
      },
    ],
  }));
  const compactHeaderStyle = useAnimatedStyle(() => ({
    opacity: collapseLargeTitle
      ? interpolate(scrollY.value, [56, 112], [0, 1], Extrapolation.CLAMP)
      : 0,
  }));
  const tabDockInset = useMobileTabDockInset();
  const tabAtmosphere = useTabAtmosphere();
  const tabAtmosphereAccent = useTabAtmosphereAccent();
  const showAtmosphere = tabAtmosphere !== 'none' && !hideAtmosphere;
  const atmosphereLayer = showAtmosphere ? (
    <AppAtmosphere intensity={tabAtmosphere} accent={tabAtmosphereAccent} />
  ) : null;
  const containerBackground =
    showAtmosphere || transparentBackground ? 'transparent' : colors.backgroundGrouped;
  const showTopBar = showHeader || showNotifications || Boolean(headerAccessory) || Boolean(onBack);
  const topPadding = isTablet
    ? Math.max(insets.top, Platform.OS === 'ios' ? TABLET_TOP_INSET_FALLBACK_IOS : 0) +
      TABLET_TOP_INSET_EXTRA
    : insets.top + 16;

  const styles = useThemedStyles(({ spacing }) => ({
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
      marginBottom: spacing.lg,
      ...(fillsContainer ? { flexShrink: 0 } : {}),
    },
    headerHidden: {
      marginBottom: 0,
    },
    headerCompact: {
      marginBottom: spacing.sm,
    },
    tabletSubtitle: {
      marginBottom: spacing.md,
    },
    compactHeader: {
      position: 'absolute' as const,
      top: 0,
      left: 0,
      right: 0,
      zIndex: 20,
      paddingTop: insets.top + spacing.xs,
      paddingBottom: spacing.sm,
      paddingHorizontal: spacing.lg,
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      justifyContent: 'space-between' as const,
      gap: spacing.sm,
      backgroundColor: colorWithAlpha(colors.backgroundGrouped, 0.92),
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.separator,
    },
  }));

  const paddingStyle = {
    paddingTop: topPadding,
    paddingBottom: spacing.lg + tabDockInset,
  };

  const pageHeader = showTopBar ? (
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
  ) : null;

  const tabletSubtitleBlock =
    variant === 'tabletSection' && showHeader && subtitle ? (
      <AppText variant="subtitle" style={styles.tabletSubtitle}>
        {subtitle}
      </AppText>
    ) : null;

  const headerBaseStyle = [
    styles.header,
    !showTopBar && styles.headerHidden,
    !showHeader && showTopBar && styles.headerCompact,
  ];

  const headerBlock = collapseLargeTitle ? (
    <Animated.View style={[...headerBaseStyle, largeTitleStyle]}>{pageHeader}</Animated.View>
  ) : (
    <View style={headerBaseStyle}>{pageHeader}</View>
  );

  const compactHeader =
    collapseLargeTitle && typeof title === 'string' ? (
      <Animated.View style={[styles.compactHeader, compactHeaderStyle]} pointerEvents="none">
        <PageHeaderCompactBar
          title={title}
          showNotifications={showNotifications}
          trailing={headerAccessory}
        />
      </Animated.View>
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
        <WebPageEnter
          animate={animateEntry}
          style={fillsContainer ? { flex: 1, minHeight: 0 } : { flex: 1 }}
        >
          <View
            style={[
              styles.content,
              paddingStyle,
              fillsContainer && styles.contentFill,
              contentContainerStyle,
            ]}
          >
            {headerBlock}
            <View ref={scrollContentRef} style={styles.body}>
              {children}
            </View>
          </View>
        </WebPageEnter>
      </View>
    );
  }

  const scrollViewProps = {
    scrollEnabled,
    refreshControl: onRefresh ? (
      <ThemedRefreshControl
        refreshing={refreshing}
        onRefresh={onRefresh}
        accent={refreshAccent}
      />
    ) : undefined,
    style: [
      { flex: 1, backgroundColor: showAtmosphere ? 'transparent' : colors.backgroundGrouped },
      webScrollbarStyles(),
    ] as StyleProp<ViewStyle>,
    contentContainerStyle: [styles.content, paddingStyle, contentContainerStyle],
    children: (
      <WebPageEnter animate={animateEntry}>
        {headerBlock}
        {tabletSubtitleBlock}
        <View ref={scrollContentRef}>{children}</View>
      </WebPageEnter>
    ),
  };

  return (
    <View style={[styles.container, { backgroundColor: containerBackground }]}>
      {atmosphereLayer}
      {compactHeader}
      {collapseLargeTitle ? (
        <Animated.ScrollView
          ref={scrollRef as RefObject<Animated.ScrollView>}
          {...scrollViewProps}
          onScroll={onScroll}
          scrollEventThrottle={16}
        />
      ) : (
        <ScrollView ref={scrollRef} {...scrollViewProps} />
      )}
    </View>
  );
}
