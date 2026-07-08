import { completeWorkerSetup, getMissingWorkerProfileFields, getWorkerRoleTypes } from '@chairside/api';
import {
  formatWorkerEducation,
  getProvinceLabel,
  formatRoleTypesLabel,
  getTravelRadiusRangeLabel,
} from '@chairside/config';
import { Redirect, router } from 'expo-router';
import { WORKER_HOME } from '@/lib/routing';
import { useState } from 'react';
import { Text, View } from 'react-native';

import { AuthScreenHeader } from '@/components/onboarding/AuthScreenHeader';
import { OnboardingButton } from '@/components/onboarding/OnboardingButton';
import { OnboardingShell } from '@/components/onboarding/OnboardingShell';
import { SetupStepProgress } from '@/components/onboarding/SetupStepProgress';
import { FormErrorBanner } from '@/components/ui/FormErrorBanner';
import { useAuth } from '@/contexts/AuthContext';
import { useWorkerProfile } from '@/contexts/WorkerProfileContext';
import { useWorkerSetupStepGuard } from '@/hooks/useSetupStepGuard';
import { useSetupEditMode } from '@/hooks/useSetupEditMode';
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
  const { user, profile } = useAuth();
  const { workerProfile, isWorkerProfileReady, refreshWorkerProfile } = useWorkerProfile();
  const { isEditMode, exitHref } = useSetupEditMode({ role: 'worker' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useWorkerSetupStepGuard('review', workerProfile, profile?.display_name, isWorkerProfileReady, isEditMode);

  const missingFields = getMissingWorkerProfileFields(workerProfile);

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

  if (isEditMode) {
    return <Redirect href={exitHref} />;
  }

  const handleFinish = async () => {
    if (!user?.id) {
      setSubmitError('You must be signed in to finish setup.');
      return;
    }

    const missing = getMissingWorkerProfileFields(workerProfile);
    if (missing.length > 0) {
      setSubmitError(`Still needed: ${missing.join(', ')}`);
      return;
    }

    setSubmitError(null);
    setIsSubmitting(true);
    try {
      await completeWorkerSetup(user.id);
      await refreshWorkerProfile();
      router.replace(WORKER_HOME);
    } catch (error) {
      setSubmitError(
        error instanceof Error ? error.message : 'Could not finish setup. Please try again.',
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
      atmosphere="form"
      footer={
        <View style={styles.footer}>
          {submitError || missingFields.length > 0 ? (
            <FormErrorBanner
              message={
                submitError ??
                `Still needed: ${missingFields.join(', ')}. Go back to an earlier step to add them.`
              }
            />
          ) : null}
          <OnboardingButton
            label={isSubmitting ? 'Finishing…' : 'Finish setup'}
            disabled={isSubmitting || missingFields.length > 0}
            onPress={handleFinish}
          />
        </View>
      }>
      <AuthScreenHeader
        title="Review profile"
        subtitle="Confirm your professional background before browsing roles."
        onBack={() => router.back()}
      />
      <SetupStepProgress step={5} total={5} />
      <View style={styles.card}>
        <ReviewRow
          label="Roles"
          value={formatRoleTypesLabel(getWorkerRoleTypes(workerProfile))}
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
