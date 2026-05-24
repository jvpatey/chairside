import { getLiveShiftPost, hasAppliedToShift, type LiveShiftPost } from '@chairside/api';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, Text, View } from 'react-native';

import { ShiftPostDetailView } from '@/components/clinic/ShiftPostDetailView';
import { AuthScreenHeader } from '@/components/onboarding/AuthScreenHeader';
import { OnboardingButton } from '@/components/onboarding/OnboardingButton';
import { OnboardingShell } from '@/components/onboarding/OnboardingShell';
import { useAuth } from '@/contexts/AuthContext';
import { useWorkerProfile } from '@/contexts/WorkerProfileContext';
import { useRefreshOnFocus } from '@/hooks/useRefreshOnFocus';
import { getApplyRoute } from '@/lib/routing';
import { guardApply } from '@/lib/workerGuard';
import { useThemedStyles } from '@/theme';

export default function WorkerShiftDetailScreen() {
  const { user } = useAuth();
  const { workerProfile, isProfileComplete } = useWorkerProfile();
  const { id } = useLocalSearchParams<{ id: string }>();
  const shiftId = typeof id === 'string' ? id : '';
  const [shift, setShift] = useState<LiveShiftPost | null>(null);
  const [hasApplied, setHasApplied] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const styles = useThemedStyles(({ colors, spacing, typography }) => ({
    content: { gap: spacing.lg },
    clinicCard: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.separator,
      padding: spacing.md,
      gap: spacing.xs,
    },
    clinicLabel: {
      fontSize: 12,
      fontWeight: '600',
      letterSpacing: 0.4,
      textTransform: 'uppercase',
      color: colors.primary,
    },
    clinicName: { ...typography.body, fontWeight: '600' },
    clinicMeta: typography.subtitle,
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
        router.back();
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
      router.back();
    } finally {
      setIsLoading(false);
    }
  }, [shiftId, user?.id]);

  useRefreshOnFocus(loadShift);

  if (isLoading || !shift) {
    return (
      <OnboardingShell>
        <AuthScreenHeader
          title="Fill-in details"
          subtitle={isLoading ? 'Loading…' : 'Fill-in not found.'}
          onBack={() => router.back()}
        />
      </OnboardingShell>
    );
  }

  const location = [shift.clinic.city, shift.clinic.province].filter(Boolean).join(', ');

  return (
    <OnboardingShell
      footer={
        <OnboardingButton
          label={hasApplied ? 'Applied' : 'Apply for this shift'}
          disabled={hasApplied}
          onPress={() =>
            guardApply(workerProfile, isProfileComplete, getApplyRoute('shift', shift.id))
          }
        />
      }>
      <AuthScreenHeader title="Fill-in details" subtitle="Temp shift" onBack={() => router.back()} />
      <View style={styles.content}>
        <View style={styles.clinicCard}>
          <Text style={styles.clinicLabel}>Clinic</Text>
          <Text style={styles.clinicName}>{shift.clinic.clinic_name}</Text>
          {location ? <Text style={styles.clinicMeta}>{location}</Text> : null}
        </View>
        <ShiftPostDetailView shift={shift} softwareUsed={shift.clinic.software_used} />
      </View>
    </OnboardingShell>
  );
}
