import type { WorkerApplication } from '@chairside/api';
import { formatApplicationResumeStatus } from '@chairside/config';
import * as Haptics from 'expo-haptics';
import { Pressable, Text, View } from 'react-native';

import { WorkerApplicationStatusBadge } from '@/components/matching/ApplicationStatusBadge';
import { MatchTierBadge } from '@/components/matching/MatchTierBadge';
import { BadgeRow } from '@/components/ui/BadgeRow';
import {
  getApplicationMatchDisplayContext,
  parseApplicationJobMatch,
} from '@/lib/matchDisplay';
import { useThemedStyles } from '@/theme';

type WorkerApplicationListCardProps = {
  application: WorkerApplication;
  onPress?: () => void;
};

export function WorkerApplicationListCard({
  application,
  onPress,
}: WorkerApplicationListCardProps) {
  const isJob = application.post_type === 'job';
  const jobMatch = isJob ? parseApplicationJobMatch(application) : null;
  const matchContext = isJob ? getApplicationMatchDisplayContext(application) : null;

  const styles = useThemedStyles(({ colors, spacing, typography }) => ({
    card: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.separator,
      padding: spacing.lg,
      gap: spacing.sm,
    },
    cardPressed: { opacity: 0.92 },
    title: { ...typography.body, fontWeight: '600' },
    meta: typography.subtitle,
  }));

  const content = (
    <>
      <Text style={styles.title}>{application.post_title}</Text>
      <Text style={styles.meta}>
        {application.clinic_name}
        {application.clinic_city ? ` · ${application.clinic_city}` : ''}
      </Text>
      <BadgeRow>
        <WorkerApplicationStatusBadge
          status={application.status}
          postType={application.post_type}
        />
        {jobMatch && matchContext ? (
          <MatchTierBadge
            breakdown={jobMatch}
            context={matchContext}
            subtitle={application.post_title}
          />
        ) : null}
      </BadgeRow>
      <Text style={styles.meta}>
        Resume · {formatApplicationResumeStatus(application.resume_storage_path)}
      </Text>
    </>
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
