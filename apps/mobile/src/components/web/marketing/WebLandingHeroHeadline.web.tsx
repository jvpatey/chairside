import { Pressable, Text, View, type StyleProp, type TextStyle } from 'react-native';
import { useReducedMotion } from 'react-native-reanimated';

import { webOnlyStyle, webPointer } from '@/lib/webPressableStyles';
import { useTheme } from '@/theme';

const HEADLINE_PREFIX = 'Staffing for dental clinics, ';
const HIGHLIGHT_WORD = 'simplified.';

type WebLandingHeroHeadlineProps = {
  style: StyleProp<TextStyle>;
};

function shimmerTextStyle(baseColor: string, highlightColor: string): TextStyle {
  return webOnlyStyle({
    backgroundImage: `linear-gradient(90deg, ${baseColor} 0%, ${baseColor} 36%, ${highlightColor} 50%, ${baseColor} 64%, ${baseColor} 100%)`,
    backgroundSize: '200% 100%',
    backgroundClip: 'text',
    WebkitBackgroundClip: 'text',
    color: 'transparent',
    WebkitTextFillColor: 'transparent',
    animationName: 'chairside-headline-shimmer',
    animationDuration: '1.15s',
    animationTimingFunction: 'ease-in-out',
    animationIterationCount: 'infinite',
  } as TextStyle);
}

/** Hero headline with a shimmer sweep across the accent word on hover. */
export function WebLandingHeroHeadline({ style }: WebLandingHeroHeadlineProps) {
  const { colors, isDark } = useTheme();
  const reducedMotion = useReducedMotion();
  const highlightColor = isDark ? 'rgba(255, 255, 255, 0.92)' : 'rgba(255, 255, 255, 0.95)';

  return (
    <View
      style={{
        flexDirection: 'row',
        flexWrap: 'wrap',
        alignItems: 'baseline',
        alignSelf: 'flex-start',
        maxWidth: '100%',
      }}
    >
      <Text style={style}>{HEADLINE_PREFIX}</Text>

      <Pressable accessibilityRole="text" style={webPointer('default')}>
        {({ hovered }) => (
          <Text
            style={[
              style,
              { color: colors.primary },
              hovered && !reducedMotion
                ? shimmerTextStyle(colors.primary, highlightColor)
                : null,
            ]}
          >
            {HIGHLIGHT_WORD}
          </Text>
        )}
      </Pressable>
    </View>
  );
}
