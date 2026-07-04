import type { ReactNode } from 'react';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
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
  getSurfaceGradient,
  radii,
  type ElevationLevel,
  useTheme,
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

function SurfaceCardContent({
  children,
  gap,
  contentStyle,
  styles,
}: {
  children: ReactNode;
  gap: boolean;
  contentStyle?: StyleProp<ViewStyle>;
  styles: ReturnType<typeof useThemedStyles<{ content: ViewStyle }>>;
}) {
  return <View style={[gap && styles.content, contentStyle]}>{children}</View>;
}

export function SurfaceCard({
  children,
  variant = 'default',
  padding = 'md',
  gap = false,
  elevationLevel = 'subtle',
  minHeight,
  onPress,
  style,
  contentStyle,
}: SurfaceCardProps) {
  const { colors, isDark } = useTheme();
  const surfaceGradient = getSurfaceGradient(colors, isDark);
  const showGradient = isDark && variant === 'default';

  const styles = useThemedStyles(({ colors, spacing, elevation, isDark }) => ({
    card: {
      borderRadius: radii.lg,
      overflow: 'hidden',
      borderWidth: isDark ? StyleSheet.hairlineWidth : 0,
      borderColor:
        variant === 'success'
          ? `${colors.success}40`
          : isDark
            ? colors.separator
            : 'transparent',
      ...(padding === 'none' ? null : { padding: padding === 'lg' ? spacing.lg : spacing.md }),
      ...(gap ? { gap: spacing.sm } : null),
      ...(minHeight != null ? { minHeight } : null),
      ...(elevationLevel !== 'none' ? elevation(elevationLevel) : null),
      ...webPointer(onPress ? 'pointer' : 'default'),
    },
    cardDefault: {
      backgroundColor: variant === 'success' ? `${colors.success}10` : colors.surface,
    },
    gradient: {
      ...StyleSheet.absoluteFillObject,
    },
    cardHovered: webTileHoverStyles(colors, isDark),
    cardPressed: {
      opacity: 0.92,
    },
    content: {
      gap: spacing.sm,
    },
  }));

  const cardStyle = [styles.card, styles.cardDefault, style];

  const inner = (
    <>
      {showGradient ? (
        <LinearGradient colors={surfaceGradient} style={styles.gradient} pointerEvents="none" />
      ) : null}
      <SurfaceCardContent gap={gap} contentStyle={contentStyle} styles={styles}>
        {children}
      </SurfaceCardContent>
    </>
  );

  if (!onPress) {
    return <View style={cardStyle}>{inner}</View>;
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
      {inner}
    </Pressable>
  );
}

/** Preset min heights for common card families. */
export const surfaceCardMinHeight = cardMinHeights;
