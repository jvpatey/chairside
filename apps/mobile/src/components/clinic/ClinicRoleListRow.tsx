import type { JobPost } from '@chairside/api';
import { formatJobPostRoleMeta } from '@chairside/config';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Platform, Pressable, Text, View } from 'react-native';

import { showJobPostManageMenu } from '@/components/clinic/jobPostManageMenu';
import { JobPostStatusBadge } from '@/components/clinic/JobPostStatusBadge';
import { ClinicLogoAvatar } from '@/components/clinic/ClinicLogoAvatar';
import { ApplicantCountButton } from '@/components/ui/ApplicantCountButton';
import { BadgeRow } from '@/components/ui/BadgeRow';
import { BrowseListRow } from '@/components/ui/BrowseListRow';
import { FeaturedListingBadge } from '@/components/worker/FeaturedListingBadge';
import { useFeaturedListingTreatment } from '@/components/worker/featuredListingTreatment';
import { useClinicBilling } from '@/contexts/ClinicBillingContext';
import { useClinicProfile } from '@/contexts/ClinicProfileContext';
import { useClinicLogoUri } from '@/hooks/useClinicLogoUri';
import { useResolvedClinicLogoPath } from '@/hooks/useResolvedClinicLogoPath';
import {
  CLINIC_ROLE_TABLE_COLUMNS,
  clinicPostingTableGridTemplate,
  formatClinicApplicantCount,
  formatClinicPostingLocation,
  formatClinicPostingPostedDate,
  formatClinicRoleCompactMeta,
} from '@/lib/clinicPostingListDisplay';
import { webListRowHoverStyles, webOnlyStyle, webPointer } from '@/lib/webPressableStyles';
import { useTheme, useThemedStyles } from '@/theme';

import type { RolePostingCardManageProps } from '@/components/clinic/RolePostingCard';

type ClinicRoleListRowProps = {
  job: JobPost;
  applicantCount?: number;
  tableMode?: boolean;
  onPress?: () => void;
  onApplicantsPress?: () => void;
  manage?: RolePostingCardManageProps;
};

export function ClinicRoleListRow({
  job,
  applicantCount = 0,
  tableMode = false,
  onPress,
  onApplicantsPress,
  manage,
}: ClinicRoleListRowProps) {
  const { colors } = useTheme();
  const { clinicProfile, locations } = useClinicProfile();
  const { billing } = useClinicBilling();
  const featuredTreatment = useFeaturedListingTreatment();
  const logoStoragePath = useResolvedClinicLogoPath(job.location_id);
  const logoUri = useClinicLogoUri(logoStoragePath);
  const clinicName = clinicProfile?.clinic_name?.trim() || 'Your clinic';
  const locationRecord = locations.find((location) => location.id === job.location_id);
  const locationLabel =
    formatClinicPostingLocation(
      locationRecord?.name,
      locationRecord?.city ?? clinicProfile?.city,
      locationRecord?.province ?? clinicProfile?.province,
    ) || '—';
  const roleMeta = formatJobPostRoleMeta(job);
  const postedDate = formatClinicPostingPostedDate(job.created_at);
  const isFeatured = job.status === 'live' && Boolean(billing?.hasPriorityListing);
  const gridTemplate = clinicPostingTableGridTemplate(CLINIC_ROLE_TABLE_COLUMNS);

  const styles = useThemedStyles(({ colors, spacing }) => ({
    listRowWrap: {
      position: 'relative',
      overflow: 'hidden',
    },
    accentRail: {
      position: 'absolute',
      left: 0,
      top: spacing.sm,
      bottom: spacing.sm,
      width: 3,
      borderRadius: 2,
      zIndex: 1,
    },
    tableRow: {
      minHeight: Platform.OS === 'web' ? 40 : 44,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      ...webPointer(),
      ...webOnlyStyle({
        display: 'grid',
        gridTemplateColumns: gridTemplate,
        alignItems: 'center',
        gap: spacing.sm,
      } as const),
    },
    tableRowHovered: webListRowHoverStyles(colors),
    tableRowPressed: {
      opacity: 0.88,
    },
    roleCell: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      minWidth: 0,
    },
    title: {
      flex: 1,
      minWidth: 0,
      fontSize: 14,
      fontWeight: '600',
      color: colors.labelPrimary,
    },
    cell: {
      fontSize: 13,
      color: colors.labelSecondary,
    },
    pay: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.primary,
    },
    muted: {
      fontSize: 13,
      color: colors.labelTertiary,
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
      <Ionicons name="ellipsis-horizontal" size={18} color={colors.labelTertiary} />
    </Pressable>
  ) : null;

  const applicantControl =
    applicantCount > 0 && onApplicantsPress ? (
      <ApplicantCountButton
        label={formatClinicApplicantCount(applicantCount)}
        onPress={onApplicantsPress}
        accessibilityLabel={`Review ${applicantCount} applicants`}
      />
    ) : (
      <Text style={styles.muted}>{formatClinicApplicantCount(applicantCount)}</Text>
    );

  if (tableMode && Platform.OS === 'web') {
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={job.title}
        onPress={onPress}
        style={({ pressed, hovered }) => [
          styles.tableRow,
          hovered && !pressed && styles.tableRowHovered,
          pressed && styles.tableRowPressed,
        ]}>
        <View style={styles.roleCell}>
          <ClinicLogoAvatar clinicName={clinicName} logoUri={logoUri} size={28} />
          <Text style={styles.title} numberOfLines={1}>
            {job.title}
          </Text>
        </View>
        <Text style={styles.cell} numberOfLines={1}>
          {roleMeta}
        </Text>
        <JobPostStatusBadge status={job.status} />
        <Text style={styles.cell} numberOfLines={1}>
          {locationLabel}
        </Text>
        {applicantControl}
        <Text style={styles.cell} numberOfLines={1}>
          {postedDate}
        </Text>
        <Text style={job.wage_range ? styles.pay : styles.muted} numberOfLines={1}>
          {job.wage_range || '—'}
        </Text>
        {manageButton ?? <View />}
      </Pressable>
    );
  }

  return (
    <View
      style={[
        styles.listRowWrap,
        isFeatured ? { backgroundColor: featuredTreatment.cardStyle.backgroundColor } : null,
      ]}>
      {isFeatured ? (
        <View
          style={[styles.accentRail, { backgroundColor: featuredTreatment.railColor }]}
          pointerEvents="none"
        />
      ) : null}
      <BrowseListRow
        compact
        avatar={<ClinicLogoAvatar clinicName={clinicName} logoUri={logoUri} size={40} />}
        title={job.title}
        meta={formatClinicRoleCompactMeta(job, applicantCount)}
        topTrailing={
          <BadgeRow>
            {isFeatured ? <FeaturedListingBadge /> : null}
            <JobPostStatusBadge status={job.status} />
          </BadgeRow>
        }
        trailing={manageButton}
        onPress={onPress}
        showChevron={Boolean(onPress)}
      />
    </View>
  );
}
