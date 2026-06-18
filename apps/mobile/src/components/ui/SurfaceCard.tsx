import type { ReactNode } from 'react';
import * as Haptics from 'expo-haptics';
import {
  Pressable,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import {
  webHover,
  webPointer,
  webTileHoverStyles,
} from '@/lib/webPressableStyles';
import {
  radii,
  type ElevationLevel,
  useThemedStyles,
} from '@/theme';

import { cardMinHeights, type CardPaddingTier } from './cardLayout';

export type SurfaceCardVariant = 'default' | 'success';

type SurfaceCardProps = {
  children: ReactNode;
  variant?: SurfaceCardVariant;
  padding?: CardPaddingTier | 'none';
  gap?: boolean;
  elevationLevel?: ElevationLevel;
  minHeight?: number;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
};

export function SurfaceCard({
  children,
  variant = 'default',
  padding = 'md',
  gap = false,
  elevationLevel = 'none',
  minHeight,
  onPress,
  style,
  contentStyle,
}: SurfaceCardProps) {
  const styles = useThemedStyles(({ colors, spacing, elevation, isDark }) => ({
    card: {
      backgroundColor:
        variant === 'success' ? `${colors.success}10` : colors.surface,
      borderRadius: radii.lg,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor:
        variant === 'success' ? `${colors.success}40` : colors.separator,
      ...(padding === 'none' ? null : { padding: padding === 'lg' ? spacing.lg : spacing.md }),
      ...(gap ? { gap: spacing.sm } : null),
      ...(minHeight != null ? { minHeight } : null),
      ...(elevationLevel !== 'none' ? elevation(elevationLevel) : null),
      ...webPointer(onPress ? 'pointer' : 'default'),
    },
    cardHovered: webTileHoverStyles(colors, isDark),
    cardPressed: {
      opacity: 0.92,
    },
    content: {
      gap: spacing.sm,
    },
  }));

  const cardStyle = [styles.card, style];

  if (!onPress) {
    return (
      <View style={cardStyle}>
        <View style={[gap && styles.content, contentStyle]}>{children}</View>
      </View>
    );
  }

  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => {
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress();
      }}
      style={({ pressed, hovered }) => [
        cardStyle,
        webHover(hovered, pressed, styles.cardHovered),
        pressed && styles.cardPressed,
      ]}>
      <View style={[gap && styles.content, contentStyle]}>{children}</View>
    </Pressable>
  );
}

/** Preset min heights for common card families. */
export const surfaceCardMinHeight = cardMinHeights;
