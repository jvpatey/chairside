import { type ReactNode, useEffect } from 'react';
import {
  LayoutAnimation,
  Platform,
  UIManager,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import Animated, { Easing, FadeIn, FadeOut } from 'react-native-reanimated';

import type { WorkerBrowseViewMode } from '@/lib/postingFilters';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const easeOut = Easing.out(Easing.cubic);

const ENTERING = FadeIn.duration(140).easing(easeOut);
const EXITING = FadeOut.duration(100).easing(easeOut);

type WorkerBrowseViewTransitionProps = {
  mode: WorkerBrowseViewMode;
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
};

export function WorkerBrowseViewTransition({
  mode,
  children,
  style,
}: WorkerBrowseViewTransitionProps) {
  useEffect(() => {
    LayoutAnimation.configureNext({
      duration: 180,
      update: { type: LayoutAnimation.Types.easeInEaseOut },
    });
  }, [mode]);

  return (
    <Animated.View
      key={mode}
      entering={ENTERING}
      exiting={EXITING}
      style={style}
      collapsable={false}
    >
      {children}
    </Animated.View>
  );
}
