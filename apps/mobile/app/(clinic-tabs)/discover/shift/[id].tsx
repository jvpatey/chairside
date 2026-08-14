import { getClinicDiscoverShiftPost, type LiveShiftPost } from '@chairside/api';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, View } from 'react-native';

import { ShiftPostDetailView } from '@/components/clinic/ShiftPostDetailView';
import { OnboardingButton } from '@/components/onboarding/OnboardingButton';
import { FormScreen } from '@/components/ui/FormScreen';
import { PageLoadingDetail } from '@/components/ui/PageLoadingState';
import { SurfaceCard } from '@/components/ui/SurfaceCard';
import { ClinicPostHeader } from '@/components/worker/ClinicPostHeader';
import { ShiftUrgencyBadge } from '@/components/worker/ShiftUrgencyBadge';
import { useAuth } from '@/contexts/AuthContext';
import { useRefreshOnFocus } from '@/hooks/useRefreshOnFocus';
import { getClinicDiscoverClinicProfileRoute } from '@/lib/routing';
import { formatShiftPostMeta, formatShiftPostRoleTitle } from '@/lib/shiftPostDisplay';
import { useThemedStyles } from '@/theme';

export default function ClinicDiscoverShiftDetailScreen() {
  const { user } = useAuth();
  const { id } = useLocalSearchParams<{ id: string }>();
  const shiftId = typeof id === 'string' ? id : '';
  const [shift, setShift] = useState<LiveShiftPost | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const styles = useThemedStyles(({ spacing }) => ({
    content: {
      gap: spacing.lg,
    },
    accessoryColumn: {
      alignItems: 'flex-end',
      gap: spacing.xs,
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
      const nextShift = await getClinicDiscoverShiftPost(shiftId, user.id);
      if (!nextShift) {
        Alert.alert('Fill-in not found', 'This posting may no longer be available.');
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
      <FormScreen
        title="Fill-in details"
        subtitle={isLoading ? undefined : 'Fill-in not found.'}
        onBack={() => router.back()}>
        {isLoading ? <PageLoadingDetail /> : null}
      </FormScreen>
    );
  }

  const location = [shift.clinic.city, shift.clinic.province].filter(Boolean).join(', ');

  return (
    <FormScreen
      eyebrow="Discover"
      title="Fill-in details"
      subtitle={shift.clinic.clinic_name}
      onBack={() => router.back()}
      accent="secondary">
      <View style={styles.content}>
        <SurfaceCard>
          <ClinicPostHeader
            layout="split"
            clinicName={shift.clinic.clinic_name}
            logoStoragePath={shift.clinic.logo_storage_path}
            title={formatShiftPostRoleTitle(shift.role_type)}
            location={location || null}
            detail={formatShiftPostMeta(shift)}
            avatarSize={44}
            accessory={
              <View style={styles.accessoryColumn}>
                <ShiftUrgencyBadge urgency={shift.urgency} />
              </View>
            }
            stackedAccessory
          />
        </SurfaceCard>
        <ShiftPostDetailView shift={shift} />
        <OnboardingButton
          label="View clinic profile"
          accent="secondary"
          onPress={() =>
            router.push(
              getClinicDiscoverClinicProfileRoute(shift.clinic_id, { fromShiftId: shift.id }),
            )
          }
        />
      </View>
    </FormScreen>
  );
}
