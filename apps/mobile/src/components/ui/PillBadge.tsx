import * as Haptics from 'expo-haptics';
import { Pressable, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { spacing, useThemedStyles } from '@/theme';

export const PILL_BADGE_MIN_HEIGHT = 26;

export function usePillBadgeStyles() {
  return useThemedStyles(({ spacing }) => ({
    badge: {
      alignSelf: 'flex-start',
      borderRadius: 999,
      minHeight: PILL_BADGE_MIN_HEIGHT,
      paddingHorizontal: spacing.sm + 2,
      paddingVertical: spacing.xs + 1,
      justifyContent: 'center',
    },
    label: {
      fontSize: 12,
      fontWeight: '600',
      lineHeight: 16,
    },
  }));
}

type PillBadgeProps = {
  label: string;
  color: string;
  backgroundColor: string;
  onPress?: () => void;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
};

export function PillBadge({
  label,
  color,
  backgroundColor,
  onPress,
  accessibilityLabel,
  style,
}: PillBadgeProps) {
  const styles = usePillBadgeStyles();

  const badgeStyle = [styles.badge, { backgroundColor }, style];

  if (!onPress) {
    return (
      <View style={badgeStyle}>
        <Text style={[styles.label, { color }]} numberOfLines={1}>
          {label}
        </Text>
      </View>
    );
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      onPress={() => {
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress();
      }}
      style={({ pressed }) => [badgeStyle, pressed && { opacity: 0.88 }]}>
      <Text style={[styles.label, { color }]} numberOfLines={1}>
        {label}
      </Text>
    </Pressable>
  );
}

export const badgeRowGap = spacing.xs;
