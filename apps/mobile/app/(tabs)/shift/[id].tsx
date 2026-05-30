import { getLiveShiftPost, hasAppliedToShift, type LiveShiftPost } from '@chairside/api';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, Text, View } from 'react-native';

import { ShiftPostDetailView } from '@/components/clinic/ShiftPostDetailView';
import { RequestedPillBadge } from '@/components/matching/ApplicationStatusBadge';
import { AuthScreenHeader } from '@/components/onboarding/AuthScreenHeader';
import { OnboardingButton } from '@/components/onboarding/OnboardingButton';
import { OnboardingShell } from '@/components/onboarding/OnboardingShell';
import { ClinicPostHeader } from '@/components/worker/ClinicPostHeader';
import { ShiftUrgencyBadge } from '@/components/worker/ShiftUrgencyBadge';
import { useAuth } from '@/contexts/AuthContext';
import { useWorkerProfile } from '@/contexts/WorkerProfileContext';
import { useRefreshOnFocus } from '@/hooks/useRefreshOnFocus';
import { getApplyRoute, navigateAfterWorkerShift } from '@/lib/routing';
import { formatShiftPostMeta, formatShiftPostRoleTitle } from '@/lib/shiftPostDisplay';
import { guardApply } from '@/lib/workerGuard';
import { useThemedStyles } from '@/theme';

export default function WorkerShiftDetailScreen() {
  const { user } = useAuth();
  const { workerProfile, isProfileComplete } = useWorkerProfile();
  const { id, returnTo } = useLocalSearchParams<{ id: string; returnTo?: string }>();
  const shiftId = typeof id === 'string' ? id : '';
  const resolvedReturnTo = typeof returnTo === 'string' ? returnTo : undefined;

  const goBack = useCallback(() => {
    navigateAfterWorkerShift(router, resolvedReturnTo);
  }, [resolvedReturnTo]);
  const [shift, setShift] = useState<LiveShiftPost | null>(null);
  const [hasApplied, setHasApplied] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const styles = useThemedStyles(({ colors, spacing }) => ({
    content: { gap: spacing.lg },
    clinicCard: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.separator,
      padding: spacing.md,
    },
    footer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: spacing.sm,
    },
    compensation: {
      fontSize: 15,
      fontWeight: '600',
      color: colors.primary,
    },
  }));

  const loadShift = useCallback(async () => {
    if (!shiftId) {
      setShift(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const nextShift = await getLiveShiftPost(shiftId);
      if (!nextShift) {
        Alert.alert('Shift not found', 'This fill-in may no longer be available.');
        goBack();
        return;
      }
      setShift(nextShift);

      if (user?.id) {
        const applied = await hasAppliedToShift(user.id, shiftId);
        setHasApplied(applied);
      }
    } catch (error) {
      Alert.alert(
        'Could not load fill-in',
        error instanceof Error ? error.message : 'Please try again.',
      );
      goBack();
    } finally {
      setIsLoading(false);
    }
  }, [goBack, shiftId, user?.id]);

  useRefreshOnFocus(loadShift);

  if (isLoading || !shift) {
    return (
      <OnboardingShell>
        <AuthScreenHeader
          title="Fill-in details"
          subtitle={isLoading ? 'Loading…' : 'Fill-in not found.'}
          onBack={goBack}
        />
      </OnboardingShell>
    );
  }

  const location = [shift.clinic.city, shift.clinic.province].filter(Boolean).join(', ');

  return (
    <OnboardingShell
      footer={
        <OnboardingButton
          label={hasApplied ? 'Requested' : 'Request to cover'}
          disabled={hasApplied}
          onPress={() =>
            guardApply(workerProfile, isProfileComplete, getApplyRoute('shift', shift.id))
          }
        />
      }>
      <AuthScreenHeader
        title="Fill-in details"
        subtitle={shift.clinic.clinic_name}
        onBack={goBack}
      />
      <View style={styles.content}>
        <View style={styles.clinicCard}>
          <ClinicPostHeader
            clinicName={shift.clinic.clinic_name}
            logoStoragePath={shift.clinic.logo_storage_path}
            title={formatShiftPostRoleTitle(shift.role_type)}
            location={location || null}
            detail={formatShiftPostMeta(shift)}
            accessory={<ShiftUrgencyBadge urgency={shift.urgency} />}
            textFooter={hasApplied ? <RequestedPillBadge /> : null}
            footer={
              shift.compensation ? (
                <View style={styles.footer}>
                  <Text style={styles.compensation}>{shift.compensation}</Text>
                </View>
              ) : null
            }
          />
        </View>
        <ShiftPostDetailView shift={shift} softwareUsed={shift.clinic.software_used} />
      </View>
    </OnboardingShell>
  );
}
