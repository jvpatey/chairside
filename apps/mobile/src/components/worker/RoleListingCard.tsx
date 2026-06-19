import type { LiveJobPost } from '@chairside/api';
import type { JobMatchBreakdown, JobMatchContext } from '@chairside/core';
import { formatJobPostCardMeta } from '@chairside/config';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, Text, View } from 'react-native';

import { MatchTierBadge } from '@/components/matching/MatchTierBadge';
import { PillBadge } from '@/components/ui/PillBadge';
import { SurfaceCard } from '@/components/ui/SurfaceCard';
import { ClinicPostHeader } from '@/components/worker/ClinicPostHeader';
import { SavePostButton } from '@/components/worker/SavePostButton';
import { formatPostedDateLabel } from '@/lib/dates';
import { getAppliedRowGradient, useTheme, useThemedStyles } from '@/theme';

type RoleListingCardProps = {
  job: LiveJobPost;
  jobMatch?: JobMatchBreakdown | null;
  matchContext?: Partial<JobMatchContext>;
  hasApplied?: boolean;
  isSaved?: boolean;
  onToggleSaved?: () => void;
  distanceLabel?: string | null;
  onPress?: () => void;
};

export function RoleListingCard({
  job,
  jobMatch,
  matchContext,
  hasApplied,
  isSaved = false,
  onToggleSaved,
  distanceLabel,
  onPress,
}: RoleListingCardProps) {
  const { colors, isDark } = useTheme();
  const locationBase = [job.clinic.city, job.clinic.province].filter(Boolean).join(', ');
  const location = distanceLabel
    ? locationBase
      ? `${locationBase} • ${distanceLabel}`
      : distanceLabel
    : locationBase;
  const detail = formatJobPostCardMeta(job);
  const postedLabel = formatPostedDateLabel(job.created_at) || null;

  const styles = useThemedStyles(({ colors, spacing }) => ({
    card: {
      overflow: 'hidden',
      position: 'relative',
    },
    cardContent: {
      padding: spacing.md,
    },
    cardInner: {
      position: 'relative',
    },
    appliedGradient: {
      ...StyleSheet.absoluteFillObject,
    },
    accessoryColumn: {
      alignItems: 'flex-end',
      gap: spacing.xs,
    },
    wage: {
      fontSize: 15,
      fontWeight: '600',
      color: colors.primary,
    },
  }));

  const matchBadge =
    jobMatch && matchContext ? (
      <MatchTierBadge
        breakdown={jobMatch}
        context={matchContext}
        subtitle={job.title}
        showProfileHint
      />
    ) : null;

  const appliedBadge = hasApplied ? (
    <PillBadge
      label="Applied"
      color={colors.primary}
      backgroundColor={colors.primarySubtle}
      accessibilityLabel="Already applied"
    />
  ) : null;

  const accessory =
    matchBadge || appliedBadge || onToggleSaved ? (
      <View style={styles.accessoryColumn}>
        {matchBadge}
        {appliedBadge}
        {onToggleSaved ? (
          <SavePostButton isSaved={isSaved} onToggle={onToggleSaved} size={20} />
        ) : null}
      </View>
    ) : null;

  const appliedGradient = hasApplied ? getAppliedRowGradient(colors, isDark) : null;

  return (
    <SurfaceCard onPress={onPress} padding="none" style={styles.card} contentStyle={styles.cardInner}>
      {appliedGradient ? (
        <LinearGradient
          colors={appliedGradient}
          locations={[0, 0.55, 1]}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={styles.appliedGradient}
          pointerEvents="none"
        />
      ) : null}
      <View style={styles.cardContent}>
        <ClinicPostHeader
          layout="split"
          clinicName={job.clinic.clinic_name}
          logoStoragePath={job.clinic.logo_storage_path}
          title={job.title}
          location={location || null}
          detail={detail || null}
          postedLabel={postedLabel}
          textFooter={
            job.wage_range ? <Text style={styles.wage}>{job.wage_range}</Text> : undefined
          }
          avatarSize={44}
          accessory={accessory}
          stackedAccessory
        />
      </View>
    </SurfaceCard>
  );
}
