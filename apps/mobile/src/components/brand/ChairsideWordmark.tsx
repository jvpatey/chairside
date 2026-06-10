import { Platform, Pressable, Text, useWindowDimensions, View, type TextStyle } from 'react-native';

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

  const staticWordmark = (
    <Text style={baseTextStyle}>
      <Text style={{ color: colors.labelPrimary }}>chair</Text>
      <Text style={{ color: colors.primary }}>side</Text>
    </Text>
  );

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
                  }),
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
