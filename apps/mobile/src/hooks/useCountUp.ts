import { useEffect, useRef, useState } from 'react';
import { Animated } from 'react-native';

type UseCountUpOptions = {
  durationMs?: number;
  delayMs?: number;
  enabled?: boolean;
};

/** Animates a number from 0 to `target` on change. */
export function useCountUp(
  target: number,
  { durationMs = 640, delayMs = 0, enabled = true }: UseCountUpOptions = {},
) {
  const animated = useRef(new Animated.Value(0)).current;
  const [displayValue, setDisplayValue] = useState(enabled ? 0 : target);

  useEffect(() => {
    if (!enabled) {
      setDisplayValue(target);
      return;
    }

    animated.setValue(0);
    setDisplayValue(0);

    const listenerId = animated.addListener(({ value }) => {
      setDisplayValue(Math.round(value));
    });

    Animated.timing(animated, {
      toValue: target,
      duration: durationMs,
      delay: delayMs,
      useNativeDriver: false,
    }).start();

    return () => {
      animated.removeListener(listenerId);
    };
  }, [animated, delayMs, durationMs, enabled, target]);

  return displayValue;
}
