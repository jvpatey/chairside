import { router } from 'expo-router';
import { CLINIC_SETUP_BASICS } from '@/lib/routing';
import { Text, View } from 'react-native';

import { ClinicProfileView } from '@/components/clinic/ClinicProfileView';
import { OnboardingButton } from '@/components/onboarding/OnboardingButton';
import { Screen } from '@/components/ui/Screen';
import { useClinicProfile } from '@/contexts/ClinicProfileContext';
import { useThemedStyles } from '@/theme';

export default function ClinicProfileScreen() {
  const { clinicProfile, isProfileComplete } = useClinicProfile();

  const styles = useThemedStyles(({ colors, spacing, typography }) => ({
    hint: {
      ...typography.subtitle,
      fontSize: 14,
      lineHeight: 20,
      color: colors.labelSecondary,
      backgroundColor: colors.primarySubtle,
      borderRadius: 12,
      padding: spacing.md,
      marginBottom: spacing.sm,
    },
    actions: {
      gap: spacing.sm,
      marginTop: spacing.md,
    },
  }));

  return (
    <Screen title="Clinic" showHeader={false}>
      {!isProfileComplete ? (
        <Text style={styles.hint}>Finish setup to unlock posting roles and fill-in shifts.</Text>
      ) : null}

      <ClinicProfileView profile={clinicProfile} isProfileComplete={isProfileComplete} />

      <View style={styles.actions}>
        <OnboardingButton
          label={isProfileComplete ? 'Edit clinic' : 'Complete setup'}
          onPress={() => router.push(CLINIC_SETUP_BASICS)}
        />
      </View>
    </Screen>
  );
}
