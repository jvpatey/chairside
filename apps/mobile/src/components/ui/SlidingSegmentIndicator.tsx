import type { ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import Animated from 'react-native-reanimated';

type SlidingSegmentIndicatorProps = {
  animatedStyle: StyleProp<ViewStyle>;
  style?: StyleProp<ViewStyle>;
  children?: ReactNode;
};

export function SlidingSegmentIndicator({
  animatedStyle,
  style,
  children,
}: SlidingSegmentIndicatorProps) {
  return (
    <Animated.View
      pointerEvents="none"
      style={[style, animatedStyle]}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants">
      {children}
    </Animated.View>
  );
}
