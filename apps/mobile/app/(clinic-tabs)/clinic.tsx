import { router } from 'expo-router';
import { CLINIC_SETUP_BASICS } from '@/lib/routing';
import { useState } from 'react';
import { Alert, Text, View } from 'react-native';

import { ClinicProfileView } from '@/components/clinic/ClinicProfileView';
import { OnboardingButton } from '@/components/onboarding/OnboardingButton';
import { Screen } from '@/components/ui/Screen';
import { useAuth } from '@/contexts/AuthContext';
import { useClinicProfile } from '@/contexts/ClinicProfileContext';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { useThemedStyles } from '@/theme';

export default function ClinicProfileScreen() {
  const { clinicProfile, isProfileComplete } = useClinicProfile();
  const { signOut } = useAuth();
  const { resetOnboarding } = useOnboarding();
  const [isSigningOut, setIsSigningOut] = useState(false);

  const styles = useThemedStyles(({ colors, spacing, typography }) => ({
    hint: {
      ...typography.subtitle,
      fontSize: 14,
      backgroundColor: colors.primarySubtle,
      borderRadius: 12,
      padding: spacing.md,
      marginBottom: spacing.md,
    },
    actions: {
      gap: spacing.sm,
      marginTop: spacing.lg,
    },
  }));

  const handleSignOut = async () => {
    if (isSigningOut) return;
    setIsSigningOut(true);
    try {
      await signOut();
      await resetOnboarding();
      router.replace('/(onboarding)/welcome');
    } catch (error) {
      Alert.alert(
        'Sign out failed',
        error instanceof Error ? error.message : 'Please try again.',
      );
    } finally {
      setIsSigningOut(false);
    }
  };

  return (
    <Screen title="Clinic" subtitle="Your practice profile and account.">
      {!isProfileComplete ? (
        <Text style={styles.hint}>Finish setup to unlock posting roles and fill-in shifts.</Text>
      ) : null}

      <ClinicProfileView profile={clinicProfile} />

      <View style={styles.actions}>
        <OnboardingButton
          label={isProfileComplete ? 'Edit profile' : 'Complete setup'}
          onPress={() => router.push(CLINIC_SETUP_BASICS)}
        />
        <OnboardingButton
          label={isSigningOut ? 'Signing out…' : 'Sign out'}
          variant="secondary"
          disabled={isSigningOut}
          onPress={handleSignOut}
        />
      </View>
    </Screen>
  );
}
