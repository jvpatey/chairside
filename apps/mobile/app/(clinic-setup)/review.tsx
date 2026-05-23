import { completeClinicSetup, getMissingClinicProfileFields } from '@chairside/api';
import { SPECIALTY_OPTIONS } from '@chairside/config';
import { router } from 'expo-router';
import { CLINIC_HOME } from '@/lib/routing';
import { useState } from 'react';
import { Alert, Text, View } from 'react-native';

import { AuthScreenHeader } from '@/components/onboarding/AuthScreenHeader';
import { OnboardingButton } from '@/components/onboarding/OnboardingButton';
import { OnboardingShell } from '@/components/onboarding/OnboardingShell';
import { useAuth } from '@/contexts/AuthContext';
import { useClinicProfile } from '@/contexts/ClinicProfileContext';
import { useThemedStyles } from '@/theme';

function ReviewRow({ label, value }: { label: string; value: string }) {
  const styles = useThemedStyles(({ colors, spacing, typography }) => ({
    row: {
      gap: spacing.xs,
      paddingVertical: spacing.sm,
      borderBottomWidth: 1,
      borderBottomColor: colors.separator,
    },
    label: {
      fontSize: 13,
      fontWeight: '600',
      color: typography.subtitle.color,
    },
    value: typography.body,
  }));

  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value || '—'}</Text>
    </View>
  );
}

export default function ClinicReviewScreen() {
  const { user } = useAuth();
  const { clinicProfile, isClinicProfileReady, refreshClinicProfile } = useClinicProfile();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const styles = useThemedStyles(({ colors, spacing }) => ({
    card: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.separator,
      padding: spacing.lg,
    },
    footer: { gap: spacing.md, marginTop: spacing.lg },
    step: { marginBottom: spacing.sm },
  }));

  const specialtyLabel =
    SPECIALTY_OPTIONS.find((item) => item.value === clinicProfile?.specialty)?.label ??
    'General dentistry';

  const handleFinish = async () => {
    if (!user?.id) return;

    const missing = getMissingClinicProfileFields(clinicProfile);
    if (missing.length > 0) {
      Alert.alert('Profile incomplete', `Still needed: ${missing.join(', ')}`);
      return;
    }

    setIsSubmitting(true);
    try {
      await completeClinicSetup(user.id);
      await refreshClinicProfile();
      router.replace(CLINIC_HOME);
    } catch (error) {
      Alert.alert(
        'Could not finish setup',
        error instanceof Error ? error.message : 'Please try again.',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isClinicProfileReady || !clinicProfile) return null;

  return (
    <OnboardingShell
      footer={
        <View style={styles.footer}>
          <OnboardingButton
            label={isSubmitting ? 'Finishing…' : 'Finish setup'}
            disabled={isSubmitting}
            onPress={handleFinish}
          />
        </View>
      }>
      <AuthScreenHeader
        title="Review your profile"
        subtitle="Confirm everything looks right before posting."
        onBack={() => router.back()}
      />
      <Text style={styles.step}>Step 5 of 5</Text>
      <View style={styles.card}>
        <ReviewRow label="Clinic name" value={clinicProfile.clinic_name} />
        <ReviewRow label="Contact" value={clinicProfile.contact_name ?? ''} />
        <ReviewRow label="Phone" value={clinicProfile.phone ?? ''} />
        <ReviewRow
          label="Address"
          value={[clinicProfile.address_line1, clinicProfile.city, clinicProfile.postal_code]
            .filter(Boolean)
            .join(', ')}
        />
        <ReviewRow label="Specialty" value={specialtyLabel} />
        <ReviewRow label="Software" value={clinicProfile.software_used.join(', ')} />
        <ReviewRow label="Description" value={clinicProfile.description ?? ''} />
      </View>
    </OnboardingShell>
  );
}
