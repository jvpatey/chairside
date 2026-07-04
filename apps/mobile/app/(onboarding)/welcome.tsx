import { router } from 'expo-router';
import { View } from 'react-native';
import Animated, { useReducedMotion } from 'react-native-reanimated';

import { OnboardingButton } from '@/components/onboarding/OnboardingButton';
import { WELCOME_STAGGER, enterFadeUp } from '@/components/onboarding/onboardingAnimations';
import { OnboardingShell } from '@/components/onboarding/OnboardingShell';
import { WelcomeHero } from '@/components/onboarding/WelcomeHero';
import { WelcomeHeroGlow } from '@/components/onboarding/WelcomeHeroGlow';
import { useThemedStyles } from '@/theme';

export default function WelcomeScreen() {
  const reducedMotion = useReducedMotion();
  const styles = useThemedStyles(({ spacing }) => ({
    body: {
      flex: 1,
      minHeight: 0,
      justifyContent: 'center' as const,
    },
    hero: {
      paddingVertical: spacing.md,
    },
    actions: {
      gap: spacing.md,
    },
  }));

  return (
    <OnboardingShell
      fillViewport
      backgroundAccessory={<WelcomeHeroGlow />}
      footer={
        <View style={styles.actions}>
          <Animated.View entering={enterFadeUp(WELCOME_STAGGER.primaryCta, reducedMotion)}>
            <OnboardingButton
              label="Get started"
              onPress={() => router.push('/(onboarding)/role')}
            />
          </Animated.View>
          <Animated.View entering={enterFadeUp(WELCOME_STAGGER.secondaryCta, reducedMotion)}>
            <OnboardingButton
              label="Sign in"
              variant="secondary"
              onPress={() => router.push('/(onboarding)/sign-in')}
            />
          </Animated.View>
        </View>
      }
    >
      <View style={styles.body}>
        <View style={styles.hero}>
          <WelcomeHero />
        </View>
      </View>
    </OnboardingShell>
  );
}
