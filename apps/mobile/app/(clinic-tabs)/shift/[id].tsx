import { getShiftPost, type ShiftPost } from '@chairside/api';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, View } from 'react-native';

import { ShiftPostDetailView } from '@/components/clinic/ShiftPostDetailView';
import { ShiftPostManageMenu } from '@/components/clinic/ShiftPostManageMenu';
import { AuthScreenHeader } from '@/components/onboarding/AuthScreenHeader';
import { OnboardingButton } from '@/components/onboarding/OnboardingButton';
import { OnboardingShell } from '@/components/onboarding/OnboardingShell';
import { useAuth } from '@/contexts/AuthContext';
import { useRefreshOnFocus } from '@/hooks/useRefreshOnFocus';
import {
  getClinicHomeRoute,
  getClinicPostingsRoute,
  getEditShiftRoute,
  type FillInReturnTarget,
} from '@/lib/routing';
import { useThemedStyles } from '@/theme';

export default function ShiftDetailScreen() {
  const { user } = useAuth();
  const { id, returnTo } = useLocalSearchParams<{ id: string; returnTo?: FillInReturnTarget }>();
  const shiftId = typeof id === 'string' ? id : '';
  const [shift, setShift] = useState<ShiftPost | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const styles = useThemedStyles(({ spacing }) => ({
    content: {
      gap: spacing.lg,
    },
    footer: {
      flexDirection: 'row',
      gap: spacing.sm,
    },
    footerButton: {
      flex: 1,
    },
  }));

  const loadShift = useCallback(async () => {
    if (!shiftId || !user?.id) {
      setShift(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const nextShift = await getShiftPost(user.id, shiftId);
      if (!nextShift) {
        Alert.alert('Fill-in not found', 'This shift may have been removed.');
        router.back();
        return;
      }
      setShift(nextShift);
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

  return (
    <OnboardingShell
      footer={
        <View style={styles.footer}>
          {user?.id ? (
            <ShiftPostManageMenu
              style={styles.footerButton}
              clinicId={user.id}
              shift={shift}
              onUpdated={setShift}
              onDeleted={() =>
                router.replace(
                  returnTo === 'dashboard-fill-ins'
                    ? getClinicHomeRoute('fill-ins')
                    : getClinicPostingsRoute('fill-ins'),
                )
              }
            />
          ) : null}
          <OnboardingButton
            style={styles.footerButton}
            label="Edit fill-in"
            onPress={() => router.push(getEditShiftRoute(shift.id, returnTo ?? 'postings-fill-ins'))}
          />
        </View>
      }
    >
      <View style={styles.content}>
        <AuthScreenHeader onBack={() => router.back()} />
        <ShiftPostDetailView shift={shift} />
      </View>
    </OnboardingShell>
  );
}
