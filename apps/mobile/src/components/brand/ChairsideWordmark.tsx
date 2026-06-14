import { Platform, Pressable, Text, useWindowDimensions, View, type TextStyle, type ViewStyle } from 'react-native';

import { webOnlyStyle, webPointer } from '@/lib/webPressableStyles';
import { fontWordmark } from '@/theme/fonts';
import { useTheme } from '@/theme';

type ChairsideWordmarkProps = {
  variant?: 'hero' | 'compact' | 'small';
  align?: 'left' | 'center';
  /** Web-only: slides "side" right on hover. */
  animateSideOnHover?: boolean;
};

const COMPACT = { fontSize: 28, letterSpacing: -0.6 } as const;
const SMALL = { fontSize: 20, letterSpacing: -0.45 } as const;
const SIDE_SLIDE_PX = 10;

type ChairsideBrandTextProps = {
  /** Inherit surrounding title/body size, or use a fixed wordmark size. */
  variant?: 'inherit' | 'compact' | 'small';
};

/** Inline two-tone "chairside" for titles and sentences. */
export function ChairsideBrandText({ variant = 'inherit' }: ChairsideBrandTextProps) {
  const { colors } = useTheme();
  const sizing =
    variant === 'compact' ? COMPACT : variant === 'small' ? SMALL : null;

  const baseStyle = {
    fontFamily: fontWordmark,
    textTransform: 'lowercase' as const,
    ...(sizing
      ? { fontSize: sizing.fontSize, letterSpacing: sizing.letterSpacing }
      : { letterSpacing: COMPACT.letterSpacing }),
  };

  return (
    <Text style={baseStyle}>
      <Text style={{ color: colors.labelPrimary }}>chair</Text>
      <Text style={{ color: colors.primary }}>side</Text>
    </Text>
  );
}

function heroSize(screenWidth: number) {
  return Math.round(Math.max(52, Math.min(screenWidth * 0.14, 56)));
}

export function ChairsideWordmark({
  variant = 'hero',
  align = 'center',
  animateSideOnHover = false,
}: ChairsideWordmarkProps) {
  const { colors } = useTheme();
  const { width: screenWidth } = useWindowDimensions();

  const fontSize =
    variant === 'hero' ? heroSize(screenWidth) : variant === 'small' ? SMALL.fontSize : COMPACT.fontSize;
  const letterSpacing =
    variant === 'hero'
      ? fontSize >= 55
        ? -1.4
        : -1.2
      : variant === 'small'
        ? SMALL.letterSpacing
        : COMPACT.letterSpacing;

  const alignStyle = { alignSelf: align === 'left' ? ('flex-start' as const) : ('center' as const) };

  const baseTextStyle = {
    fontFamily: fontWordmark,
    fontSize,
    letterSpacing,
    textTransform: 'lowercase' as const,
  };

  const staticWordmark = <ChairsideBrandText variant={variant === 'small' ? 'small' : 'compact'} />;

  if (variant === 'hero') {
    const heroTextStyle = {
      fontFamily: fontWordmark,
      fontSize,
      letterSpacing,
      textTransform: 'lowercase' as const,
    };

    return (
      <View accessibilityRole="header" accessibilityLabel="chairside" style={alignStyle}>
        <Text style={heroTextStyle}>
          <Text style={{ color: colors.labelPrimary }}>chair</Text>
          <Text style={{ color: colors.primary }}>side</Text>
        </Text>
      </View>
    );
  }

  if (animateSideOnHover && Platform.OS === 'web') {
    return (
      <Pressable
        accessibilityRole="header"
        accessibilityLabel="chairside"
        style={[alignStyle, webPointer('default')]}>
        {({ hovered }) => (
          <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
            <Text style={[baseTextStyle, { color: colors.labelPrimary }]}>chair</Text>
            <Text
              style={
                {
                  ...baseTextStyle,
                  color: colors.primary,
                  transform: [{ translateX: hovered ? SIDE_SLIDE_PX : 0 }],
                  ...webOnlyStyle({
                    transitionProperty: 'transform',
                    transitionDuration: '280ms',
                    transitionTimingFunction: 'ease-out',
                  } as ViewStyle),
                } as TextStyle
              }>
              side
            </Text>
          </View>
        )}
      </Pressable>
    );
  }

  return (
    <View accessibilityRole="header" accessibilityLabel="chairside" style={alignStyle}>
      {staticWordmark}
    </View>
  );
}
