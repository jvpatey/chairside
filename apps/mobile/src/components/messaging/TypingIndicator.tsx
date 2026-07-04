import { useEffect, useRef } from 'react';
import { Animated, View } from 'react-native';

import { useThemedStyles } from '@/theme';

type TypingIndicatorProps = {
  visible: boolean;
};

function TypingDot({ delayMs }: { delayMs: number }) {
  const opacity = useRef(new Animated.Value(0.35)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.delay(delayMs),
        Animated.timing(opacity, { toValue: 1, duration: 320, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.35, duration: 320, useNativeDriver: true }),
        Animated.delay(640 - delayMs),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, [delayMs, opacity]);

  const styles = useThemedStyles(({ colors }) => ({
    dot: {
      width: 7,
      height: 7,
      borderRadius: 3.5,
      backgroundColor: colors.labelTertiary,
    },
  }));

  return <Animated.View style={[styles.dot, { opacity }]} />;
}

export function TypingIndicator({ visible }: TypingIndicatorProps) {
  const styles = useThemedStyles(({ colors, spacing }) => ({
    row: {
      flexDirection: 'row',
      justifyContent: 'flex-start',
      paddingHorizontal: spacing.lg,
      paddingBottom: spacing.xs,
    },
    bubble: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: 18,
      borderBottomLeftRadius: 6,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.separator,
    },
  }));

  if (!visible) return null;

  return (
    <View style={styles.row} accessibilityRole="text" accessibilityLabel="Typing">
      <View style={styles.bubble}>
        <TypingDot delayMs={0} />
        <TypingDot delayMs={180} />
        <TypingDot delayMs={360} />
      </View>
    </View>
  );
}
