import type { ReactNode } from 'react';
import { Animated, type StyleProp, type ViewStyle } from 'react-native';

import { useEnterAnimation } from '@/lib/webMotion.web';

type WebPageEnterProps = {
  children: ReactNode;
  delayMs?: number;
  style?: StyleProp<ViewStyle>;
};

export function WebPageEnter({ children, delayMs = 0, style }: WebPageEnterProps) {
  const { opacity, translateY } = useEnterAnimation(delayMs);

  return (
    <Animated.View style={[style, { opacity, transform: [{ translateY }] }]}>
      {children}
    </Animated.View>
  );
}
