import { Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useEffect } from 'react';

import { fontBold, useTheme, useThemedStyles } from '@/theme';

type ProgressRingProps = {
  completed: number;
  total: number;
  size?: number;
  strokeWidth?: number;
};

/** Circular progress ring with center label — no SVG dependency. */
export function ProgressRing({ completed, total, size = 48, strokeWidth = 4 }: ProgressRingProps) {
  const { colors } = useTheme();
  const progress = total > 0 ? Math.max(0, Math.min(1, completed / total)) : 0;
  const isComplete = progress >= 1;
  const angle = useSharedValue(0);

  useEffect(() => {
    angle.value = withTiming(progress * 360, {
      duration: 520,
      easing: Easing.out(Easing.cubic),
    });
  }, [progress, angle]);

  const half = size / 2;

  const rightHalfStyle = useAnimatedStyle(() => {
    const clamped = Math.min(angle.value, 180);
    return {
      transform: [{ rotate: `${clamped - 180}deg` }],
    };
  });

  const leftHalfStyle = useAnimatedStyle(() => {
    const clamped = Math.max(angle.value - 180, 0);
    return {
      transform: [{ rotate: `${clamped - 180}deg` }],
    };
  });

  const styles = useThemedStyles(({ colors }) => ({
    container: {
      width: size,
      height: size,
      alignItems: 'center',
      justifyContent: 'center',
    },
    track: {
      position: 'absolute',
      width: size,
      height: size,
      borderRadius: size / 2,
      borderWidth: strokeWidth,
      borderColor: colors.separator,
      opacity: 0.55,
    },
    trackComplete: {
      borderColor: colors.primary,
      opacity: 1,
    },
    clip: {
      position: 'absolute',
      top: 0,
      height: size,
      overflow: 'hidden',
    },
    arc: {
      position: 'absolute',
      top: 0,
      width: size,
      height: size,
      borderRadius: size / 2,
      borderWidth: strokeWidth,
      borderColor: colors.primary,
    },
    arcRight: {
      left: -half,
      borderTopColor: 'transparent',
      borderLeftColor: 'transparent',
    },
    arcLeft: {
      left: 0,
      borderTopColor: 'transparent',
      borderRightColor: 'transparent',
    },
    label: {
      fontSize: size <= 44 ? 11 : 12,
      lineHeight: size <= 44 ? 14 : 16,
      fontFamily: fontBold,
      fontWeight: '700',
      color: colors.labelPrimary,
      letterSpacing: -0.2,
    },
  }));

  return (
    <View style={styles.container} accessibilityLabel={`${completed} of ${total} steps complete`}>
      <View style={styles.track} />
      {isComplete ? (
        <View style={[styles.track, styles.trackComplete]} />
      ) : progress > 0 ? (
        <>
          <View style={[styles.clip, { left: half, width: half }]}>
            <Animated.View style={[styles.arc, styles.arcRight, rightHalfStyle]} />
          </View>
          <View style={[styles.clip, { left: 0, width: half }]}>
            <Animated.View style={[styles.arc, styles.arcLeft, leftHalfStyle]} />
          </View>
        </>
      ) : null}
      <Text style={styles.label}>
        {completed}/{total}
      </Text>
    </View>
  );
}
