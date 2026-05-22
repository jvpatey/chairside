import { router } from 'expo-router';
import { View } from 'react-native';

import { OnboardingButton } from '@/components/onboarding/OnboardingButton';
import { OnboardingShell } from '@/components/onboarding/OnboardingShell';
import { WelcomeHero } from '@/components/onboarding/WelcomeHero';
import { useThemedStyles } from '@/theme';

export default function WelcomeScreen() {
  const styles = useThemedStyles(({ spacing }) => ({
    hero: {
      flex: 1,
      justifyContent: 'center',
      paddingVertical: spacing.xl,
    },
    actions: {
      gap: spacing.md,
    },
  }));

  return (
    <OnboardingShell
      footer={
        <View style={styles.actions}>
          <OnboardingButton
            label="Get started"
            onPress={() => router.push('/(onboarding)/role')}
          />
          <OnboardingButton
            label="Sign in"
            variant="secondary"
            onPress={() => router.push('/(onboarding)/sign-in')}
          />
        </View>
      }>
      <View style={styles.hero}>
        <WelcomeHero />
      </View>
    </OnboardingShell>
  );
}
