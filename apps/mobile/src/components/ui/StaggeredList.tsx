import { Children, isValidElement, type ReactNode, useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';

import { FadeInSection } from '@/components/dashboard/FadeInSection';

type StaggeredListProps = {
  children: ReactNode;
  /** Base delay before the first child animates in. */
  baseDelayMs?: number;
  /** Incremental delay between each child. */
  stepDelayMs?: number;
  /** Cap animated items to avoid long cascades on large lists. */
  maxAnimatedItems?: number;
};

function usePrefersReducedMotion() {
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
      if (!cancelled) setReduceMotion(enabled);
    });
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion);
    return () => {
      cancelled = true;
      subscription.remove();
    };
  }, []);

  return reduceMotion;
}

/**
 * Staggered spring entrances for list children.
 * Uses RN Animated (via FadeInSection) — not Reanimated layout animations.
 */
export function StaggeredList({
  children,
  baseDelayMs = 0,
  stepDelayMs = 40,
  maxAnimatedItems = 12,
}: StaggeredListProps) {
  const reduceMotion = usePrefersReducedMotion();
  const items = Children.toArray(children).filter(isValidElement);

  if (reduceMotion) {
    return <>{items}</>;
  }

  return (
    <>
      {items.map((child, index) => {
        if (index >= maxAnimatedItems) {
          return child;
        }
        return (
          <FadeInSection key={child.key ?? index} delayMs={baseDelayMs + index * stepDelayMs}>
            {child}
          </FadeInSection>
        );
      })}
    </>
  );
}
