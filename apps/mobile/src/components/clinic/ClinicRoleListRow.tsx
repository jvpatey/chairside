import type { JobPost } from '@chairside/api';
import { formatJobPostRoleMeta } from '@chairside/config';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Platform, Pressable, Text, View } from 'react-native';

import { showJobPostManageMenu } from '@/components/clinic/jobPostManageMenu';
import { JobPostStatusBadge } from '@/components/clinic/JobPostStatusBadge';
import { ClinicLogoAvatar } from '@/components/clinic/ClinicLogoAvatar';
import { ApplicantAvatarStack } from '@/components/ui/ApplicantAvatarStack';
import { BadgeRow } from '@/components/ui/BadgeRow';
import { BrowseListRow } from '@/components/ui/BrowseListRow';
import { FeaturedListingBadge } from '@/components/worker/FeaturedListingBadge';
import { useFeaturedListingTreatment } from '@/components/worker/featuredListingTreatment';
import { useClinicBilling } from '@/contexts/ClinicBillingContext';
import { useClinicProfile } from '@/contexts/ClinicProfileContext';
import { useClinicLogoUri } from '@/hooks/useClinicLogoUri';
import { useResolvedClinicLogoPath } from '@/hooks/useResolvedClinicLogoPath';
import type { JobApplicantPreview } from '@/lib/dashboardAttention';
import {
  clinicPostingTableGridTemplate,
  formatClinicApplicantCount,
  formatClinicPostingTableLocation,
  formatClinicPostingPostedDate,
  formatClinicRoleCompactMeta,
  getClinicRoleTableColumns,
  type ClinicPostingTableColumn,
} from '@/lib/clinicPostingListDisplay';
import { webHover, webListRowHoverStyles, webOnlyStyle, webPointer } from '@/lib/webPressableStyles';
import { useTheme, useThemedStyles } from '@/theme';
import { webTransition } from '@/theme/web';

import type { RolePostingCardManageProps } from '@/components/clinic/RolePostingCard';

type ClinicRoleListRowProps = {
  job: JobPost;
  applicantCount?: number;
  applicants?: JobApplicantPreview[];
  tableMode?: boolean;
  columns?: readonly ClinicPostingTableColumn[];
  onPress?: () => void;
  onApplicantsPress?: () => void;
  manage?: RolePostingCardManageProps;
};

const TABLE_AVATAR_STACK_MAX = 3;
const TABLE_AVATAR_SIZE = 24;

export function ClinicRoleListRow({
  job,
  applicantCount = 0,
  applicants = [],
  tableMode = false,
  columns: columnsProp,
  onPress,
  onApplicantsPress,
  manage,
}: ClinicRoleListRowProps) {
  const { colors } = useTheme();
  const { clinicProfile, locations, accessibleLocations } = useClinicProfile();
  const { billing } = useClinicBilling();
  const featuredTreatment = useFeaturedListingTreatment();
  const logoStoragePath = useResolvedClinicLogoPath(job.location_id);
  const logoUri = useClinicLogoUri(logoStoragePath);
  const clinicName = clinicProfile?.clinic_name?.trim() || 'Your clinic';
  const locationRecord = locations.find((location) => location.id === job.location_id);
  const locationLabel = formatClinicPostingTableLocation(
    locationRecord?.name,
    locationRecord?.city ?? clinicProfile?.city,
  );
  const roleMeta = formatJobPostRoleMeta(job);
  const postedDate = formatClinicPostingPostedDate(job.created_at);
  const isFeatured = job.status === 'live' && Boolean(billing?.hasPriorityListing);
  const columns = columnsProp ?? getClinicRoleTableColumns(accessibleLocations.length > 1);
  const gridTemplate = clinicPostingTableGridTemplate(columns);

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
      minHeight: 56,
      paddingHorizontal: spacing.lg,
      paddingVertical: 12,
      ...webPointer(),
      ...webTransition(['background-color']),
      ...webOnlyStyle({
        display: 'grid',
        gridTemplateColumns: gridTemplate,
        alignItems: 'center',
        columnGap: spacing.lg,
      } as const),
    },
    tableRowHovered: webListRowHoverStyles(colors),
    tableRowPressed: {
      opacity: 0.88,
    },
    roleCell: {
      minWidth: 0,
      width: '100%',
      gap: 2,
    },
    titleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      minWidth: 0,
    },
    title: {
      flex: 1,
      minWidth: 0,
      fontSize: 15,
      lineHeight: 20,
      fontWeight: '600',
      letterSpacing: -0.2,
      color: colors.labelPrimary,
    },
    featuredMark: {
      flexShrink: 0,
    },
    subtitle: {
      fontSize: 13,
      lineHeight: 18,
      color: colors.labelTertiary,
      minWidth: 0,
    },
    cell: {
      fontSize: 13,
      lineHeight: 18,
      color: colors.labelSecondary,
      minWidth: 0,
      width: '100%',
      overflow: 'hidden',
      whiteSpace: 'nowrap' as const,
    },
    numericCell: {
      minWidth: 0,
      width: '100%',
      ...webOnlyStyle({ justifySelf: 'end' } as const),
    },
    numericText: {
      fontSize: 13,
      lineHeight: 18,
      fontWeight: '500',
      color: colors.labelSecondary,
      textAlign: 'right' as const,
      fontVariant: ['tabular-nums'] as const,
    },
    applicantCluster: {
      flexDirection: 'row',
      alignItems: 'center',
      alignSelf: 'flex-start',
      gap: 8,
      minHeight: 28,
    },
    applicantButton: {
      flexDirection: 'row',
      alignItems: 'center',
      alignSelf: 'flex-start',
      gap: 8,
      minHeight: 28,
      paddingRight: 6,
      borderRadius: 8,
      ...webPointer(),
    },
    applicantButtonHovered: webListRowHoverStyles(colors),
    applicantCount: {
      fontSize: 13,
      lineHeight: 18,
      fontWeight: '600',
      color: colors.primary,
      fontVariant: ['tabular-nums'] as const,
    },
    pay: {
      fontSize: 13,
      lineHeight: 18,
      fontWeight: '600',
      color: colors.labelPrimary,
      textAlign: 'right' as const,
      fontVariant: ['tabular-nums'] as const,
    },
    muted: {
      fontSize: 13,
      lineHeight: 18,
      color: colors.labelTertiary,
      textAlign: 'right' as const,
    },
    menuButton: {
      width: 32,
      height: 32,
      borderRadius: 8,
      alignItems: 'center',
      justifyContent: 'center',
      ...webOnlyStyle({ justifySelf: 'end' } as const),
      ...webPointer(),
    },
    menuButtonHovered: webListRowHoverStyles(colors),
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
      hitSlop={8}
      onPress={(event) => {
        event.stopPropagation?.();
        handleManagePress();
      }}
      style={({ pressed, hovered }) => [
        styles.menuButton,
        webHover(hovered, pressed, styles.menuButtonHovered),
        pressed && styles.menuButtonPressed,
      ]}>
      <Ionicons name="ellipsis-horizontal" size={18} color={colors.labelTertiary} />
    </Pressable>
  ) : (
    <View />
  );

  const applicantStack =
    applicants.length > 0 ? (
      <ApplicantAvatarStack
        names={applicants.map((applicant) => applicant.name)}
        photoPaths={applicants.map((applicant) => applicant.photoPath)}
        maxVisible={TABLE_AVATAR_STACK_MAX}
        size={TABLE_AVATAR_SIZE}
        showOverflow={false}
      />
    ) : null;

  const applicantCountLabel = (
    <Text style={applicantCount > 0 ? styles.applicantCount : styles.cell}>
      {applicantCount > 0 ? applicantCount : '—'}
    </Text>
  );

  const applicantControl =
    applicantCount > 0 && onApplicantsPress ? (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Review ${formatClinicApplicantCount(applicantCount)}`}
        onPress={(event) => {
          event.stopPropagation?.();
          void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onApplicantsPress();
        }}
        style={({ pressed, hovered }) => [
          styles.applicantButton,
          webHover(hovered, pressed, styles.applicantButtonHovered),
          pressed && { opacity: 0.75 },
        ]}>
        {applicantStack}
        {applicantCountLabel}
      </Pressable>
    ) : (
      <View style={styles.applicantCluster}>
        {applicantStack}
        {applicantCountLabel}
      </View>
    );

  const renderTableCell = (column: ClinicPostingTableColumn) => {
    switch (column.key) {
      case 'role':
        return (
          <View key={column.key} style={styles.roleCell}>
            <View style={styles.titleRow}>
              {isFeatured ? (
                <View style={styles.featuredMark}>
                  <FeaturedListingBadge compact />
                </View>
              ) : null}
              <Text style={styles.title} numberOfLines={1}>
                {job.title}
              </Text>
            </View>
            <Text style={styles.subtitle} numberOfLines={1}>
              {roleMeta}
            </Text>
          </View>
        );
      case 'status':
        return (
          <View key={column.key}>
            <JobPostStatusBadge status={job.status} size="sm" />
          </View>
        );
      case 'location':
        return (
          <Text key={column.key} style={styles.cell} numberOfLines={1}>
            {locationLabel}
          </Text>
        );
      case 'applicants':
        return (
          <View key={column.key}>
            {applicantControl}
          </View>
        );
      case 'posted':
        return (
          <Text key={column.key} style={[styles.numericText, styles.numericCell]} numberOfLines={1}>
            {postedDate}
          </Text>
        );
      case 'pay':
        return (
          <Text
            key={column.key}
            style={[job.wage_range ? styles.pay : styles.muted, styles.numericCell]}
            numberOfLines={1}
          >
            {job.wage_range || '—'}
          </Text>
        );
      case 'actions':
        return <View key={column.key}>{manageButton}</View>;
      default:
        return null;
    }
  };

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
        {columns.map(renderTableCell)}
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
        trailing={manage ? manageButton : null}
        onPress={onPress}
        showChevron={Boolean(onPress)}
      />
    </View>
  );
}
