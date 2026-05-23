import { SPECIALTY_OPTIONS } from '@chairside/config';
import { router } from 'expo-router';
import { CLINIC_SETUP_BASICS } from '@/lib/routing';
import { useState } from 'react';
import { Alert, Text, View } from 'react-native';

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
    card: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.separator,
      padding: spacing.lg,
      gap: spacing.sm,
      marginBottom: spacing.md,
    },
    label: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.labelSecondary,
    },
    value: {
      ...typography.body,
      fontWeight: '600',
    },
    hint: typography.subtitle,
    actions: { gap: spacing.sm },
  }));

  const specialtyLabel =
    SPECIALTY_OPTIONS.find((item) => item.value === clinicProfile?.specialty)?.label ??
    'General dentistry';

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
      <View style={styles.card}>
        <Text style={styles.label}>Clinic name</Text>
        <Text style={styles.value}>{clinicProfile?.clinic_name || '—'}</Text>
        <Text style={styles.label}>Specialty</Text>
        <Text style={styles.value}>{specialtyLabel}</Text>
        <Text style={styles.label}>Location</Text>
        <Text style={styles.value}>
          {[clinicProfile?.address_line1, clinicProfile?.city, clinicProfile?.postal_code]
            .filter(Boolean)
            .join(', ') || '—'}
        </Text>
        <Text style={styles.label}>Software</Text>
        <Text style={styles.value}>
          {clinicProfile?.software_used?.length
            ? clinicProfile.software_used.join(', ')
            : '—'}
        </Text>
        {!isProfileComplete ? (
          <Text style={styles.hint}>Finish setup to unlock posting.</Text>
        ) : null}
      </View>

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
