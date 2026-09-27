import type { ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import Animated, { type AnimatedStyle } from 'react-native-reanimated';

type SlidingSegmentIndicatorProps = {
  animatedStyle: StyleProp<AnimatedStyle<ViewStyle>>;
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
