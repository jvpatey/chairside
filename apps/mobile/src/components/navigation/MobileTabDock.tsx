import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { BottomTabBarHeightCallbackContext } from '@react-navigation/bottom-tabs';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { usePathname } from 'expo-router';
import { useContext, useEffect } from 'react';
import { Platform, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

import { MOBILE_TAB_ORDER } from '@/components/navigation/tabOrder';
import { handleTabBarPress } from '@/components/navigation/handleTabBarPress';
import { LiquidGlassSurface } from '@/components/ui/LiquidGlassSurface';
import { SlidingSegmentIndicator } from '@/components/ui/SlidingSegmentIndicator';
import { useResolvedTabBarFocus } from '@/hooks/useResolvedTabBarFocus';
import { useSlidingSegmentIndicator } from '@/hooks/useSlidingSegmentIndicator';
import { getTabAccentForName } from '@/lib/tabAtmosphereRoutes';
import { webPointer } from '@/lib/webPressableStyles';
import { fontSemibold, getGlassTokens, getTabIndicatorGradient, useTheme, useThemedStyles } from '@/theme';

const PRESS_SPRING = { damping: 15, stiffness: 400 } as const;
const ICON_ONLY_BREAKPOINT = 360;
/** Outer glass shell — end tabs use a matching inner radius on the dock-facing edge. */
const DOCK_SHELL_RADIUS = 30;
const TAB_INDICATOR_RADIUS = 18;

function getDockIndicatorCornerRadii(
  index: number,
  count: number,
  tabRadius: number,
  endRadius: number,
) {
  const isFirst = index <= 0;
  const isLast = index >= count - 1;
  const leftRadius = isFirst ? endRadius : tabRadius;
  const rightRadius = isLast ? endRadius : tabRadius;

  return {
    borderTopLeftRadius: leftRadius,
    borderBottomLeftRadius: leftRadius,
    borderTopRightRadius: rightRadius,
    borderBottomRightRadius: rightRadius,
  };
}

type MobileTabDockProps = BottomTabBarProps & {
  role: 'worker' | 'clinic';
};

function getVisibleRoutes(
  state: BottomTabBarProps['state'],
  descriptors: BottomTabBarProps['descriptors'],
  role: 'worker' | 'clinic',
) {
  const order = MOBILE_TAB_ORDER[role];

  return state.routes
    .filter((route) => typeof descriptors[route.key]?.options?.tabBarIcon === 'function')
    .filter((route) => order.includes(route.name))
    .sort((a, b) => {
      const aIndex = order.indexOf(a.name);
      const bIndex = order.indexOf(b.name);
      if (aIndex === -1 && bIndex === -1) return 0;
      if (aIndex === -1) return 1;
      if (bIndex === -1) return -1;
      return aIndex - bIndex;
    });
}

function formatBadge(value: number | string): string {
  if (typeof value === 'number' && value > 99) return '99+';
  return String(value);
}

type DockTabItemProps = {
  route: BottomTabBarProps['state']['routes'][number];
  index: number;
  isFocused: boolean;
  showLabels: boolean;
  options: BottomTabBarProps['descriptors'][string]['options'];
  colors: ReturnType<typeof useTheme>['colors'];
  styles: ReturnType<typeof useThemedStyles<Record<string, object>>>;
  onSegmentLayout: (index: number, layout: { x: number; y: number; width: number; height: number }) => void;
  onPress: () => void;
  onLongPress: () => void;
  isWeb: boolean;
};

function DockTabItem({
  route,
  index,
  isFocused,
  showLabels,
  options,
  colors,
  styles,
  onSegmentLayout,
  onPress,
  onLongPress,
  isWeb,
}: DockTabItemProps) {
  const tabAccent = getTabAccentForName(route.name);
  const activeColor = isFocused ? colors.primaryOnPrimary : colors.tabInactive;
  const color = activeColor;
  const accessibilityLabel = options.tabBarAccessibilityLabel ?? options.title ?? route.name;
  const label = options.title ?? route.name;
  const badge = options.tabBarBadge;
  const hasBadge = badge != null && badge !== 0 && badge !== '0';
  const iconScale = useSharedValue(isFocused ? 1.08 : 1);

  useEffect(() => {
    iconScale.value = withSpring(isFocused ? 1.08 : 1, PRESS_SPRING);
  }, [iconScale, isFocused]);

  const iconAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: iconScale.value }],
  }));

  return (
    <Pressable
      key={route.key}
      onLayout={(event) => {
        const { x, y, width, height } = event.nativeEvent.layout;
        onSegmentLayout(index, { x, y, width, height });
      }}
      accessibilityRole="button"
      accessibilityState={isFocused ? { selected: true } : {}}
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      onLongPress={onLongPress}
      style={({ pressed, hovered }) => [
        styles.item,
        isWeb && hovered && !pressed && !isFocused && styles.itemHovered,
        pressed && styles.itemPressed,
      ]}>
      <Animated.View style={[styles.iconWrap, iconAnimatedStyle]}>
        {options.tabBarIcon?.({ focused: isFocused, color, size: 20 })}
        {hasBadge ? (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{formatBadge(badge)}</Text>
          </View>
        ) : null}
      </Animated.View>
      {showLabels ? (
        <Text
          style={[
            styles.label,
            isFocused && [styles.labelActive, { color: activeColor }],
          ]}
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.85}>
          {label}
        </Text>
      ) : null}
    </Pressable>
  );
}

export function MobileTabDock({ state, descriptors, navigation, insets, role }: MobileTabDockProps) {
  const { colors, isDark, spacing } = useTheme();
  const pathname = usePathname();
  const { width: windowWidth } = useWindowDimensions();
  const showLabels = windowWidth >= ICON_ONLY_BREAKPOINT;
  const isWeb = Platform.OS === 'web';
  const onHeightChange = useContext(BottomTabBarHeightCallbackContext);
  const visibleRoutes = getVisibleRoutes(state, descriptors, role);
  const { indicatorIndex, isRouteFocused } = useResolvedTabBarFocus(state, visibleRoutes, role);
  const { animatedStyle: indicatorStyle, onSegmentLayout } = useSlidingSegmentIndicator(
    indicatorIndex,
  );
  const focusedRoute = visibleRoutes[indicatorIndex];
  const focusedAccent = focusedRoute ? getTabAccentForName(focusedRoute.name) : 'primary';
  const indicatorGradient = getTabIndicatorGradient(colors, isDark, focusedAccent);
  const dockInset = spacing.xs;
  const dockEndRadius = DOCK_SHELL_RADIUS - dockInset;
  const indicatorCornerStyle = getDockIndicatorCornerRadii(
    indicatorIndex,
    visibleRoutes.length,
    TAB_INDICATOR_RADIUS,
    dockEndRadius,
  );

  const styles = useThemedStyles(({ colors, spacing, isDark }) => {
    const dockInset = spacing.xs;

    return {
    outer: {
      paddingHorizontal: spacing.sm,
      paddingTop: spacing.sm,
      paddingBottom: Math.max(insets.bottom, spacing.sm),
      backgroundColor: 'transparent',
    },
    dock: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 4,
      paddingHorizontal: spacing.xs,
      paddingVertical: spacing.xs,
      position: 'relative',
    },
    dockElevated: Platform.select({
      ios: {
        shadowColor: '#1A6FD4',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: isDark ? 0.28 : 0.14,
        shadowRadius: 24,
      },
      android: {
        elevation: 10,
      },
      default: {},
    }),
    indicator: {
      position: 'absolute',
      top: dockInset,
      left: 0,
      overflow: 'hidden',
    },
    indicatorGradient: {
      ...StyleSheet.absoluteFillObject,
    },
    item: {
      flex: 1,
      minHeight: 54,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: TAB_INDICATOR_RADIUS,
      paddingHorizontal: 4,
      paddingVertical: spacing.xs,
      gap: 2,
      ...webPointer(),
    },
    itemHovered: {
      backgroundColor: colors.fillSubtle,
    },
    itemPressed: {
      opacity: 0.88,
    },
    iconWrap: {
      position: 'relative',
      alignItems: 'center',
      justifyContent: 'center',
    },
    label: {
      fontSize: 10,
      fontWeight: '500',
      color: colors.tabInactive,
      textAlign: 'center',
    },
    labelActive: {
      fontWeight: '600',
    },
    badge: {
      position: 'absolute',
      top: -6,
      right: -10,
      minWidth: 16,
      height: 16,
      borderRadius: 8,
      paddingHorizontal: 4,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.destructive,
      borderWidth: 1.5,
      borderColor: getGlassTokens(isDark).fallbackBackground,
    },
    badgeText: {
      fontSize: 9,
      fontWeight: '700',
      color: '#FFFFFF',
    },
  };
  });

  return (
    <View
      style={styles.outer}
      pointerEvents="box-none"
      onLayout={(event) => onHeightChange?.(event.nativeEvent.layout.height)}>
      <LiquidGlassSurface borderRadius={DOCK_SHELL_RADIUS} style={[styles.dock, styles.dockElevated]}>
        <SlidingSegmentIndicator
          animatedStyle={indicatorStyle}
          style={[styles.indicator, indicatorCornerStyle]}
        >
          <LinearGradient colors={indicatorGradient} style={styles.indicatorGradient} />
        </SlidingSegmentIndicator>
        {visibleRoutes.map((route, index) => {
          const { options } = descriptors[route.key];
          const routeIndex = state.routes.findIndex((item) => item.key === route.key);
          const isFocused = isRouteFocused(route.name, routeIndex);

          const onPress = () => {
            void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            handleTabBarPress({
              route,
              navigation,
              state,
              isFocused,
              pathname,
              role,
            });
          };

          const onLongPress = () => {
            navigation.emit({
              type: 'tabLongPress',
              target: route.key,
            });
          };

          return (
            <DockTabItem
              key={route.key}
              route={route}
              index={index}
              isFocused={isFocused}
              showLabels={showLabels}
              options={options}
              colors={colors}
              styles={styles}
              onSegmentLayout={onSegmentLayout}
              onPress={onPress}
              onLongPress={onLongPress}
              isWeb={isWeb}
            />
          );
        })}
      </LiquidGlassSurface>
    </View>
  );
}
