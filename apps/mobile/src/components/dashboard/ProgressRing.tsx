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
  const rotation = useSharedValue(0);

  useEffect(() => {
    rotation.value = withTiming(progress * 360, {
      duration: 520,
      easing: Easing.out(Easing.cubic),
    });
  }, [progress, rotation]);

  const foregroundStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

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
    arcClip: {
      position: 'absolute',
      width: size,
      height: size,
      overflow: 'hidden',
    },
    arcHalf: {
      position: 'absolute',
      width: size,
      height: size,
      borderRadius: size / 2,
      borderWidth: strokeWidth,
      borderColor: colors.primary,
      borderRightColor: 'transparent',
      borderBottomColor: 'transparent',
      transform: [{ rotate: '-45deg' }],
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
      {progress > 0 ? (
        <View style={styles.arcClip}>
          <Animated.View style={[styles.arcHalf, foregroundStyle]} />
        </View>
      ) : null}
      <Text style={styles.label}>
        {completed}/{total}
      </Text>
    </View>
  );
}
