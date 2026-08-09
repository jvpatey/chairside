import { completeWorkerSetup, getMissingWorkerProfileFields, getWorkerRoleTypes, joinDisplayName } from '@chairside/api';
import {
  formatWorkerEducation,
  formatRoleTypesLabel,
  getEmploymentTypeLabel,
  getProvinceLabel,
  getSpecialtyLabel,
  getTravelRadiusRangeLabel,
} from '@chairside/config';
import { Redirect, router } from 'expo-router';
import { WORKER_HOME_WELCOME } from '@/lib/routing';
import { useState } from 'react';
import { Text, View } from 'react-native';

import { OnboardingButton } from '@/components/onboarding/OnboardingButton';
import { SetupStepProgress } from '@/components/onboarding/SetupStepProgress';
import { FormErrorBanner } from '@/components/ui/FormErrorBanner';
import { FormScreen } from '@/components/ui/FormScreen';
import { SurfaceCard } from '@/components/ui/SurfaceCard';
import { WorkerProfileAvatar } from '@/components/worker/WorkerProfileAvatar';
import { useAuth } from '@/contexts/AuthContext';
import { useWorkerProfile } from '@/contexts/WorkerProfileContext';
import { useSetupFormScreenProps } from '@/hooks/useSetupFormScreenProps';
import { useSetupStepProgress } from '@/hooks/useSetupStepProgress';
import { useWorkerSetupStepGuard } from '@/hooks/useSetupStepGuard';
import { useSetupEditMode } from '@/hooks/useSetupEditMode';
import { useWorkerPhotoUri } from '@/hooks/useWorkerPhotoUri';
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
  const setupFormProps = useSetupFormScreenProps('worker');
  const progress = useSetupStepProgress('review', { role: 'worker' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useWorkerSetupStepGuard(
    'review',
    workerProfile,
    profile?.first_name,
    profile?.last_name,
    isWorkerProfileReady,
    isEditMode,
  );

  const missingFields = getMissingWorkerProfileFields(workerProfile);
  const photoUri = useWorkerPhotoUri(workerProfile?.photo_storage_path);

  const styles = useThemedStyles(({ colors, spacing, typography }) => ({
    footer: { gap: spacing.md, marginTop: spacing.lg },
    profileHeader: {
      alignItems: 'center',
      gap: spacing.sm,
      paddingBottom: spacing.md,
      marginBottom: spacing.sm,
      borderBottomWidth: 1,
      borderBottomColor: colors.separator,
    },
    profileName: {
      ...typography.title,
      fontSize: 20,
      textAlign: 'center',
    },
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
      router.replace(WORKER_HOME_WELCOME);
    } catch (error) {
      setSubmitError(
        error instanceof Error ? error.message : 'Could not finish setup. Please try again.',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isWorkerProfileReady) return null;

  const displayName = joinDisplayName(profile?.first_name, profile?.last_name);
  const address = [
    workerProfile?.address_line1,
    workerProfile?.address_line2,
    workerProfile?.city,
    workerProfile?.province ? getProvinceLabel(workerProfile.province) : null,
    workerProfile?.postal_code,
  ]
    .filter(Boolean)
    .join(', ');
  const softwareLabel =
    workerProfile?.software_used && workerProfile.software_used.length > 0
      ? workerProfile.software_used.join(', ')
      : '';
  const practiceTypesLabel =
    workerProfile?.practice_types && workerProfile.practice_types.length > 0
      ? workerProfile.practice_types.map(getSpecialtyLabel).join(', ')
      : '';
  const employmentLabel =
    workerProfile?.preferred_employment_types &&
    workerProfile.preferred_employment_types.length > 0
      ? workerProfile.preferred_employment_types.map(getEmploymentTypeLabel).join(', ')
      : '';

  return (
    <FormScreen
      {...setupFormProps}
      title="Review profile"
      subtitle="Confirm your professional background before browsing roles."
      onBack={() => router.back()}
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
      {progress.visible ? (
        <SetupStepProgress step={progress.step} total={progress.total} />
      ) : null}
      <SurfaceCard padding="lg">
        <View style={styles.profileHeader}>
          <WorkerProfileAvatar displayName={displayName} photoUri={photoUri} size={80} />
          <Text style={styles.profileName}>{displayName}</Text>
        </View>
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
        <ReviewRow label="Software" value={softwareLabel} />
        <ReviewRow label="Practice types" value={practiceTypesLabel} />
        <ReviewRow label="Preferred employment" value={employmentLabel} />
        <ReviewRow label="Address" value={address} />
        <ReviewRow
          label="Travel distance"
          value={getTravelRadiusRangeLabel(workerProfile?.travel_radius_range)}
        />
        <ReviewRow label="Bio" value={workerProfile?.bio ?? ''} />
      </SurfaceCard>
    </FormScreen>
  );
}
