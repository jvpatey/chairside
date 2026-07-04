import { useEffect, useRef } from 'react';
import { Animated } from 'react-native';

function prefersReducedMotion() {
  return (
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

export function usePulseOpacity() {
  const opacity = useRef(new Animated.Value(0.45)).current;

  useEffect(() => {
    if (prefersReducedMotion()) {
      opacity.setValue(1);
      return;
    }

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

export function useFadeIn() {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(8)).current;

  useEffect(() => {
    if (prefersReducedMotion()) {
      opacity.setValue(1);
      translateY.setValue(0);
      return;
    }

    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 280,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 280,
        useNativeDriver: true,
      }),
    ]).start();
  }, [opacity, translateY]);

  return { opacity, translateY };
}

export function useEnterAnimation(delayMs = 0) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(16)).current;

  useEffect(() => {
    if (prefersReducedMotion()) {
      opacity.setValue(1);
      translateY.setValue(0);
      return;
    }

    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 380,
        delay: delayMs,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 320,
        delay: delayMs,
        useNativeDriver: true,
      }),
    ]).start();
  }, [delayMs, opacity, translateY]);

  return { opacity, translateY };
}

/** Scale + fade entrance for centered web dialogs. */
export function useDialogEnter(visible: boolean) {
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.96)).current;

  useEffect(() => {
    if (!visible) {
      opacity.setValue(0);
      scale.setValue(0.96);
      return;
    }

    if (prefersReducedMotion()) {
      opacity.setValue(1);
      scale.setValue(1);
      return;
    }

    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 220,
        useNativeDriver: true,
      }),
      Animated.spring(scale, {
        toValue: 1,
        tension: 280,
        friction: 22,
        useNativeDriver: true,
      }),
    ]).start();
  }, [opacity, scale, visible]);

  return { opacity, scale };
}

/** Horizontal shimmer sweep for skeleton placeholders. */
export function useShimmerTranslate(containerWidth = 280) {
  const translateX = useRef(new Animated.Value(-containerWidth)).current;

  useEffect(() => {
    if (prefersReducedMotion()) {
      translateX.setValue(0);
      return;
    }

    const animation = Animated.loop(
      Animated.timing(translateX, {
        toValue: containerWidth,
        duration: 1400,
        useNativeDriver: true,
      }),
    );

    animation.start();
    return () => animation.stop();
  }, [containerWidth, translateX]);

  return translateX;
}

export function useSpin() {
  const spin = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (prefersReducedMotion()) {
      return;
    }

    const animation = Animated.loop(
      Animated.timing(spin, {
        toValue: 1,
        duration: 900,
        useNativeDriver: true,
      }),
    );

    animation.start();
    return () => animation.stop();
  }, [spin]);

  return spin.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });
}

export function useBounceLoop(amplitude = 4) {
  const bounce = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (prefersReducedMotion()) {
      return;
    }

    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(bounce, {
          toValue: 1,
          duration: 1100,
          useNativeDriver: true,
        }),
        Animated.timing(bounce, {
          toValue: 0,
          duration: 1100,
          useNativeDriver: true,
        }),
      ]),
    );

    animation.start();
    return () => animation.stop();
  }, [bounce]);

  return bounce.interpolate({
    inputRange: [0, 1],
    outputRange: [0, amplitude],
  });
}
