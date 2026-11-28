import { Text, View } from 'react-native';
import Animated, { useReducedMotion } from 'react-native-reanimated';

import { ChairsideWordmark } from '@/components/brand/ChairsideWordmark';
import {
  WELCOME_STAGGER,
  enterFadeUp,
} from '@/components/onboarding/onboardingAnimations';
import { fontExtraBold, fontSemibold, useThemedStyles } from '@/theme';

const MOBILE_HEADLINE = 'Fill the chair today.';
export function WelcomeHero() {
  const reducedMotion = useReducedMotion();
  const styles = useThemedStyles(({ colors, spacing, typography }) => ({
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
      fontFamily: fontExtraBold,
      fontWeight: '800',
      fontSize: 38,
      lineHeight: 44,
      textAlign: 'center',
      letterSpacing: -0.6,
      maxWidth: 340,
      marginTop: spacing.xs,
    },
    subtitle: {
      ...typography.subtitle,
      fontSize: 16,
      lineHeight: 23,
      textAlign: 'center',
      maxWidth: 330,
      color: colors.labelSecondary,
    },
    yes: {
      color: colors.labelPrimary,
      fontFamily: fontSemibold,
      fontWeight: '600' as const,
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
        <Text style={styles.subtitle}>
          Post a fill-in and nearby professionals get it by text.{' '}
          <Text style={styles.yes}>You choose who covers.</Text>
        </Text>
      </Animated.View>
    </View>
  );
}
