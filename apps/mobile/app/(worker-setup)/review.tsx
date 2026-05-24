import { completeWorkerSetup, getMissingWorkerProfileFields } from '@chairside/api';
import {
  formatWorkerEducation,
  getProvinceLabel,
  getRoleTypeLabel,
  getTravelRadiusRangeLabel,
} from '@chairside/config';
import { Redirect, router } from 'expo-router';
import { WORKER_HOME, WORKER_PROFILE } from '@/lib/routing';
import { useState } from 'react';
import { Alert, Text, View } from 'react-native';

import { AuthScreenHeader } from '@/components/onboarding/AuthScreenHeader';
import { OnboardingButton } from '@/components/onboarding/OnboardingButton';
import { OnboardingShell } from '@/components/onboarding/OnboardingShell';
import { useAuth } from '@/contexts/AuthContext';
import { useWorkerProfile } from '@/contexts/WorkerProfileContext';
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

export default function WorkerReviewScreen() {
  const { user } = useAuth();
  const { workerProfile, isWorkerProfileReady, refreshWorkerProfile } = useWorkerProfile();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEditing = Boolean(workerProfile?.setup_completed_at);

  const styles = useThemedStyles(({ colors, spacing }) => ({
    card: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.separator,
      padding: spacing.lg,
    },
    footer: { gap: spacing.md, marginTop: spacing.lg },
  }));

  if (isEditing) {
    return <Redirect href={WORKER_PROFILE} />;
  }

  const handleFinish = async () => {
    if (!user?.id) return;

    const missing = getMissingWorkerProfileFields(workerProfile);
    if (missing.length > 0) {
      Alert.alert('Profile incomplete', `Add the following: ${missing.join(', ')}`);
      return;
    }

    setIsSubmitting(true);
    try {
      await completeWorkerSetup(user.id);
      await refreshWorkerProfile();
      router.replace(WORKER_HOME);
    } catch (error) {
      Alert.alert(
        'Could not finish setup',
        error instanceof Error ? error.message : 'Please try again.',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isWorkerProfileReady) return null;

  const cityLine = [workerProfile?.city, getProvinceLabel(workerProfile?.province ?? 'NS')]
    .filter(Boolean)
    .join(', ');

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
        title="Review profile"
        subtitle="Confirm your professional background before browsing roles."
        onBack={() => router.back()}
      />
      <View style={styles.card}>
        <ReviewRow
          label="Role"
          value={workerProfile?.role_type ? getRoleTypeLabel(workerProfile.role_type) : ''}
        />
        <ReviewRow
          label="Experience"
          value={
            workerProfile?.years_of_experience != null
              ? `${workerProfile.years_of_experience} years`
              : ''
          }
        />
        <ReviewRow
          label="Education"
          value={workerProfile ? formatWorkerEducation(workerProfile) : ''}
        />
        <ReviewRow label="Location" value={cityLine} />
        <ReviewRow
          label="Travel distance"
          value={getTravelRadiusRangeLabel(workerProfile?.travel_radius_range)}
        />
      </View>
    </OnboardingShell>
  );
}
