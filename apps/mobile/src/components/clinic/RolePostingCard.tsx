import type { JobPost } from '@chairside/api';
import { formatJobPostRoleMeta } from '@chairside/config';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Pressable, Text, View } from 'react-native';

import { showJobPostManageMenu } from '@/components/clinic/jobPostManageMenu';
import { JobPostStatusBadge } from '@/components/clinic/JobPostStatusBadge';
import { ClinicLogoAvatar } from '@/components/clinic/ClinicLogoAvatar';
import { RoleApplicantPreviewList } from '@/components/clinic/RoleApplicantPreviewList';
import { ApplicantAvatarStack } from '@/components/ui/ApplicantAvatarStack';
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
import { useResolvedClinicLogoPath } from '@/hooks/useResolvedClinicLogoPath';
import type { ListingLayout } from '@/components/ui/BrowseListRow';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';
import type { JobApplicantPreview } from '@/lib/dashboardAttention';
import { formatPostedDateLabel } from '@/lib/dates';
import { buildPostedByLabel } from '@/hooks/useClinicActingContext';
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
  layout?: ListingLayout;
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
  layout = 'list',
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
  const { clinicProfile } = useClinicProfile();
  const { billing } = useClinicBilling();
  const featuredTreatment = useFeaturedListingTreatment();
  const logoStoragePath = useResolvedClinicLogoPath(job.location_id);
  const logoUri = useClinicLogoUri(logoStoragePath);
  const clinicName = clinicProfile?.clinic_name?.trim() || 'Your clinic';
  const locations = useClinicProfile().locations;
  const locationRecord = locations.find((location) => location.id === job.location_id);
  const location =
    [locationRecord?.city ?? clinicProfile?.city, locationRecord?.province ?? clinicProfile?.province]
      .filter(Boolean)
      .join(', ') || null;
  const locationName = locationRecord?.name;
  const postedLabel =
    buildPostedByLabel({
      postedAt: job.created_at,
      postedByDisplayName: job.posted_by_display_name,
      postedByTitle: job.posted_by_title,
      formatDateLabel: formatPostedDateLabel,
    }) ?? formatPostedDateLabel(job.created_at);
  const roleMeta = formatJobPostRoleMeta(job);
  const hasApplicants = applicantCount > 0;
  const showApplicantList =
    !hideActions && applicants.length > 0 && Boolean(onApplicantPress);
  const showApplicantPill =
    !showApplicantList && !hideActions && hasApplicants && Boolean(onApplicantsPress);

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
      {!mobileEmbedded ? statusBadges : null}
      {!mobileEmbedded ? manageButton : null}
    </View>
  );

  const applicantLead =
    !embedded && applicants.length > 0 ? (
      <ApplicantAvatarStack
        names={applicants.map((applicant) => applicant.name)}
        photoPaths={applicants.map((applicant) => applicant.photoPath)}
        size={32}
      />
    ) : null;

  const wageLabel = job.wage_range ? (
    <Text style={styles.wage}>{job.wage_range}</Text>
  ) : null;

  const locationEyebrow =
    [locationName, location].filter(Boolean).join(' · ') || clinicName;
  const embeddedEyebrow =
    [locationName, location].filter(Boolean).join(' · ') || null;
  const clinicAvatar = (
    <ClinicLogoAvatar clinicName={clinicName} logoUri={logoUri} size={40} />
  );

  const useListLayout = layout === 'list' || embedded;
  const surfaceVariant = embedded ? 'inner' : 'default';

  if (useListLayout) {
    return (
      <SurfaceCard
        variant={surfaceVariant}
        padding="none"
        onPress={showApplicantList ? undefined : onPress}
        style={isFeatured ? featuredTreatment.styles.card : undefined}
        featuredOverlay={isFeatured ? featuredTreatment.gradient : null}>
        <BrowseListRow
          layout={mobileEmbedded ? 'stacked' : 'split'}
          compact={mobileEmbedded}
          avatar={clinicAvatar}
          eyebrow={
            mobileEmbedded
              ? embeddedEyebrow
              : embedded
                ? locationEyebrow
                : clinicName
          }
          title={job.title}
          meta={
            mobileEmbedded && job.wage_range ? `${roleMeta} · ${job.wage_range}` : roleMeta
          }
          detail={mobileEmbedded ? postedLabel || null : undefined}
          postedLabel={mobileEmbedded ? null : postedLabel || null}
          postedLabelPlacement="header"
          headerDetail={null}
          headerAccent={mobileEmbedded ? null : job.wage_range || null}
          topTrailing={mobileEmbedded ? statusBadges : headerActions}
          onPress={onPress}
          pressScope={showApplicantList ? 'header' : 'row'}
          showChevron={Boolean(onPress)}
        />
        {showApplicantList && onApplicantPress ? (
          <RoleApplicantPreviewList
            applicants={applicants}
            onApplicantPress={onApplicantPress}
          />
        ) : null}
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
          logoStoragePath={logoStoragePath}
          title={job.title}
          location={[locationName, location].filter(Boolean).join(' · ') || null}
          detail={roleMeta}
          postedLabel={postedLabel || null}
          textFooter={showApplicantPill ? undefined : (wageLabel ?? undefined)}
          footer={showApplicantPill ? (wageLabel ?? undefined) : undefined}
          avatarSize={44}
          accessory={headerActions}
          detailAccessory={
            applicantLead ? (
              <View style={{ gap: 8 }}>
                {applicantLead}
                {applicantControl}
              </View>
            ) : (
              applicantControl
            )
          }
        />
      </View>
    </SurfaceCard>
  );
}
