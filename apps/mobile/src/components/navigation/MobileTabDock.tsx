import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { BottomTabBarHeightCallbackContext } from '@react-navigation/bottom-tabs';
import { CommonActions } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import { useContext } from 'react';
import { Platform, Pressable, Text, View } from 'react-native';

import { MOBILE_TAB_ORDER } from '@/components/navigation/tabOrder';
import { LiquidGlassSurface } from '@/components/ui/LiquidGlassSurface';
import { SlidingSegmentIndicator } from '@/components/ui/SlidingSegmentIndicator';
import { useSlidingSegmentIndicator } from '@/hooks/useSlidingSegmentIndicator';
import { webPointer } from '@/lib/webPressableStyles';
import { getGlassTokens, useTheme, useThemedStyles } from '@/theme';

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

export function MobileTabDock({ state, descriptors, navigation, insets, role }: MobileTabDockProps) {
  const { colors } = useTheme();
  const isWeb = Platform.OS === 'web';
  const onHeightChange = useContext(BottomTabBarHeightCallbackContext);
  const visibleRoutes = getVisibleRoutes(state, descriptors, role);
  const focusedVisibleIndex = visibleRoutes.findIndex(
    (route) => state.routes.findIndex((item) => item.key === route.key) === state.index,
  );
  const { animatedStyle: indicatorStyle, onSegmentLayout } = useSlidingSegmentIndicator(
    focusedVisibleIndex >= 0 ? focusedVisibleIndex : 0,
  );

  const styles = useThemedStyles(({ colors, spacing, isDark }) => ({
    outer: {
      paddingHorizontal: spacing.md,
      paddingTop: spacing.sm,
      paddingBottom: Math.max(insets.bottom, spacing.sm),
      backgroundColor: 'transparent',
    },
    dock: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: spacing.xs,
      paddingHorizontal: spacing.xs,
      paddingVertical: spacing.xs,
      position: 'relative',
    },
    indicator: {
      position: 'absolute',
      top: spacing.xs,
      left: 0,
      borderRadius: 20,
      backgroundColor: colors.primarySubtle,
    },
    item: {
      flex: 1,
      minHeight: 52,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 20,
      paddingHorizontal: spacing.xs,
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
      color: colors.primary,
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
  }));

  return (
    <View
      style={styles.outer}
      pointerEvents="box-none"
      onLayout={(event) => onHeightChange?.(event.nativeEvent.layout.height)}>
      <LiquidGlassSurface borderRadius={28} style={styles.dock}>
        <SlidingSegmentIndicator animatedStyle={indicatorStyle} style={styles.indicator} />
        {visibleRoutes.map((route, index) => {
          const { options } = descriptors[route.key];
          const routeIndex = state.routes.findIndex((item) => item.key === route.key);
          const isFocused = state.index === routeIndex;
          const color = isFocused ? colors.primary : colors.tabInactive;
          const accessibilityLabel =
            options.tabBarAccessibilityLabel ?? options.title ?? route.name;
          const label = options.title ?? route.name;
          const badge = options.tabBarBadge;
          const hasBadge = badge != null && badge !== 0 && badge !== '0';

          const onPress = () => {
            void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.dispatch({
                ...CommonActions.navigate(route.name),
                target: state.key,
              });
            }
          };

          const onLongPress = () => {
            navigation.emit({
              type: 'tabLongPress',
              target: route.key,
            });
          };

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
                isWeb &&
                  hovered &&
                  !pressed &&
                  !isFocused &&
                  styles.itemHovered,
                pressed && styles.itemPressed,
              ]}>
              <View style={styles.iconWrap}>
                {options.tabBarIcon?.({ focused: isFocused, color, size: 20 })}
                {hasBadge ? (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{formatBadge(badge)}</Text>
                  </View>
                ) : null}
              </View>
              <Text
                style={[styles.label, isFocused && styles.labelActive]}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.85}>
                {label}
              </Text>
            </Pressable>
          );
        })}
      </LiquidGlassSurface>
    </View>
  );
}
