import type { LiveJobPost } from '@chairside/api';
import type { JobMatchBreakdown, JobMatchContext } from '@chairside/core';
import { formatJobPostCardMeta } from '@chairside/config';
import * as Haptics from 'expo-haptics';
import { Pressable, Text, View } from 'react-native';

import { MatchTierBadge } from '@/components/matching/MatchTierBadge';
import { AppliedPillBadge } from '@/components/matching/ApplicationStatusBadge';
import { BrowseListRow } from '@/components/ui/BrowseListRow';
import { ClinicLogoAvatar } from '@/components/clinic/ClinicLogoAvatar';
import { ClinicPostHeader } from '@/components/worker/ClinicPostHeader';
import { useClinicLogoUri } from '@/hooks/useClinicLogoUri';
import type { ListingLayout } from '@/components/ui/BrowseListRow';
import { useThemedStyles } from '@/theme';

type RoleListingCardProps = {
  job: LiveJobPost;
  jobMatch?: JobMatchBreakdown | null;
  matchContext?: Partial<JobMatchContext>;
  hasApplied?: boolean;
  layout?: ListingLayout;
  isLast?: boolean;
  onPress?: () => void;
};

export function RoleListingCard({
  job,
  jobMatch,
  matchContext,
  hasApplied,
  layout = 'tile',
  isLast,
  onPress,
}: RoleListingCardProps) {
  const logoUri = useClinicLogoUri(job.clinic.logo_storage_path);
  const location = [job.clinic.city, job.clinic.province].filter(Boolean).join(', ');

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
    listWage: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.primary,
    },
  }));

  if (layout === 'list') {
    return (
      <BrowseListRow
        avatar={
          <ClinicLogoAvatar clinicName={job.clinic.clinic_name} logoUri={logoUri} size={40} />
        }
        eyebrow={job.clinic.clinic_name}
        title={job.title}
        meta={location || null}
        detail={formatJobPostCardMeta(job)}
        topTrailing={
          jobMatch && matchContext ? (
            <MatchTierBadge
              breakdown={jobMatch}
              context={matchContext}
              subtitle={job.title}
              showProfileHint
            />
          ) : undefined
        }
        footer={
          <>
            {hasApplied ? <AppliedPillBadge /> : null}
            {job.wage_range ? <Text style={styles.listWage}>{job.wage_range}</Text> : null}
          </>
        }
        isLast={isLast}
        onPress={onPress}
      />
    );
  }

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
