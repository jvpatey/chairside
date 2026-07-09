import type { JobPost } from '@chairside/api';
import { formatJobPostRoleMeta } from '@chairside/config';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Pressable, Text, View } from 'react-native';

import { showJobPostManageMenu } from '@/components/clinic/jobPostManageMenu';
import { JobPostStatusBadge } from '@/components/clinic/JobPostStatusBadge';
import { ClinicLogoAvatar } from '@/components/clinic/ClinicLogoAvatar';
import { ApplicantCountButton } from '@/components/ui/ApplicantCountButton';
import { BrowseListRow } from '@/components/ui/BrowseListRow';
import { BadgeRow } from '@/components/ui/BadgeRow';
import { formatApplicantCountLabel } from '@/components/ui/CountBadge';
import { SurfaceCard } from '@/components/ui/SurfaceCard';
import { ClinicPostHeader } from '@/components/worker/ClinicPostHeader';
import { FeaturedListingBadge } from '@/components/worker/FeaturedListingBadge';
import { useFeaturedListingTreatment } from '@/components/worker/featuredListingTreatment';
import { useClinicBilling } from '@/contexts/ClinicBillingContext';
import { useClinicProfile } from '@/contexts/ClinicProfileContext';
import { useClinicLogoUri } from '@/hooks/useClinicLogoUri';
import type { ListingLayout } from '@/components/ui/BrowseListRow';
import { formatPostedDateLabel } from '@/lib/dates';
import { useTheme, useThemedStyles } from '@/theme';

export type RolePostingCardManageProps = {
  clinicId: string;
  onUpdated: (job: JobPost) => void;
  onDeleted: () => void;
};

type RolePostingCardProps = {
  job: JobPost;
  applicantCount?: number;
  layout?: ListingLayout;
  onPress?: () => void;
  onApplicantsPress?: () => void;
  manage?: RolePostingCardManageProps;
  /** Hide applicant review pill (detail screens). */
  hideActions?: boolean;
};

export function RolePostingCard({
  job,
  applicantCount = 0,
  layout = 'tile',
  onPress,
  onApplicantsPress,
  manage,
  hideActions = false,
}: RolePostingCardProps) {
  const { colors } = useTheme();
  const { clinicProfile } = useClinicProfile();
  const { billing } = useClinicBilling();
  const featuredTreatment = useFeaturedListingTreatment();
  const logoUri = useClinicLogoUri(clinicProfile?.logo_storage_path);
  const clinicName = clinicProfile?.clinic_name?.trim() || 'Your clinic';
  const location = [clinicProfile?.city, clinicProfile?.province].filter(Boolean).join(', ');
  const postedLabel = formatPostedDateLabel(job.created_at);
  const roleMeta = formatJobPostRoleMeta(job);
  const hasApplicants = applicantCount > 0;

  const styles = useThemedStyles(({ colors, spacing }) => ({
    card: {
      overflow: 'hidden',
    },
    cardContent: {
      padding: spacing.md,
    },
    menuButton: {
      width: 28,
      height: 28,
      alignItems: 'center',
      justifyContent: 'center',
    },
    menuButtonPressed: {
      opacity: 0.6,
    },
    headerActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
    },
    wage: {
      fontSize: 15,
      fontWeight: '600',
      color: colors.primary,
    },
  }));

  const handleManagePress = () => {
    if (!manage) return;
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    showJobPostManageMenu({
      clinicId: manage.clinicId,
      job,
      onUpdated: manage.onUpdated,
      onDeleted: manage.onDeleted,
    });
  };

  const manageButton = manage ? (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Manage role posting"
      hitSlop={10}
      onPress={(event) => {
        event.stopPropagation?.();
        handleManagePress();
      }}
      style={({ pressed }) => [styles.menuButton, pressed && styles.menuButtonPressed]}>
      <Ionicons name="ellipsis-horizontal" size={20} color={colors.labelTertiary} />
    </Pressable>
  ) : null;

  const statusBadge = <JobPostStatusBadge status={job.status} />;
  const isFeatured = job.status === 'live' && Boolean(billing?.hasPriorityListing);

  const headerActions = (
    <View style={styles.headerActions}>
      <BadgeRow>
        {isFeatured ? <FeaturedListingBadge /> : null}
        {statusBadge}
      </BadgeRow>
      {manageButton}
    </View>
  );

  const showApplicantPill = !hideActions && hasApplicants && Boolean(onApplicantsPress);

  const applicantControl = showApplicantPill ? (
    <ApplicantCountButton
      label={formatApplicantCountLabel(applicantCount)}
      onPress={onApplicantsPress}
      accessibilityLabel={`Review ${applicantCount} applicants`}
    />
  ) : null;

  const wageLabel = job.wage_range ? (
    <Text style={styles.wage}>{job.wage_range}</Text>
  ) : null;

  if (layout === 'list') {
    return (
      <SurfaceCard
        padding="none"
        onPress={onPress}
        style={isFeatured ? featuredTreatment.styles.card : undefined}
        featuredOverlay={isFeatured ? featuredTreatment.gradient : null}>
        <BrowseListRow
          avatar={<ClinicLogoAvatar clinicName={clinicName} logoUri={logoUri} size={40} />}
          eyebrow={clinicName}
          title={job.title}
          meta={location || null}
          postedLabel={postedLabel || null}
          postedLabelPlacement="header"
          headerDetail={roleMeta}
          headerAccent={job.wage_range || null}
          topTrailing={headerActions}
          contentAccessory={applicantControl}
          showChevron={Boolean(onPress)}
        />
      </SurfaceCard>
    );
  }

  return (
    <SurfaceCard
      padding="none"
      style={[styles.card, isFeatured && featuredTreatment.styles.card]}
      featuredOverlay={isFeatured ? featuredTreatment.gradient : null}
      onPress={onPress}>
      <View style={styles.cardContent}>
        <ClinicPostHeader
          layout="split"
          clinicName={clinicName}
          logoStoragePath={clinicProfile?.logo_storage_path}
          title={job.title}
          location={location || null}
          detail={roleMeta}
          postedLabel={postedLabel || null}
          textFooter={showApplicantPill ? undefined : (wageLabel ?? undefined)}
          footer={showApplicantPill ? (wageLabel ?? undefined) : undefined}
          avatarSize={44}
          accessory={headerActions}
          detailAccessory={applicantControl}
        />
      </View>
    </SurfaceCard>
  );
}
