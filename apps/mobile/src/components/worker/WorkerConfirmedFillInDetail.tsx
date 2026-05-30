import type { WorkerApplication, WorkerAppliedShiftPost } from '@chairside/api';
import { router } from 'expo-router';
import { View } from 'react-native';

import { ShiftPostDetailView } from '@/components/clinic/ShiftPostDetailView';
import { WorkerApplicationStatusBadge } from '@/components/matching/ApplicationStatusBadge';
import { OnboardingButton } from '@/components/onboarding/OnboardingButton';
import { ClinicPostHeader } from '@/components/worker/ClinicPostHeader';
import { WorkerClinicDetailView } from '@/components/worker/WorkerClinicDetailView';
import {
  getWorkerApplicationMessagesRoute,
  type WorkerApplicationReturnTarget,
} from '@/lib/routing';
import { formatShiftPostMeta, formatShiftPostRoleTitle } from '@/lib/shiftPostDisplay';
import { useThemedStyles } from '@/theme';

type WorkerConfirmedFillInDetailProps = {
  application: WorkerApplication;
  shift: WorkerAppliedShiftPost;
  returnTo?: WorkerApplicationReturnTarget;
  hasUnreadMessages?: boolean;
};

export function WorkerConfirmedFillInDetail({
  application,
  shift,
  returnTo = 'fill-ins-tab',
  hasUnreadMessages = false,
}: WorkerConfirmedFillInDetailProps) {
  const styles = useThemedStyles(({ colors, spacing }) => ({
    wrap: { gap: spacing.lg },
    heroCard: {
      backgroundColor: `${colors.success}10`,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: `${colors.success}40`,
      padding: spacing.md,
    },
  }));

  const location = [
    shift.clinic.address_line1,
    shift.clinic.city,
    shift.clinic.province,
    shift.clinic.postal_code,
  ]
    .filter(Boolean)
    .join(' · ');

  const handleMessage = () => {
    router.push(getWorkerApplicationMessagesRoute(application.id, returnTo));
  };

  return (
    <View style={styles.wrap}>
      <View style={styles.heroCard}>
        <ClinicPostHeader
          clinicName={shift.clinic.clinic_name}
          logoStoragePath={shift.clinic.logo_storage_path}
          title={formatShiftPostRoleTitle(shift.role_type)}
          location={location || null}
          detail={formatShiftPostMeta(shift)}
          avatarSize={48}
          textFooter={
            <WorkerApplicationStatusBadge status={application.status} postType="shift" />
          }
        />
      </View>

      <ShiftPostDetailView
        shift={shift}
        softwareUsed={shift.clinic.software_used}
        showStatusBadge={false}
      />

      <WorkerClinicDetailView clinic={shift.clinic} />

      <OnboardingButton
        label={hasUnreadMessages ? 'Message clinic · New' : 'Message clinic'}
        onPress={handleMessage}
      />
    </View>
  );
}
