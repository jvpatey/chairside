import type { ReactNode } from 'react';
import { Animated, View, type StyleProp, type ViewStyle } from 'react-native';

import { useEnterAnimation } from '@/lib/webMotion.web';

type WebPageEnterProps = {
  children: ReactNode;
  delayMs?: number;
  style?: StyleProp<ViewStyle>;
  /** When false, skip the fade/slide-in (e.g. split-view panes). */
  animate?: boolean;
};

export function WebPageEnter({ children, delayMs = 0, style, animate = true }: WebPageEnterProps) {
  if (!animate) {
    return <View style={style}>{children}</View>;
  }

  const { opacity, translateY } = useEnterAnimation(delayMs);

  return (
    <Animated.View style={[style, { opacity, transform: [{ translateY }] }]}>
      {children}
    </Animated.View>
  );
}
