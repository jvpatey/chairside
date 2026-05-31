import type { WorkerApplication } from '@chairside/api';
import { formatApplicationDate } from '@chairside/config';
import * as Haptics from 'expo-haptics';
import {
  LayoutAnimation,
  Platform,
  Pressable,
  UIManager,
  View,
} from 'react-native';

import { CardExpandToggle } from '@/components/ui/CardExpandToggle';

import { WorkerApplicationStatusBadge } from '@/components/matching/ApplicationStatusBadge';
import { MatchTierBadge } from '@/components/matching/MatchTierBadge';
import { ClinicPostHeader } from '@/components/worker/ClinicPostHeader';
import { WorkerApplicationDetailCard } from '@/components/worker/WorkerApplicationDetailCard';
import {
  getApplicationMatchDisplayContext,
  parseApplicationJobMatch,
} from '@/lib/matchDisplay';
import { type WorkerApplicationReturnTarget } from '@/lib/routing';
import { getWorkerShiftApplicationCardDisplay } from '@/lib/workerShiftApplicationDisplay';
import { useThemedStyles } from '@/theme';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

type WorkerApplicationListCardProps = {
  application: WorkerApplication;
  hasUnreadMessages?: boolean;
  expanded?: boolean;
  onExpandChange?: (expanded: boolean) => void;
  returnTo?: WorkerApplicationReturnTarget;
  onUpdated?: () => void;
  onHidden?: () => void;
  onViewPosting?: () => void;
};

export function WorkerApplicationListCard({
  application,
  hasUnreadMessages = false,
  expanded = false,
  onExpandChange,
  returnTo = 'applications-tab',
  onUpdated,
  onHidden,
  onViewPosting,
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
      padding: spacing.lg,
      gap: spacing.md,
    },
    cardPressed: { opacity: 0.92 },
    expandedBody: {
      gap: spacing.sm,
    },
  }));

  const toggleExpanded = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onExpandChange?.(!expanded);
  };

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

  return (
    <View style={styles.card}>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded }}
        onPress={toggleExpanded}
        style={({ pressed }) => [pressed && styles.cardPressed]}>
        {content}
      </Pressable>

      <CardExpandToggle expanded={expanded} onPress={toggleExpanded} />

      {expanded ? (
        <View style={styles.expandedBody}>
          <WorkerApplicationDetailCard
            application={application}
            returnTo={returnTo}
            hasUnreadMessages={hasUnreadMessages}
            variant="embedded"
            onViewPosting={onViewPosting}
            onUpdated={onUpdated}
            onHidden={onHidden}
            onCancelled={onHidden}
          />
        </View>
      ) : null}
    </View>
  );
}
