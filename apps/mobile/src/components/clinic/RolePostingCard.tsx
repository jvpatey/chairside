import type { JobPost } from '@chairside/api';
import { formatJobPostRoleMeta } from '@chairside/config';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Pressable, Text, View } from 'react-native';

import { showJobPostManageMenu } from '@/components/clinic/jobPostManageMenu';
import { JobPostStatusBadge } from '@/components/clinic/JobPostStatusBadge';
import { ClinicLogoAvatar } from '@/components/clinic/ClinicLogoAvatar';
import { PostingCardActionRow } from '@/components/clinic/PostingCardActionButton';
import { BrowseListRow } from '@/components/ui/BrowseListRow';
import { SurfaceCard } from '@/components/ui/SurfaceCard';
import { ClinicPostHeader } from '@/components/worker/ClinicPostHeader';
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
};

export function RolePostingCard({
  job,
  applicantCount = 0,
  layout = 'tile',
  onPress,
  onApplicantsPress,
  manage,
}: RolePostingCardProps) {
  const { colors } = useTheme();
  const { clinicProfile } = useClinicProfile();
  const logoUri = useClinicLogoUri(clinicProfile?.logo_storage_path);
  const clinicName = clinicProfile?.clinic_name?.trim() || 'Your clinic';
  const location = [clinicProfile?.city, clinicProfile?.province].filter(Boolean).join(', ');
  const postedLabel = formatPostedDateLabel(job.created_at);
  const roleMeta = formatJobPostRoleMeta(job);

  const styles = useThemedStyles(({ colors, spacing }) => ({
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

  const headerActions = (
    <View style={styles.headerActions}>
      {statusBadge}
      {manageButton}
    </View>
  );

  const actionRow = (
    <PostingCardActionRow
      onViewPost={onPress}
      onViewApplicants={onApplicantsPress}
      applicantCount={applicantCount}
    />
  );

  const wageFooter = job.wage_range ? (
    <Text style={styles.wage}>{job.wage_range}</Text>
  ) : null;

  if (layout === 'list') {
    return (
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
        showChevron={false}
        action={actionRow}
      />
    );
  }

  return (
    <SurfaceCard>
      <ClinicPostHeader
        layout="split"
        headerOnly
        clinicName={clinicName}
        logoStoragePath={clinicProfile?.logo_storage_path}
        title={job.title}
        location={location || null}
        detail={roleMeta}
        postedLabel={postedLabel || null}
        avatarSize={44}
        accessory={headerActions}
        footer={wageFooter}
        action={actionRow}
      />
    </SurfaceCard>
  );
}
