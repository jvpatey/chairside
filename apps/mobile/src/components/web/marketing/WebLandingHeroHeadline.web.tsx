import { Pressable, Text, View, type StyleProp, type TextStyle } from 'react-native';
import { useEffect, useState } from 'react';
import { useReducedMotion } from 'react-native-reanimated';

import { webOnlyStyle, webPointer } from '@/lib/webPressableStyles';
import { useTheme } from '@/theme';
import { webMotion } from '@/theme/web';

const HEADLINE_PREFIX = 'Fill the chair ';
const HIGHLIGHT_WORD = 'today.';
const POP_DURATION_MS = 780;

type WebLandingHeroHeadlineProps = {
  style: StyleProp<TextStyle>;
};

type IntroPhase = 'idle' | 'popping' | 'settled';

/** Hero headline: smooth one-shot pop-settle on load, soft lift on hover. */
export function WebLandingHeroHeadline({ style }: WebLandingHeroHeadlineProps) {
  const { colors } = useTheme();
  const reducedMotion = useReducedMotion();
  const [phase, setPhase] = useState<IntroPhase>('idle');

  useEffect(() => {
    if (reducedMotion) {
      setPhase('settled');
      return;
    }

    const start = setTimeout(() => setPhase('popping'), 280);
    return () => clearTimeout(start);
  }, [reducedMotion]);

  useEffect(() => {
    if (phase !== 'popping') return;

    // Match keyframe length so we hand off to settled styles without a mid-animation snap.
    const done = setTimeout(() => setPhase('settled'), POP_DURATION_MS);
    return () => clearTimeout(done);
  }, [phase]);

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
          const isHovering = !reducedMotion && hovered && phase === 'settled';

          return (
            <View
              style={[
                {
                  alignSelf: 'flex-start',
                },
                webOnlyStyle({
                  display: 'inline-block',
                  transformOrigin: 'left bottom',
                  willChange: 'transform, opacity',
                  ...(phase === 'idle'
                    ? {
                        transform: [{ scale: 0.97 }],
                        opacity: 0.88,
                      }
                    : null),
                  ...(phase === 'popping'
                    ? {
                        animationName: 'chairside-headline-pop',
                        animationDuration: `${POP_DURATION_MS}ms`,
                        animationTimingFunction: 'cubic-bezier(0.22, 1, 0.36, 1)',
                        animationFillMode: 'forwards',
                        animationIterationCount: 1,
                      }
                    : null),
                  ...(phase === 'settled'
                    ? {
                        transform: [{ scale: isHovering ? 1.08 : 1 }],
                        opacity: 1,
                        transition: `transform ${webMotion.normal} ${webMotion.easingOut}, filter ${webMotion.normal} ${webMotion.easingOut}`,
                        filter: isHovering ? 'brightness(1.06)' : 'brightness(1)',
                      }
                    : null),
                } as object),
              ]}
            >
              <Text style={[style, { color: colors.primary }]}>{HIGHLIGHT_WORD}</Text>
            </View>
          );
        }}
      </Pressable>
    </View>
  );
}
