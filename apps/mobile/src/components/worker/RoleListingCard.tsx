import type { LiveJobPost } from '@chairside/api';
import type { JobMatchBreakdown, JobMatchContext } from '@chairside/core';
import { formatJobPostCardMeta } from '@chairside/config';
import * as Haptics from 'expo-haptics';
import { Pressable, Text, View } from 'react-native';

import { MatchTierBadge } from '@/components/matching/MatchTierBadge';
import { AppliedPillBadge } from '@/components/matching/ApplicationStatusBadge';
import { BadgeRow } from '@/components/ui/BadgeRow';
import { useThemedStyles } from '@/theme';

type RoleListingCardProps = {
  job: LiveJobPost;
  jobMatch?: JobMatchBreakdown | null;
  matchContext?: Partial<JobMatchContext>;
  hasApplied?: boolean;
  onPress?: () => void;
};

export function RoleListingCard({
  job,
  jobMatch,
  matchContext,
  hasApplied,
  onPress,
}: RoleListingCardProps) {
  const styles = useThemedStyles(({ colors, spacing, typography }) => ({
    card: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.separator,
      padding: spacing.md,
      gap: spacing.sm,
    },
    cardPressed: { opacity: 0.92 },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      gap: spacing.sm,
    },
    headerMain: { flex: 1, gap: 4 },
    clinic: {
      fontSize: 12,
      fontWeight: '600',
      letterSpacing: 0.4,
      textTransform: 'uppercase',
      color: colors.primary,
    },
    title: {
      ...typography.body,
      fontWeight: '600',
      fontSize: 16,
      lineHeight: 22,
    },
    meta: { fontSize: 14, lineHeight: 20, color: colors.labelSecondary },
    footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    wage: { fontSize: 15, fontWeight: '600', color: colors.primary },
  }));

  const location = [job.clinic.city, job.clinic.province].filter(Boolean).join(', ');

  const content = (
    <>
      <View style={styles.header}>
        <View style={styles.headerMain}>
          <Text style={styles.clinic} numberOfLines={1}>
            {job.clinic.clinic_name}
          </Text>
          <Text style={styles.title} numberOfLines={2}>
            {job.title}
          </Text>
          <Text style={styles.meta}>{formatJobPostCardMeta(job)}</Text>
          {location ? <Text style={styles.meta}>{location}</Text> : null}
        </View>
      </View>
      <View style={styles.footer}>
        {job.wage_range ? <Text style={styles.wage}>{job.wage_range}</Text> : <View />}
        <BadgeRow>
          {hasApplied ? <AppliedPillBadge /> : null}
          {jobMatch && matchContext ? (
            <MatchTierBadge
              breakdown={jobMatch}
              context={matchContext}
              subtitle={job.title}
              showProfileHint
            />
          ) : null}
        </BadgeRow>
      </View>
    </>
  );

  if (!onPress) return <View style={styles.card}>{content}</View>;

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
