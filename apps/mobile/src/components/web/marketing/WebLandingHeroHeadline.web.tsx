import { Pressable, Text, View, type StyleProp, type TextStyle } from 'react-native';
import { useEffect, useState } from 'react';
import { useReducedMotion } from 'react-native-reanimated';

import { webOnlyStyle, webPointer } from '@/lib/webPressableStyles';
import { useTheme } from '@/theme';

const HEADLINE_PREFIX = 'Staffing for dental clinics, ';
const HIGHLIGHT_WORD = 'simplified.';

type WebLandingHeroHeadlineProps = {
  style: StyleProp<TextStyle>;
};

function shimmerTextStyle(
  baseColor: string,
  highlightColor: string,
  iterationCount: number | 'infinite',
): TextStyle {
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
    animationIterationCount: iterationCount,
  } as object) as TextStyle;
}

/** Hero headline with a one-shot shimmer on load, then hover-only sweeps. */
export function WebLandingHeroHeadline({ style }: WebLandingHeroHeadlineProps) {
  const { colors, isDark } = useTheme();
  const reducedMotion = useReducedMotion();
  const [introShimmer, setIntroShimmer] = useState(false);
  const highlightColor = isDark ? 'rgba(255, 255, 255, 0.92)' : 'rgba(255, 255, 255, 0.95)';

  useEffect(() => {
    if (reducedMotion) return;

    const timer = setTimeout(() => setIntroShimmer(true), 800);
    return () => clearTimeout(timer);
  }, [reducedMotion]);

  useEffect(() => {
    if (!introShimmer || reducedMotion) return;

    const timer = setTimeout(() => setIntroShimmer(false), 1300);
    return () => clearTimeout(timer);
  }, [introShimmer, reducedMotion]);

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
        {({ hovered }) => {
          const showShimmer = !reducedMotion && (introShimmer || hovered);

          return (
            <Text
              style={[
                style,
                { color: colors.primary },
                showShimmer
                  ? shimmerTextStyle(
                      colors.primary,
                      highlightColor,
                      introShimmer ? 1 : 'infinite',
                    )
                  : null,
              ]}
            >
              {HIGHLIGHT_WORD}
            </Text>
          );
        }}
      </Pressable>
    </View>
  );
}
