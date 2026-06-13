import { useEffect, useRef } from 'react';
import {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  type WithSpringConfig,
} from 'react-native-reanimated';

export const SEGMENT_INDICATOR_SPRING: WithSpringConfig = {
  damping: 22,
  stiffness: 340,
  mass: 0.82,
};

export type SegmentLayout = {
  x: number;
  y: number;
  width: number;
  height: number;
};

type SegmentAxis = 'horizontal' | 'vertical';

export function useSlidingSegmentIndicator(
  selectedIndex: number,
  axis: SegmentAxis = 'horizontal',
) {
  const layoutsRef = useRef<Record<number, SegmentLayout>>({});
  const initializedRef = useRef(false);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const width = useSharedValue(0);
  const height = useSharedValue(0);
  const opacity = useSharedValue(0);

  const applyLayout = (layout: SegmentLayout, animate: boolean) => {
    if (animate) {
      if (axis === 'horizontal') {
        translateX.value = withSpring(layout.x, SEGMENT_INDICATOR_SPRING);
      } else {
        translateY.value = withSpring(layout.y, SEGMENT_INDICATOR_SPRING);
      }
      width.value = withSpring(layout.width, SEGMENT_INDICATOR_SPRING);
      height.value = withSpring(layout.height, SEGMENT_INDICATOR_SPRING);
    } else {
      translateX.value = layout.x;
      translateY.value = layout.y;
      width.value = layout.width;
      height.value = layout.height;
    }
    opacity.value = 1;
  };

  const onSegmentLayout = (index: number, layout: SegmentLayout) => {
    layoutsRef.current[index] = layout;
    if (index === selectedIndex) {
      applyLayout(layout, initializedRef.current);
      initializedRef.current = true;
    }
  };

  useEffect(() => {
    const layout = layoutsRef.current[selectedIndex];
    if (!layout) return;
    applyLayout(layout, initializedRef.current);
    initializedRef.current = true;
  }, [selectedIndex, axis]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform:
      axis === 'horizontal'
        ? [{ translateX: translateX.value }]
        : [{ translateY: translateY.value }],
    width: width.value,
    height: height.value,
    opacity: opacity.value,
  }));

  return { animatedStyle, onSegmentLayout };
}
