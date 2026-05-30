import type { WorkerApplication } from '@chairside/api';
import { formatApplicationDate } from '@chairside/config';
import * as Haptics from 'expo-haptics';
import { Pressable, View } from 'react-native';

import { WorkerApplicationStatusBadge } from '@/components/matching/ApplicationStatusBadge';
import { MatchTierBadge } from '@/components/matching/MatchTierBadge';
import { ClinicPostHeader } from '@/components/worker/ClinicPostHeader';
import {
  getApplicationMatchDisplayContext,
  parseApplicationJobMatch,
} from '@/lib/matchDisplay';
import { useThemedStyles } from '@/theme';

type WorkerApplicationListCardProps = {
  application: WorkerApplication;
  hasUnreadMessages?: boolean;
  onPress?: () => void;
};

export function WorkerApplicationListCard({
  application,
  hasUnreadMessages = false,
  onPress,
}: WorkerApplicationListCardProps) {
  const isJob = application.post_type === 'job';
  const isShift = application.post_type === 'shift';
  const jobMatch = isJob ? parseApplicationJobMatch(application) : null;
  const matchContext = isJob ? getApplicationMatchDisplayContext(application) : null;
  const appliedLabel = formatApplicationDate(application.created_at);

  const styles = useThemedStyles(({ colors, spacing }) => ({
    card: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.separator,
      padding: spacing.md,
    },
    cardPressed: { opacity: 0.92 },
  }));

  const content = (
    <ClinicPostHeader
      clinicName={application.clinic_name}
      logoStoragePath={application.clinic_logo_storage_path}
      title={application.post_title}
      location={application.clinic_city}
      detail={
        [
          appliedLabel ? `${isShift ? 'Requested' : 'Applied'} ${appliedLabel}` : null,
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
    return <View style={styles.card}>{content}</View>;
  }

  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => {
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress();
      }}
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}>
      {content}
    </Pressable>
  );
}
