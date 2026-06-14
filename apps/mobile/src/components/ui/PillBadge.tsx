import * as Haptics from 'expo-haptics';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { spacing, useTheme, useThemedStyles } from '@/theme';
import { webHover, webListRowHoverStyles, webPointer } from '@/lib/webPressableStyles';

export const PILL_BADGE_MIN_HEIGHT = 26;

export type PillBadgeSize = 'sm' | 'md';

export function usePillBadgeStyles(size: PillBadgeSize = 'md') {
  return useThemedStyles(({ spacing }) => ({
    badge: {
      alignSelf: 'flex-start',
      borderRadius: 999,
      minHeight: size === 'sm' ? 24 : PILL_BADGE_MIN_HEIGHT,
      paddingHorizontal: size === 'sm' ? spacing.sm : spacing.sm + 2,
      paddingVertical: size === 'sm' ? 3 : spacing.xs + 1,
      justifyContent: 'center',
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: 'transparent',
    },
    label: {
      fontSize: size === 'sm' ? 12 : 13,
      fontWeight: '600',
      lineHeight: size === 'sm' ? 16 : 18,
    },
  }));
}

type PillBadgeProps = {
  label: string;
  color: string;
  backgroundColor: string;
  borderColor?: string;
  onPress?: () => void;
  accessibilityLabel?: string;
  size?: PillBadgeSize;
  style?: StyleProp<ViewStyle>;
};

export function PillBadge({
  label,
  color,
  backgroundColor,
  borderColor,
  onPress,
  accessibilityLabel,
  size = 'md',
  style,
}: PillBadgeProps) {
  const { colors } = useTheme();
  const styles = usePillBadgeStyles(size);

  const badgeStyle = [
    styles.badge,
    { backgroundColor, borderColor: borderColor ?? 'transparent' },
    style,
  ];

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
      style={({ pressed, hovered }) => [
        badgeStyle,
        webPointer(),
        webHover(hovered, pressed, webListRowHoverStyles(colors)),
        pressed && { opacity: 0.88 },
      ]}>
      <Text style={[styles.label, { color }]} numberOfLines={1}>
        {label}
      </Text>
    </Pressable>
  );
}

export const badgeRowGap = spacing.xs;
