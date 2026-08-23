import type { ReactNode } from 'react';
import { Animated, View, type StyleProp, type ViewStyle } from 'react-native';

import { useEnterAnimation } from '@/lib/webMotion.web';

type WebPageEnterProps = {
  children: ReactNode;
  delayMs?: number;
  style?: StyleProp<ViewStyle>;
  /** When false, skip the fade/slide-in (e.g. split-view panes). */
  animate?: boolean;
  /** `mount` = on load (default). `visible` = when scrolled into view. */
  trigger?: 'mount' | 'visible';
};

export function WebPageEnter({
  children,
  delayMs = 0,
  style,
  animate = true,
  trigger = 'mount',
}: WebPageEnterProps) {
  const { opacity, translateY, ref } = useEnterAnimation(delayMs, { trigger });

  if (!animate) {
    return <View style={style}>{children}</View>;
  }

  return (
    <Animated.View ref={ref} style={[style, { opacity, transform: [{ translateY }] }]}>
      {children}
    </Animated.View>
  );
}
