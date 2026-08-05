import { type ReactNode, useEffect, useState } from 'react';
import {
  AccessibilityInfo,
  View,
  type LayoutChangeEvent,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { useTheme } from '@/theme';

type AnimateHeightProps = {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  /**
   * When false, height follows the parent (e.g. equal-stretch columns) but the
   * last visual height is kept so the next enable can morph from it.
   */
  enabled?: boolean;
  durationMs?: number;
};

const HEIGHT_EASING = Easing.bezier(0.32, 0.72, 0, 1);

/**
 * Smoothly morphs container height when children change size.
 * Used for desktop column panels that grow/shrink with list content.
 */
export function AnimateHeight({
  children,
  style,
  enabled = true,
  durationMs = 300,
}: AnimateHeightProps) {
  const { colors, radii } = useTheme();
  const height = useSharedValue(0);
  const hasMeasured = useSharedValue(false);
  const [reduceMotion, setReduceMotion] = useState(false);
  const [lockHeight, setLockHeight] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void AccessibilityInfo.isReduceMotionEnabled().then((value) => {
      if (!cancelled) setReduceMotion(value);
    });
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion);
    return () => {
      cancelled = true;
      sub.remove();
    };
  }, []);

  useEffect(() => {
    if (!enabled) {
      setLockHeight(false);
      return;
    }
    // Resume locking from the last known visual height (e.g. after stretch).
    if (hasMeasured.value) {
      setLockHeight(true);
    }
  }, [enabled, hasMeasured]);

  const animatedStyle = useAnimatedStyle(() => {
    if (!hasMeasured.value) return {};
    return {
      height: height.value,
      // Clip to the card radius with the same fill — a square overflow parent
      // otherwise leaves brand-shadow “nubs” in the rounded corners.
      overflow: 'hidden' as const,
      borderRadius: radii.lg,
      backgroundColor: colors.surface,
    };
  });

  const syncHeight = (next: number, animate: boolean) => {
    if (!Number.isFinite(next) || next <= 0) return;
    if (!hasMeasured.value) {
      height.value = next;
      hasMeasured.value = true;
      if (enabled) setLockHeight(true);
      return;
    }
    if (Math.abs(height.value - next) < 1) return;
    if (!animate || reduceMotion) {
      height.value = next;
      return;
    }
    height.value = withTiming(next, { duration: durationMs, easing: HEIGHT_EASING });
  };

  const onOuterLayout = (event: LayoutChangeEvent) => {
    if (enabled) return;
    // While stretch owns layout, track the visual panel height as the morph origin.
    syncHeight(event.nativeEvent.layout.height, false);
  };

  const onContentLayout = (event: LayoutChangeEvent) => {
    if (!enabled) return;
    syncHeight(event.nativeEvent.layout.height, hasMeasured.value);
  };

  return (
    <Animated.View
      style={[
        !enabled ? { flex: 1, alignSelf: 'stretch', minHeight: 0 } : null,
        enabled && lockHeight ? animatedStyle : null,
      ]}
      onLayout={onOuterLayout}>
      <View style={[style, !enabled ? { flex: 1 } : null]} onLayout={onContentLayout}>
        {children}
      </View>
    </Animated.View>
  );
}
