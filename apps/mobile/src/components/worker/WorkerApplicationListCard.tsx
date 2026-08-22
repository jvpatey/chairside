import type { WorkerApplication } from '@chairside/api';
import { formatApplicationDate } from '@chairside/config';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Text, View } from 'react-native';

import { ApplicationCardBadge } from '@/components/ui/ApplicationCardBadge';
import { SurfaceCard } from '@/components/ui/SurfaceCard';
import { WorkerApplicationStatusLabel } from '@/components/matching/ApplicationStatusBadge';
import { ClinicPostHeader } from '@/components/worker/ClinicPostHeader';
import { useApplicationTabBadge } from '@/contexts/ApplicationTabBadgeContext';
import { getWorkerApplicationRoute, type WorkerApplicationReturnTarget } from '@/lib/routing';
import {
  formatWorkerApplicationCardLocation,
  getWorkerApplicationCardDetail,
  getWorkerApplicationCardStatusLabel,
} from '@/lib/workerApplicationCardDetail';
import { getWorkerShiftApplicationCardDisplay } from '@/lib/workerShiftApplicationDisplay';
import { useTheme, useThemedStyles } from '@/theme';

type WorkerApplicationListCardProps = {
  application: WorkerApplication;
  hasUnreadMessages?: boolean;
  returnTo?: WorkerApplicationReturnTarget;
  compact?: boolean;
  embedded?: boolean;
  selected?: boolean;
  onSelect?: (applicationId: string) => void;
};

export function WorkerApplicationListCard({
  application,
  hasUnreadMessages = false,
  returnTo = 'applications-tab',
  compact = false,
  embedded = false,
  selected = false,
  onSelect,
}: WorkerApplicationListCardProps) {
  const { colors } = useTheme();
  const { isApplicationHighlighted, markApplicationSeen } = useApplicationTabBadge();
  const isShift = application.post_type === 'shift';
  const appliedLabel = formatApplicationDate(application.created_at);

  const isConfirmedShift = isShift && application.status === 'hired';
  const isCancelledShift =
    isShift && application.status === 'rejected' && Boolean(application.status_closed_by);
  const hasApplicationUpdate = isApplicationHighlighted(application);
  const detailLine = getWorkerApplicationCardDetail(application, {
    isHighlighted: hasApplicationUpdate,
  });

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
      color: colors.tertiary,
    },
    accessory: {
      alignItems: 'flex-end',
      gap: spacing.xs,
    },
  }));

  const location = formatWorkerApplicationCardLocation(application);
  const shiftDisplay = isShift ? getWorkerShiftApplicationCardDisplay(application) : null;
  const appliedOnLabel = isCancelledShift
    ? application.status_closed_by === 'clinic_deleted'
      ? 'Removed by clinic'
      : application.status_closed_by === 'clinic'
        ? 'Cancelled by clinic'
        : 'Cancelled'
      : appliedLabel
      ? `${isShift ? 'Requested' : 'Applied'} ${appliedLabel}`
      : null;

  const openDetail = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (hasApplicationUpdate) {
      void markApplicationSeen(application.id);
    }
    if (onSelect) {
      onSelect(application.id);
      return;
    }
    router.push(getWorkerApplicationRoute(application.id, returnTo));
  };

  const statusLabel = (
    <WorkerApplicationStatusLabel
      status={application.status}
      postType={application.post_type}
      statusNote={application.status_note}
      statusClosedBy={application.status_closed_by}
      label={getWorkerApplicationCardStatusLabel(application, {
        isHighlighted: hasApplicationUpdate,
      })}
      showStatusPrefix
    />
  );

  return (
    <SurfaceCard
      variant={
        embedded
          ? 'inner'
          : isConfirmedShift
            ? 'success'
            : isCancelledShift
              ? 'default'
              : 'default'
      }
      padding={compact ? 'none' : 'md'}
      gap
      style={selected ? { borderColor: colors.tertiary, borderWidth: 1.5 } : undefined}
      onPress={openDetail}
    >
      <ClinicPostHeader
        layout="split"
        headerOnly
        clinicName={application.clinic_name}
        logoStoragePath={application.clinic_logo_storage_path}
        title={shiftDisplay?.title ?? application.post_title}
        location={location}
        statusLabel={statusLabel}
        postedLabel={appliedOnLabel}
        detail={detailLine}
        avatarSize={compact ? 40 : 44}
        accessory={
          hasApplicationUpdate ? (
            <View style={styles.accessory}>
              <ApplicationCardBadge accent="tertiary" />
            </View>
          ) : undefined
        }
      />

      {!compact ? (
        <View style={styles.trailingRow}>
          {hasUnreadMessages ? <Text style={styles.unread}>New message</Text> : null}
          <Ionicons name="chevron-forward" size={18} color={colors.labelTertiary} />
        </View>
      ) : hasUnreadMessages ? (
        <Text style={styles.unread}>New message</Text>
      ) : null}
    </SurfaceCard>
  );
}
