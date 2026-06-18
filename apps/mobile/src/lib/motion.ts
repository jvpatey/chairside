import { useEffect, useRef } from 'react';
import { Animated } from 'react-native';

/** Cross-platform pulse for skeleton placeholders. */
export function usePulseOpacity() {
  const opacity = useRef(new Animated.Value(0.45)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 900,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.45,
          duration: 900,
          useNativeDriver: true,
        }),
      ]),
    );

    animation.start();
    return () => animation.stop();
  }, [opacity]);

  return opacity;
}

/** Staggered section entrance for dashboard blocks. */
export function useEnterAnimation(delayMs = 0) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(12)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 420,
        delay: delayMs,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 420,
        delay: delayMs,
        useNativeDriver: true,
      }),
    ]).start();
  }, [delayMs, opacity, translateY]);

  return { opacity, translateY };
}
