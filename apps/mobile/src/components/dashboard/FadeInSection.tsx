import { Animated, type StyleProp, type ViewStyle } from 'react-native';
import { type ReactNode } from 'react';

import { useEnterAnimation } from '@/lib/motion';

type FadeInSectionProps = {
  children: ReactNode;
  delayMs?: number;
  style?: StyleProp<ViewStyle>;
};

/** Subtle staggered entrance for dashboard sections. */
export function FadeInSection({ children, delayMs = 0, style }: FadeInSectionProps) {
  const { opacity, translateY } = useEnterAnimation(delayMs);

  return (
    <Animated.View style={[style, { opacity, transform: [{ translateY }] }]}>
      {children}
    </Animated.View>
  );
}
