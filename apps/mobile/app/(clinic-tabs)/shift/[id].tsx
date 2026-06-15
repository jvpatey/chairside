import { getShiftPost, getShiftPostApplicationCount, type ShiftPost } from '@chairside/api';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, View } from 'react-native';

import { ShiftPostDetailView } from '@/components/clinic/ShiftPostDetailView';
import { ShiftPostManageMenu } from '@/components/clinic/ShiftPostManageMenu';
import { AuthScreenHeader } from '@/components/onboarding/AuthScreenHeader';
import { OnboardingButton } from '@/components/onboarding/OnboardingButton';
import { OnboardingShell } from '@/components/onboarding/OnboardingShell';
import { PageLoadingDetail } from '@/components/ui/PageLoadingState';
import { useAuth } from '@/contexts/AuthContext';
import { useRefreshOnFocus } from '@/hooks/useRefreshOnFocus';
import { getClinicShiftApplicantsRoute, getEditShiftRoute, navigateAfterFillInSave, type FillInReturnTarget } from '@/lib/routing';
import { useThemedStyles, type GradientAccent } from '@/theme';

const FILL_IN_ACCENT: GradientAccent = 'secondary';

export default function ShiftDetailScreen() {
  const { user } = useAuth();
  const { id, returnTo } = useLocalSearchParams<{ id: string; returnTo?: FillInReturnTarget }>();
  const shiftId = typeof id === 'string' ? id : '';
  const resolvedReturnTo = (typeof returnTo === 'string' ? returnTo : 'fill-ins-tab') as FillInReturnTarget;
  const [shift, setShift] = useState<ShiftPost | null>(null);
  const [applicationCount, setApplicationCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const styles = useThemedStyles(({ spacing }) => ({
    content: {
      gap: spacing.lg,
    },
    footer: {
      gap: spacing.sm,
    },
    footerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    footerRowButton: {
      flex: 1,
    },
  }));

  const handleBack = useCallback(() => {
    navigateAfterFillInSave(router, resolvedReturnTo);
  }, [resolvedReturnTo]);

  const reviewApplicantsLabel =
    applicationCount === 1 ? 'Review applicant' : `Review ${applicationCount} applicants`;

  const loadShift = useCallback(async () => {
    if (!shiftId || !user?.id) {
      setShift(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const [nextShift, count] = await Promise.all([
        getShiftPost(user.id, shiftId),
        getShiftPostApplicationCount(user.id, shiftId),
      ]);
      if (!nextShift) {
        Alert.alert('Fill-in not found', 'This shift may have been removed.');
        handleBack();
        return;
      }
      setShift(nextShift);
      setApplicationCount(count);
    } catch (error) {
      Alert.alert(
        'Could not load fill-in',
        error instanceof Error ? error.message : 'Please try again.',
      );
      handleBack();
    } finally {
      setIsLoading(false);
    }
  }, [handleBack, shiftId, user?.id]);

  useRefreshOnFocus(loadShift);

  if (isLoading || !shift) {
    return (
      <OnboardingShell>
        <AuthScreenHeader
          title="Fill-in details"
          subtitle={isLoading ? undefined : 'Fill-in not found.'}
          accent={FILL_IN_ACCENT}
          onBack={handleBack}
        />
        {isLoading ? <PageLoadingDetail /> : null}
      </OnboardingShell>
    );
  }

  return (
    <OnboardingShell
      footer={
        <View style={styles.footer}>
          {applicationCount > 0 ? (
            <OnboardingButton
              label={reviewApplicantsLabel}
              accent={FILL_IN_ACCENT}
              onPress={() =>
                router.push(getClinicShiftApplicantsRoute(shift.id, returnTo ?? 'fill-ins-tab'))
              }
            />
          ) : null}
          <View style={styles.footerRow}>
            <OnboardingButton
              style={styles.footerRowButton}
              label="Edit fill-in"
              variant={applicationCount > 0 ? 'secondary' : 'primary'}
              accent={applicationCount > 0 ? 'primary' : FILL_IN_ACCENT}
              onPress={() =>
                router.push(getEditShiftRoute(shift.id, returnTo ?? 'fill-ins-tab'))
              }
            />
            {user?.id ? (
              <ShiftPostManageMenu
                trigger={applicationCount > 0 ? 'icon' : 'button'}
                style={applicationCount > 0 ? undefined : styles.footerRowButton}
                clinicId={user.id}
                shift={shift}
                onUpdated={setShift}
                onDeleted={() => navigateAfterFillInSave(router, resolvedReturnTo)}
              />
            ) : null}
          </View>
        </View>
      }
    >
      <View style={styles.content}>
        <AuthScreenHeader accent={FILL_IN_ACCENT} onBack={handleBack} />
        <ShiftPostDetailView shift={shift} accent={FILL_IN_ACCENT} />
      </View>
    </OnboardingShell>
  );
}
