import type { WorkerApplication } from '@chairside/api';
import { canWorkerHideApplication, formatApplicationDate } from '@chairside/config';
import * as Haptics from 'expo-haptics';
import { Pressable, View } from 'react-native';

import { OnboardingButton } from '@/components/onboarding/OnboardingButton';

import { WorkerApplicationStatusBadge } from '@/components/matching/ApplicationStatusBadge';
import { MatchTierBadge } from '@/components/matching/MatchTierBadge';
import { ClinicPostHeader } from '@/components/worker/ClinicPostHeader';
import {
  getApplicationMatchDisplayContext,
  parseApplicationJobMatch,
} from '@/lib/matchDisplay';
import { getWorkerShiftApplicationCardDisplay } from '@/lib/workerShiftApplicationDisplay';
import { useThemedStyles } from '@/theme';

type WorkerApplicationListCardProps = {
  application: WorkerApplication;
  hasUnreadMessages?: boolean;
  onPress?: () => void;
  onRemove?: () => void;
};

export function WorkerApplicationListCard({
  application,
  hasUnreadMessages = false,
  onPress,
  onRemove,
}: WorkerApplicationListCardProps) {
  const isJob = application.post_type === 'job';
  const isShift = application.post_type === 'shift';
  const jobMatch = isJob ? parseApplicationJobMatch(application) : null;
  const matchContext = isJob ? getApplicationMatchDisplayContext(application) : null;
  const appliedLabel = formatApplicationDate(application.created_at);

  const isConfirmedShift = isShift && application.status === 'hired';
  const shiftDisplay = isShift ? getWorkerShiftApplicationCardDisplay(application) : null;

  const styles = useThemedStyles(({ colors, spacing }) => ({
    card: {
      backgroundColor: isConfirmedShift ? `${colors.success}10` : colors.surface,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: isConfirmedShift ? `${colors.success}40` : colors.separator,
      padding: spacing.md,
      gap: spacing.sm,
    },
    cardPressed: { opacity: 0.92 },
  }));

  const showRemove = onRemove && canWorkerHideApplication(application);

  const content = (
    <ClinicPostHeader
      clinicName={application.clinic_name}
      logoStoragePath={application.clinic_logo_storage_path}
      title={shiftDisplay?.title ?? application.post_title}
      location={shiftDisplay?.location ?? application.clinic_city}
      detail={
        [
          shiftDisplay?.shiftSchedule ?? null,
          !shiftDisplay && appliedLabel
            ? `${isShift ? 'Requested' : 'Applied'} ${appliedLabel}`
            : shiftDisplay && appliedLabel && application.status !== 'hired'
              ? `Requested ${appliedLabel}`
              : null,
          hasUnreadMessages ? 'New message' : null,
        ]
          .filter(Boolean)
          .join(' · ') || null
      }
      avatarSize={44}
      accessory={
        jobMatch && matchContext ? (
          <MatchTierBadge
            breakdown={jobMatch}
            context={matchContext}
            subtitle={application.post_title}
          />
        ) : null
      }
      textFooter={
        <WorkerApplicationStatusBadge
          status={application.status}
          postType={application.post_type}
        />
      }
    />
  );

  if (!onPress) {
    return (
      <View style={styles.card}>
        {content}
        {showRemove ? (
          <OnboardingButton label="Remove from list" variant="secondary" onPress={onRemove} />
        ) : null}
      </View>
    );
  }

  return (
    <View style={styles.card}>
      <Pressable
        accessibilityRole="button"
        onPress={() => {
          void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onPress?.();
        }}
        style={({ pressed }) => [pressed && styles.cardPressed]}>
        {content}
      </Pressable>
      {showRemove ? (
        <OnboardingButton label="Remove from list" variant="secondary" onPress={onRemove} />
      ) : null}
    </View>
  );
}
