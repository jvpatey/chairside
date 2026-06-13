import type { LiveJobPost } from '@chairside/api';
import type { JobMatchBreakdown, JobMatchContext } from '@chairside/core';
import { formatJobPostCardMeta } from '@chairside/config';
import { Text, View } from 'react-native';

import { MatchTierBadge } from '@/components/matching/MatchTierBadge';
import { BrowseListRow } from '@/components/ui/BrowseListRow';
import { SurfaceCard } from '@/components/ui/SurfaceCard';
import { ClinicLogoAvatar } from '@/components/clinic/ClinicLogoAvatar';
import { ClinicPostHeader } from '@/components/worker/ClinicPostHeader';
import { RoleListingPostedMeta } from '@/components/worker/RoleListingPostedMeta';
import { useClinicLogoUri } from '@/hooks/useClinicLogoUri';
import type { ListingLayout } from '@/components/ui/BrowseListRow';
import { formatPostedDateLabel } from '@/lib/dates';
import { useThemedStyles } from '@/theme';

type RoleListingCardProps = {
  job: LiveJobPost;
  jobMatch?: JobMatchBreakdown | null;
  matchContext?: Partial<JobMatchContext>;
  hasApplied?: boolean;
  layout?: ListingLayout;
  onPress?: () => void;
};

export function RoleListingCard({
  job,
  jobMatch,
  matchContext,
  hasApplied,
  layout = 'tile',
  onPress,
}: RoleListingCardProps) {
  const logoUri = useClinicLogoUri(job.clinic.logo_storage_path);
  const location = [job.clinic.city, job.clinic.province].filter(Boolean).join(', ');
  const detail = formatJobPostCardMeta(job);
  const postedLabel =
    formatPostedDateLabel(job.created_at) || hasApplied
      ? <RoleListingPostedMeta postedAt={job.created_at} hasApplied={hasApplied} />
      : null;

  const styles = useThemedStyles(({ colors, spacing }) => ({
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

  const matchBadge =
    jobMatch && matchContext ? (
      <MatchTierBadge
        breakdown={jobMatch}
        context={matchContext}
        subtitle={job.title}
        showProfileHint
      />
    ) : null;

  if (layout === 'list') {
    return (
      <BrowseListRow
        avatar={
          <ClinicLogoAvatar clinicName={job.clinic.clinic_name} logoUri={logoUri} size={40} />
        }
        eyebrow={job.clinic.clinic_name}
        title={job.title}
        meta={location || null}
        detail={detail || null}
        postedLabel={postedLabel}
        topTrailing={matchBadge ?? undefined}
        footer={job.wage_range ? <Text style={styles.listWage}>{job.wage_range}</Text> : null}
        onPress={onPress}
      />
    );
  }

  return (
    <SurfaceCard onPress={onPress}>
      <ClinicPostHeader
        layout="split"
        clinicName={job.clinic.clinic_name}
        logoStoragePath={job.clinic.logo_storage_path}
        title={job.title}
        location={location || null}
        detail={detail || null}
        postedLabel={postedLabel}
        avatarSize={44}
        accessory={matchBadge}
        footer={
          job.wage_range ? (
            <View style={styles.footer}>
              <Text style={styles.wage}>{job.wage_range}</Text>
            </View>
          ) : null
        }
      />
    </SurfaceCard>
  );
}
