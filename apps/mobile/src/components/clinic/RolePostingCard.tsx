import type { JobPost } from '@chairside/api';
import { formatJobPostRoleMeta } from '@chairside/config';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Pressable, Text, View } from 'react-native';

import { showJobPostManageMenu } from '@/components/clinic/jobPostManageMenu';
import { JobPostStatusBadge } from '@/components/clinic/JobPostStatusBadge';
import { ClinicLogoAvatar } from '@/components/clinic/ClinicLogoAvatar';
import { BrowseListRow } from '@/components/ui/BrowseListRow';
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
  isLast?: boolean;
  onPress?: () => void;
  onApplicantsPress?: () => void;
  manage?: RolePostingCardManageProps;
};

function ApplicantCountPill({ count }: { count: number }) {
  const styles = useThemedStyles(({ colors, spacing }) => ({
    pill: {
      alignSelf: 'flex-start',
      backgroundColor: colors.primarySubtle,
      borderRadius: 999,
      paddingHorizontal: spacing.sm,
      paddingVertical: 4,
    },
    text: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.primary,
    },
  }));

  return (
    <View style={styles.pill}>
      <Text style={styles.text}>
        {count === 1 ? '1 applicant' : `${count} applicants`}
      </Text>
    </View>
  );
}

export function RolePostingCard({
  job,
  applicantCount,
  layout = 'tile',
  isLast,
  onPress,
  onApplicantsPress,
  manage,
}: RolePostingCardProps) {
  const { colors } = useTheme();
  const { clinicProfile } = useClinicProfile();
  const logoUri = useClinicLogoUri(clinicProfile?.logo_storage_path);
  const hasApplicants = applicantCount != null && applicantCount > 0;
  const clinicName = clinicProfile?.clinic_name?.trim() || 'Your clinic';
  const location = [clinicProfile?.city, clinicProfile?.province].filter(Boolean).join(', ');
  const postedLabel = formatPostedDateLabel(job.created_at);

  const styles = useThemedStyles(({ colors, spacing }) => ({
    card: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.separator,
      padding: spacing.md,
    },
    cardPressed: {
      opacity: 0.92,
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
    applicantsPressable: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
    },
    applicantsPressablePressed: {
      opacity: 0.75,
    },
    headerActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
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

  const applicantFooter =
    applicantCount != null && applicantCount > 0 ? (
      hasApplicants && onApplicantsPress ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Review ${applicantCount} applicants`}
          onPress={(event) => {
            event.stopPropagation?.();
            void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onApplicantsPress();
          }}
          style={({ pressed }) => [
            styles.applicantsPressable,
            pressed && styles.applicantsPressablePressed,
          ]}>
          <ApplicantCountPill count={applicantCount} />
          <Ionicons name="chevron-forward" size={16} color={colors.labelTertiary} />
        </Pressable>
      ) : (
        <ApplicantCountPill count={applicantCount} />
      )
    ) : null;

  if (layout === 'list') {
    return (
      <BrowseListRow
        avatar={<ClinicLogoAvatar clinicName={clinicName} logoUri={logoUri} size={40} />}
        eyebrow={clinicName}
        title={job.title}
        meta={location || null}
        detail={formatJobPostRoleMeta(job)}
        postedLabel={postedLabel || null}
        topTrailing={headerActions}
        showChevron={!onApplicantsPress || !(applicantCount != null && applicantCount > 0)}
        footer={
          <>
            {applicantFooter}
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
      clinicName={clinicName}
      logoStoragePath={clinicProfile?.logo_storage_path}
      title={job.title}
      location={location || null}
      detail={formatJobPostRoleMeta(job)}
      postedLabel={postedLabel || null}
      avatarSize={44}
      accessory={headerActions}
      textFooter={applicantFooter}
      footer={
        job.wage_range ? (
          <View style={styles.footer}>
            <Text style={styles.wage}>{job.wage_range}</Text>
          </View>
        ) : null
      }
    />
  );

  if (!onPress) {
    return <View style={styles.card}>{content}</View>;
  }

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
