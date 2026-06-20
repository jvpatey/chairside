import type { WorkerApplication } from '@chairside/api';
import { formatApplicationDate } from '@chairside/config';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Text, View } from 'react-native';

import { ApplicationCardBadge } from '@/components/ui/ApplicationCardBadge';
import { SurfaceCard } from '@/components/ui/SurfaceCard';
import { WorkerApplicationStatusBadge } from '@/components/matching/ApplicationStatusBadge';
import { ClinicPostHeader } from '@/components/worker/ClinicPostHeader';
import { useApplicationTabBadge } from '@/contexts/ApplicationTabBadgeContext';
import { getWorkerApplicationRoute, type WorkerApplicationReturnTarget } from '@/lib/routing';
import { getWorkerShiftApplicationCardDisplay } from '@/lib/workerShiftApplicationDisplay';
import { useTheme, useThemedStyles } from '@/theme';

type WorkerApplicationListCardProps = {
  application: WorkerApplication;
  hasUnreadMessages?: boolean;
  returnTo?: WorkerApplicationReturnTarget;
};

export function WorkerApplicationListCard({
  application,
  hasUnreadMessages = false,
  returnTo = 'applications-tab',
}: WorkerApplicationListCardProps) {
  const { colors } = useTheme();
  const {
    isApplicationHighlighted,
    getApplicationHighlightLabel,
    markApplicationSeen,
  } = useApplicationTabBadge();
  const isShift = application.post_type === 'shift';
  const appliedLabel = formatApplicationDate(application.created_at);

  const isConfirmedShift = isShift && application.status === 'hired';
  const shiftDisplay = isShift ? getWorkerShiftApplicationCardDisplay(application) : null;
  const hasApplicationUpdate = isApplicationHighlighted(application);
  const applicationUpdateLabel = getApplicationHighlightLabel(application);

  const styles = useThemedStyles(({ colors, spacing, typography }) => ({
    trailingRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'flex-end',
      gap: spacing.sm,
    },
    unread: {
      ...typography.subtitle,
      fontSize: 13,
      fontWeight: '600',
      color: colors.primary,
    },
    accessory: {
      alignItems: 'flex-end',
      gap: spacing.xs,
    },
  }));

  const location = shiftDisplay?.location ?? application.clinic_city;
  const appliedOnLabel = appliedLabel
    ? `${isShift ? 'Requested' : 'Applied'} ${appliedLabel}`
    : null;

  const openDetail = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (hasApplicationUpdate) {
      void markApplicationSeen(application.id);
    }
    router.push(getWorkerApplicationRoute(application.id, returnTo));
  };

  return (
    <SurfaceCard
      variant={isConfirmedShift ? 'success' : 'default'}
      padding="md"
      gap
      onPress={openDetail}>
      <ClinicPostHeader
        layout="split"
        headerOnly
        clinicName={application.clinic_name}
        logoStoragePath={application.clinic_logo_storage_path}
        title={shiftDisplay?.title ?? application.post_title}
        location={location}
        postedLabel={appliedOnLabel}
        detail={
          [shiftDisplay?.shiftSchedule ?? null, applicationUpdateLabel]
            .filter(Boolean)
            .join(' · ') || null
        }
        avatarSize={44}
        accessory={
          <View style={styles.accessory}>
            {hasApplicationUpdate ? <ApplicationCardBadge /> : null}
            <WorkerApplicationStatusBadge
              status={application.status}
              postType={application.post_type}
            />
          </View>
        }
      />

      <View style={styles.trailingRow}>
        {hasUnreadMessages ? <Text style={styles.unread}>New message</Text> : null}
        <Ionicons name="chevron-forward" size={18} color={colors.labelTertiary} />
      </View>
    </SurfaceCard>
  );
}
