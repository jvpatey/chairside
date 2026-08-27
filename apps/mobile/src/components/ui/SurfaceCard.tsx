import type { ReactNode } from 'react';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
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
  webListRowHoverStyles,
  IS_WEB,
} from '@/lib/webPressableStyles';
import {
  colorWithAlpha,
  getSurfaceGradient,
  radii,
  type ElevationLevel,
  useTheme,
  useThemedStyles,
} from '@/theme';

import { cardMinHeights, cardShellRadii, type CardPaddingTier } from './cardLayout';

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
  /** Left accent rail color (e.g. featured listing mark). */
  accentRailColor?: string;
  /** Lift + shadow on web hover, or a flat highlight for narrow split-view lists. */
  hoverStyle?: 'lift' | 'subtle';
  /** Omit the default hairline border (e.g. split-view list rows). */
  borderless?: boolean;
  /** Styles applied to the inner card shell (border, background). */
  cardStyle?: StyleProp<ViewStyle>;
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
  cardStyle,
  accentRailColor,
  hoverStyle = 'lift',
  borderless = false,
}: SurfaceCardProps) {
  const { colors, isDark } = useTheme();
  const [isHovered, setIsHovered] = useState(false);
  const surfaceGradient = getSurfaceGradient(colors, isDark);
  const isInner = variant === 'inner';
  const showGradient = isDark && variant === 'default' && !isInner && !accentRailColor;

  const styles = useThemedStyles(({ colors, spacing, elevation, isDark }) => {
    const radius = isInner ? cardShellRadii.inner : radii.lg;
    return {
    lift: {
      borderRadius: radius,
      overflow: 'visible' as const,
      ...(isInner ? null : elevationLevel !== 'none' ? elevation(elevationLevel) : null),
      ...webPointer(onPress ? 'pointer' : 'default'),
      ...(onPress ? webCardLiftBase() : null),
    },
    card: {
      borderRadius: radius,
      overflow: 'hidden' as const,
      borderWidth: borderless ? 0 : isInner ? 1 : StyleSheet.hairlineWidth,
      borderColor:
        variant === 'success'
          ? `${colors.success}40`
          : isInner
            ? colorWithAlpha(colors.labelPrimary, isDark ? 0.08 : 0.14)
            : colors.separator,
      ...(padding === 'none' ? null : { padding: padding === 'lg' ? spacing.lg : spacing.md }),
      ...(gap ? { gap: spacing.sm } : null),
      ...(minHeight != null ? { minHeight } : null),
      position: 'relative' as const,
    },
    cardDefault: {
      backgroundColor:
        variant === 'success'
          ? `${colors.success}10`
          : colors.surface,
    },
    gradient: {
      ...StyleSheet.absoluteFillObject,
      zIndex: 0,
    },
    cardHovered: webTileHoverStyles(colors, isDark),
    cardHoveredSubtle: webListRowHoverStyles(colors),
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
  };
  });

  const cardStyleResolved = [
    styles.card,
    styles.cardDefault,
    cardStyle,
    hoverStyle === 'subtle' && isHovered && onPress ? styles.cardHoveredSubtle : null,
  ];
  const liftStyle = [styles.lift, style, { overflow: 'visible' as const }];
  const webHoverHandlers =
    onPress && IS_WEB && hoverStyle === 'subtle'
      ? {
          onHoverIn: () => setIsHovered(true),
          onHoverOut: () => setIsHovered(false),
        }
      : undefined;

  const inner = (
    <>
      {showGradient ? (
        <LinearGradient colors={surfaceGradient} style={styles.gradient} pointerEvents="none" />
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
    return (
      <View style={liftStyle}>
        <View style={cardStyleResolved}>{inner}</View>
      </View>
    );
  }

  return (
    <Pressable
      accessibilityRole="button"
      {...webHoverHandlers}
      onPress={() => {
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress();
      }}
      style={({ pressed, hovered }) => [
        liftStyle,
        hoverStyle === 'lift' ? webHover(hovered, pressed, styles.cardHovered) : false,
        pressed && styles.cardPressed,
      ]}>
      <View style={cardStyleResolved}>{inner}</View>
    </Pressable>
  );
}

/** Preset min heights for common card families. */
export const surfaceCardMinHeight = cardMinHeights;
