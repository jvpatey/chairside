import { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, type View } from 'react-native';

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

type EnterAnimationOptions = {
  trigger?: 'mount' | 'visible';
  /** Intersection ratio (0–1) before visible-trigger animations run. */
  visibleThreshold?: number;
};

function runEnterAnimation(
  opacity: Animated.Value,
  translateY: Animated.Value,
  delayMs: number,
) {
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
}

export function useEnterAnimation(
  delayMs = 0,
  { trigger = 'mount', visibleThreshold = 0.12 }: EnterAnimationOptions = {},
) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(16)).current;
  const ref = useRef<View>(null);
  const hasAnimated = useRef(false);

  const animate = useCallback(() => {
    if (hasAnimated.current) return;
    hasAnimated.current = true;
    runEnterAnimation(opacity, translateY, delayMs);
  }, [delayMs, opacity, translateY]);

  useEffect(() => {
    if (trigger === 'mount') {
      animate();
      return;
    }

    if (prefersReducedMotion()) {
      opacity.setValue(1);
      translateY.setValue(0);
      hasAnimated.current = true;
      return;
    }

    const node = ref.current;
    if (!node || typeof IntersectionObserver === 'undefined') {
      animate();
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          animate();
          observer.disconnect();
        }
      },
      { threshold: visibleThreshold, rootMargin: '0px 0px -6% 0px' },
    );

    observer.observe(node as unknown as Element);
    return () => observer.disconnect();
  }, [animate, opacity, translateY, trigger, visibleThreshold]);

  return { opacity, translateY, ref: trigger === 'visible' ? ref : undefined };
}

/** Width draw (0 → 100%) for connector lines on scroll reveal. */
export function useConnectorDrawAnimation(delayMs = 0) {
  const scaleX = useRef(new Animated.Value(0)).current;
  const ref = useRef<View>(null);
  const hasAnimated = useRef(false);

  const animate = useCallback(() => {
    if (hasAnimated.current) return;
    hasAnimated.current = true;

    if (prefersReducedMotion()) {
      scaleX.setValue(1);
      return;
    }

    Animated.timing(scaleX, {
      toValue: 1,
      duration: 520,
      delay: delayMs,
      useNativeDriver: true,
    }).start();
  }, [delayMs, scaleX]);

  useEffect(() => {
    if (prefersReducedMotion()) {
      scaleX.setValue(1);
      hasAnimated.current = true;
      return;
    }

    const node = ref.current;
    if (!node || typeof IntersectionObserver === 'undefined') {
      animate();
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          animate();
          observer.disconnect();
        }
      },
      { threshold: 0.2, rootMargin: '0px 0px -10% 0px' },
    );

    observer.observe(node as unknown as Element);
    return () => observer.disconnect();
  }, [animate, scaleX]);

  return { scaleX, ref };
}

/** Fade out, swap content via displayKey, then fade in — for tab/toggle panels. */
export function useContentSwapAnimation(activeKey: string) {
  const opacity = useRef(new Animated.Value(1)).current;
  const translateY = useRef(new Animated.Value(0)).current;
  const [displayKey, setDisplayKey] = useState(activeKey);
  const activeKeyRef = useRef(activeKey);
  const isFirstRender = useRef(true);

  activeKeyRef.current = activeKey;

  useEffect(() => {
    if (prefersReducedMotion()) {
      setDisplayKey(activeKey);
      opacity.setValue(1);
      translateY.setValue(0);
      return;
    }

    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    if (activeKey === displayKey) return;

    const fadeOut = Animated.parallel([
      Animated.timing(opacity, {
        toValue: 0,
        duration: 180,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 10,
        duration: 180,
        useNativeDriver: true,
      }),
    ]);

    fadeOut.start(({ finished }) => {
      if (!finished) return;
      const nextKey = activeKeyRef.current;
      setDisplayKey(nextKey);
      translateY.setValue(-8);
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(translateY, {
          toValue: 0,
          tension: 260,
          friction: 22,
          useNativeDriver: true,
        }),
      ]).start();
    });
  }, [activeKey, displayKey, opacity, translateY]);

  return { opacity, translateY, displayKey };
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
