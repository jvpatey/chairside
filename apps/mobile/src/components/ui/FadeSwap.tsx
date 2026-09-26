import { useEffect, useRef, type ReactNode } from 'react';
import { Animated, Easing, Platform, type StyleProp, type ViewStyle } from 'react-native';
import { useReducedMotion } from 'react-native-reanimated';

type FadeSwapProps = {
  /** Changing this key fades and lifts the children in. */
  swapKey: string;
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  durationMs?: number;
};

/** Cross-platform (core Animated) fade + rise when content swaps between states. */
export function FadeSwap({ swapKey, children, style, durationMs = 280 }: FadeSwapProps) {
  const reducedMotion = useReducedMotion();
  const opacity = useRef(new Animated.Value(1)).current;
  const translateY = useRef(new Animated.Value(0)).current;
  const previousKey = useRef(swapKey);

  useEffect(() => {
    if (previousKey.current === swapKey) return;
    previousKey.current = swapKey;

    const useNativeDriver = Platform.OS !== 'web';
    opacity.setValue(0);
    translateY.setValue(reducedMotion ? 0 : 10);
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: reducedMotion ? 160 : durationMs,
        easing: Easing.out(Easing.cubic),
        useNativeDriver,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: durationMs,
        easing: Easing.out(Easing.cubic),
        useNativeDriver,
      }),
    ]).start();
  }, [durationMs, opacity, reducedMotion, swapKey, translateY]);

  return (
    <Animated.View style={[style, { opacity, transform: [{ translateY }] }]}>
      {children}
    </Animated.View>
  );
}
