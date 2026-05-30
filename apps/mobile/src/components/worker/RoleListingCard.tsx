import type { LiveJobPost } from '@chairside/api';
import type { JobMatchBreakdown, JobMatchContext } from '@chairside/core';
import { formatJobPostCardMeta } from '@chairside/config';
import * as Haptics from 'expo-haptics';
import { Pressable, Text, View } from 'react-native';

import { MatchTierBadge } from '@/components/matching/MatchTierBadge';
import { AppliedPillBadge } from '@/components/matching/ApplicationStatusBadge';
import { ClinicPostHeader } from '@/components/worker/ClinicPostHeader';
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
  const styles = useThemedStyles(({ colors, spacing }) => ({
    card: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.separator,
      padding: spacing.md,
    },
    cardPressed: { opacity: 0.92 },
    footer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: spacing.sm,
    },
    wage: {
      fontSize: 15,
      fontWeight: '600',
      color: colors.primary,
    },
  }));

  const location = [job.clinic.city, job.clinic.province].filter(Boolean).join(', ');

  const content = (
    <ClinicPostHeader
      clinicName={job.clinic.clinic_name}
      logoStoragePath={job.clinic.logo_storage_path}
      title={job.title}
      location={location || null}
      detail={formatJobPostCardMeta(job)}
      avatarSize={44}
      accessory={
        jobMatch && matchContext ? (
          <MatchTierBadge
            breakdown={jobMatch}
            context={matchContext}
            subtitle={job.title}
            showProfileHint
          />
        ) : null
      }
      textFooter={hasApplied ? <AppliedPillBadge /> : null}
      footer={
        job.wage_range ? (
          <View style={styles.footer}>
            <Text style={styles.wage}>{job.wage_range}</Text>
          </View>
        ) : null
      }
    />
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
