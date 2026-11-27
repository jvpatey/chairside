import { Text, View } from 'react-native';
import Animated, { useReducedMotion } from 'react-native-reanimated';

import { ChairsideWordmark } from '@/components/brand/ChairsideWordmark';
import {
  WELCOME_STAGGER,
  enterFadeUp,
} from '@/components/onboarding/onboardingAnimations';
import { fontExtraBold, fontSemibold, useThemedStyles } from '@/theme';

const MOBILE_HEADLINE = 'Fill the chair today.';
const TRUST_LINE = 'Same-day cover by text · Built for Canadian dental teams';
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
    fillIn: {
      color: colors.secondary,
      fontFamily: fontSemibold,
      fontWeight: '600' as const,
    },
    yes: {
      color: colors.labelPrimary,
      fontFamily: fontSemibold,
      fontWeight: '600' as const,
    },
    trust: {
      fontSize: 13,
      lineHeight: 18,
      textAlign: 'center',
      color: colors.labelTertiary,
      maxWidth: 300,
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
          Same-day <Text style={styles.fillIn}>fill-ins</Text> by text — clinics post, professionals{' '}
          <Text style={styles.yes}>Reply YES</Text>, cover gets confirmed.
        </Text>
      </Animated.View>
      <Animated.View entering={enterFadeUp(WELCOME_STAGGER.trust, reducedMotion)}>
        <Text style={styles.trust}>{TRUST_LINE}</Text>
      </Animated.View>
    </View>
  );
}
