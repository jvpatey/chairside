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
  webCardLiftBase,
} from '@/lib/webPressableStyles';
import {
  getSurfaceGradient,
  radii,
  type ElevationLevel,
  type FeaturedListingGradient,
  useTheme,
  useThemedStyles,
} from '@/theme';

import { cardMinHeights, type CardPaddingTier } from './cardLayout';

export type SurfaceCardVariant = 'default' | 'success' | 'inner';

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
  featuredOverlay?: FeaturedListingGradient | null;
  /** Left accent rail color (semantic category). */
  accentRailColor?: string;
};

function SurfaceCardContent({
  children,
  gap,
  contentStyle,
  contentLayerStyle,
  contentGapStyle,
}: {
  children: ReactNode;
  gap: boolean;
  contentStyle?: StyleProp<ViewStyle>;
  contentLayerStyle: StyleProp<ViewStyle>;
  contentGapStyle: StyleProp<ViewStyle>;
}) {
  return <View style={[contentLayerStyle, gap && contentGapStyle, contentStyle]}>{children}</View>;
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
  featuredOverlay,
  accentRailColor,
}: SurfaceCardProps) {
  const { colors, isDark } = useTheme();
  const surfaceGradient = getSurfaceGradient(colors, isDark);
  const isInner = variant === 'inner';
  const showGradient = isDark && variant === 'default' && !featuredOverlay && !isInner;

  const styles = useThemedStyles(({ colors, spacing, elevation, isDark }) => ({
    card: {
      borderRadius: radii.lg,
      overflow: 'hidden',
      borderWidth: isInner ? 0 : StyleSheet.hairlineWidth,
      borderColor:
        variant === 'success'
          ? `${colors.success}40`
          : colors.separator,
      ...(padding === 'none' ? null : { padding: padding === 'lg' ? spacing.lg : spacing.md }),
      ...(gap ? { gap: spacing.sm } : null),
      ...(minHeight != null ? { minHeight } : null),
      ...(isInner ? null : elevationLevel !== 'none' ? elevation(elevationLevel) : null),
      ...webPointer(onPress ? 'pointer' : 'default'),
      ...(onPress ? webCardLiftBase() : null),
      position: 'relative' as const,
    },
    cardDefault: {
      backgroundColor:
        variant === 'success'
          ? `${colors.success}10`
          : isInner
            ? colors.surface
            : colors.surface,
    },
    gradient: {
      ...StyleSheet.absoluteFillObject,
      zIndex: 0,
    },
    cardHovered: webTileHoverStyles(colors, isDark),
    cardPressed: {
      opacity: 0.92,
    },
    contentLayer: {
      position: 'relative',
      zIndex: 1,
    },
    content: {
      gap: spacing.sm,
    },
    accentRail: {
      position: 'absolute',
      left: 0,
      top: spacing.sm,
      bottom: spacing.sm,
      width: 3,
      borderRadius: 2,
    },
  }));

  const cardStyle = [styles.card, styles.cardDefault, style];

  const inner = (
    <>
      {showGradient ? (
        <LinearGradient colors={surfaceGradient} style={styles.gradient} pointerEvents="none" />
      ) : null}
      {featuredOverlay ? (
        <LinearGradient
          colors={featuredOverlay.colors as [string, string, ...string[]]}
          locations={featuredOverlay.locations as [number, number, ...number[]]}
          start={featuredOverlay.start}
          end={featuredOverlay.end}
          style={styles.gradient}
          pointerEvents="none"
        />
      ) : null}
      {accentRailColor ? (
        <View style={[styles.accentRail, { backgroundColor: accentRailColor }]} pointerEvents="none" />
      ) : null}
      <SurfaceCardContent
        gap={gap}
        contentStyle={contentStyle}
        contentLayerStyle={styles.contentLayer}
        contentGapStyle={styles.content}
      >
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
