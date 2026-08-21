import { completeClinicSetup, getMissingClinicProfileFields } from '@chairside/api';
import { SPECIALTY_OPTIONS, getTeamSizeRangeLabel } from '@chairside/config';
import { Redirect, router } from 'expo-router';
import { CLINIC_HOME_WELCOME } from '@/lib/routing';
import { useState } from 'react';
import { Text, View } from 'react-native';

import { OnboardingButton } from '@/components/onboarding/OnboardingButton';
import { SetupStepProgress } from '@/components/onboarding/SetupStepProgress';
import { PracticeDoctorReviewSection } from '@/components/clinic/PracticeDoctorList';
import { SetupBillingUpsellLink } from '@/components/billing/SetupBillingUpsellLink';
import { FormErrorBanner } from '@/components/ui/FormErrorBanner';
import { FormScreen } from '@/components/ui/FormScreen';
import { SurfaceCard } from '@/components/ui/SurfaceCard';
import { useAuth } from '@/contexts/AuthContext';
import { useClinicProfile } from '@/contexts/ClinicProfileContext';
import { useClinicSetupStepGuard } from '@/hooks/useSetupStepGuard';
import { useSetupEditMode } from '@/hooks/useSetupEditMode';
import { useSetupFormScreenProps } from '@/hooks/useSetupFormScreenProps';
import { useSetupStepProgress } from '@/hooks/useSetupStepProgress';
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
  const {
    clinicProfile,
    isClinicProfileReady,
    refreshClinicProfile,
    isGroup,
    locations,
  } = useClinicProfile();
  const { isEditMode, exitHref } = useSetupEditMode({ role: 'clinic' });
  const setupFormProps = useSetupFormScreenProps('clinic');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFinishing, setIsFinishing] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const progress = useSetupStepProgress('review', { role: 'clinic' });
  const activeLocations = locations.filter((location) => location.is_active);

  useClinicSetupStepGuard('review', clinicProfile, isClinicProfileReady, isEditMode);

  const missingFields = getMissingClinicProfileFields(clinicProfile, {
    locations: activeLocations,
  });

  const styles = useThemedStyles(({ spacing }) => ({
    footer: { gap: spacing.md, marginTop: spacing.lg },
  }));

  const specialtyLabel =
    SPECIALTY_OPTIONS.find((item) => item.value === clinicProfile?.specialty)?.label ??
    'General dentistry';

  const handleFinish = async () => {
    if (!user?.id) {
      setSubmitError('You must be signed in to finish setup.');
      return;
    }

    const missing = getMissingClinicProfileFields(clinicProfile, {
      locations: activeLocations,
    });
    if (missing.length > 0) {
      setSubmitError(`Still needed: ${missing.join(', ')}`);
      return;
    }

    setSubmitError(null);
    setIsFinishing(true);
    setIsSubmitting(true);
    try {
      await completeClinicSetup(user.id);
      router.replace(CLINIC_HOME_WELCOME);
      void refreshClinicProfile();
    } catch (error) {
      setIsFinishing(false);
      setSubmitError(
        error instanceof Error ? error.message : 'Could not finish setup. Please try again.',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isClinicProfileReady || !clinicProfile) return null;

  // Finishing stamps setup_completed_at, which would otherwise look like
  // edit-mode and bounce to Profile instead of the dashboard welcome.
  if (isEditMode && !isFinishing) {
    return <Redirect href={exitHref} />;
  }

  return (
    <FormScreen
      {...setupFormProps}
      title={isGroup ? 'Review your group' : 'Review your profile'}
      subtitle={
        isGroup
          ? 'Confirm your locations look right before going live.'
          : 'Confirm everything looks right before posting.'
      }
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
        <ReviewRow
          label={isGroup ? 'Group name' : 'Clinic name'}
          value={clinicProfile.clinic_name}
        />
        <ReviewRow label="Contact" value={clinicProfile.contact_name ?? ''} />
        <ReviewRow label="Phone" value={clinicProfile.phone ?? ''} />
        {isGroup ? (
          <ReviewRow
            label={activeLocations.length === 1 ? 'Location' : 'Locations'}
            value={
              activeLocations
                .map((location) =>
                  [location.name, location.city].filter(Boolean).join(' · '),
                )
                .join(', ') || ''
            }
          />
        ) : (
          <>
            <ReviewRow
              label="Address"
              value={[clinicProfile.address_line1, clinicProfile.city, clinicProfile.postal_code]
                .filter(Boolean)
                .join(', ')}
            />
            <ReviewRow label="Specialty" value={specialtyLabel} />
            <ReviewRow
              label="Operatories"
              value={clinicProfile.operatories_count?.toString() ?? ''}
            />
            <ReviewRow
              label="Team size"
              value={getTeamSizeRangeLabel(clinicProfile.team_size_range) ?? ''}
            />
            <ReviewRow label="Software" value={clinicProfile.software_used.join(', ')} />
          </>
        )}
        <PracticeDoctorReviewSection
          doctors={clinicProfile.practice_doctors ?? []}
          locations={activeLocations.map((location) => ({ id: location.id, name: location.name }))}
        />
        <ReviewRow label="Description" value={clinicProfile.description ?? ''} />
      </SurfaceCard>
      <SetupBillingUpsellLink
        label={
          isGroup
            ? 'Need more locations, managers, or hiring tools? View plans'
            : 'Want hiring tools on day one? View plans'
        }
        focus={isGroup ? 'group' : 'clinic'}
      />
    </FormScreen>
  );
}
