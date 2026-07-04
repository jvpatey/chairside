import { Text, View } from 'react-native';
import Animated, { useReducedMotion } from 'react-native-reanimated';

import { ChairsideWordmark } from '@/components/brand/ChairsideWordmark';
import {
  WELCOME_STAGGER,
  enterFadeUp,
} from '@/components/onboarding/onboardingAnimations';
import { ONBOARDING_SUBTITLE } from '@/constants';
import { useThemedStyles } from '@/theme';

const MOBILE_HEADLINE = 'Dental staffing, simplified.';

export function WelcomeHero() {
  const reducedMotion = useReducedMotion();
  const styles = useThemedStyles(({ spacing, typography }) => ({
    container: {
      alignItems: 'center',
      gap: spacing.md,
      paddingHorizontal: spacing.sm,
    },
    wordmarkWrap: {
      alignSelf: 'stretch',
      alignItems: 'center',
    },
    headline: {
      ...typography.title,
      fontSize: 31,
      lineHeight: 37,
      textAlign: 'center',
      letterSpacing: -0.4,
      maxWidth: 320,
      marginTop: spacing.xs,
    },
    subtitle: {
      ...typography.subtitle,
      fontSize: 16,
      lineHeight: 23,
      textAlign: 'center',
      maxWidth: 330,
    },
  }));

  return (
    <View style={styles.container}>
      <Animated.View
        entering={enterFadeUp(WELCOME_STAGGER.wordmark, reducedMotion)}
        style={styles.wordmarkWrap}>
        <ChairsideWordmark variant="hero" />
      </Animated.View>
      <Animated.View entering={enterFadeUp(WELCOME_STAGGER.headline, reducedMotion)}>
        <Text style={styles.headline}>{MOBILE_HEADLINE}</Text>
      </Animated.View>
      <Animated.View entering={enterFadeUp(WELCOME_STAGGER.subtitle, reducedMotion)}>
        <Text style={styles.subtitle}>{ONBOARDING_SUBTITLE}</Text>
      </Animated.View>
    </View>
  );
}
