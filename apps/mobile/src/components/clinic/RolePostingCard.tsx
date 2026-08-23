import type { JobPost } from '@chairside/api';
import { formatJobPostRoleMeta } from '@chairside/config';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Pressable, View } from 'react-native';

import { showJobPostManageMenu } from '@/components/clinic/showJobPostManageMenu';
import { JobPostStatusBadge } from '@/components/clinic/JobPostStatusBadge';
import { ClinicLogoAvatar } from '@/components/clinic/ClinicLogoAvatar';
import { RoleApplicantPreviewList } from '@/components/clinic/RoleApplicantPreviewList';
import { ApplicantCountButton } from '@/components/ui/ApplicantCountButton';
import { BrowseListRow } from '@/components/ui/BrowseListRow';
import { BadgeRow } from '@/components/ui/BadgeRow';
import { formatApplicantCountLabel } from '@/components/ui/CountBadge';
import { ListingClinicSubtitle } from '@/components/ui/ListingMetaIconRow';
import { SurfaceCard } from '@/components/ui/SurfaceCard';
import { FeaturedListingBadge } from '@/components/worker/FeaturedListingBadge';
import { useFeaturedListingTreatment } from '@/components/worker/featuredListingTreatment';
import { useClinicBilling } from '@/contexts/ClinicBillingContext';
import { useClinicProfile } from '@/contexts/ClinicProfileContext';
import { useClinicLogoUri } from '@/hooks/useClinicLogoUri';
import { useResolvedClinicLogoPath } from '@/hooks/useResolvedClinicLogoPath';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';
import type { JobApplicantPreview } from '@/lib/dashboardAttention';
import { resolveClinicJobLocationParts } from '@/lib/clinicPostingListDisplay';
import { buildRoleListingMetaRows } from '@/lib/listingCardDisplay';
import { webOnlyStyle } from '@/lib/webPressableStyles';
import { useTheme, useThemedStyles } from '@/theme';

export type RolePostingCardManageProps = {
  clinicId: string;
  onUpdated: (job: JobPost) => void;
  onDeleted: () => void;
};

type RolePostingCardProps = {
  job: JobPost;
  applicantCount?: number;
  /** Dashboard: applicant rows shown below the role header. */
  applicants?: JobApplicantPreview[];
  /** Inner surface for dashboard file-tab panels. */
  embedded?: boolean;
  onPress?: () => void;
  onApplicantsPress?: () => void;
  onApplicantPress?: (applicationId: string) => void;
  manage?: RolePostingCardManageProps;
  /** Hide applicant review pill (detail screens). */
  hideActions?: boolean;
};

export function RolePostingCard({
  job,
  applicantCount = 0,
  embedded = false,
  onPress,
  onApplicantsPress,
  onApplicantPress,
  manage,
  hideActions = false,
  applicants = [],
}: RolePostingCardProps) {
  const { colors } = useTheme();
  const { isTablet } = useResponsiveLayout();
  const mobileEmbedded = embedded && !isTablet;
  const { clinicProfile, locations, isGroup } = useClinicProfile();
  const { billing } = useClinicBilling();
  const featuredTreatment = useFeaturedListingTreatment();
  const logoStoragePath = useResolvedClinicLogoPath(job.location_id);
  const logoUri = useClinicLogoUri(logoStoragePath);
  const clinicName = clinicProfile?.clinic_name?.trim() || 'Your clinic';
  const { siteName, placeLabel } = resolveClinicJobLocationParts(job, locations, clinicProfile);
  const roleMeta = formatJobPostRoleMeta(job);
  const hasApplicants = applicantCount > 0;
  const showApplicantList = !hideActions && Boolean(onApplicantPress);
  const showApplicantPill =
    !showApplicantList && !hideActions && hasApplicants && Boolean(onApplicantsPress);

  const subtitleName = isGroup ? siteName || clinicName : clinicName;
  const metaRows = buildRoleListingMetaRows({
    location: placeLabel,
    roleMeta,
    postedAt: job.created_at,
  });

  const styles = useThemedStyles(({ spacing }) => ({
    stretchCard: {
      flex: 1,
      alignSelf: 'stretch',
      ...webOnlyStyle({
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
      } as const),
    },
    stretchCardContent: {
      flex: 1,
      ...webOnlyStyle({
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
      } as const),
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
    applicantSectionGrow: {
      flex: 1,
      justifyContent: 'flex-end',
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

  const applicantControl = showApplicantPill ? (
    <ApplicantCountButton
      label={formatApplicantCountLabel(applicantCount)}
      onPress={onApplicantsPress}
      accessibilityLabel={`Review ${applicantCount} applicants`}
    />
  ) : null;

  const statusBadges = (
    <BadgeRow>
      {isFeatured ? <FeaturedListingBadge /> : null}
      {statusBadge}
    </BadgeRow>
  );

  const headerActions = (
    <View style={styles.headerActions}>
      {statusBadges}
      {manageButton}
    </View>
  );

  const clinicAvatar = (
    <ClinicLogoAvatar clinicName={clinicName} logoUri={logoUri} size={40} />
  );

  const surfaceVariant = embedded ? 'inner' : 'default';

  return (
    <SurfaceCard
      variant={surfaceVariant}
      padding="none"
      onPress={showApplicantList ? undefined : onPress}
      style={[styles.stretchCard, isFeatured ? featuredTreatment.cardStyle : null]}
      contentStyle={styles.stretchCardContent}
      accentRailColor={isFeatured ? featuredTreatment.railColor : undefined}>
      <BrowseListRow
        layout={mobileEmbedded ? 'stacked' : 'split'}
        compact={mobileEmbedded}
        detailsDivider={embedded}
        avatar={clinicAvatar}
        title={job.title}
        subtitle={<ListingClinicSubtitle name={subtitleName} isGroup={isGroup} />}
        metaRows={metaRows}
        topTrailing={headerActions}
        contentAccessory={applicantControl}
        onPress={onPress}
        pressScope={showApplicantList ? 'header' : 'row'}
        showChevron={Boolean(onPress)}
      />
      {showApplicantList && onApplicantPress ? (
        <View style={styles.applicantSectionGrow}>
          <RoleApplicantPreviewList
            applicants={applicants}
            onApplicantPress={onApplicantPress}
          />
        </View>
      ) : null}
    </SurfaceCard>
  );
}
