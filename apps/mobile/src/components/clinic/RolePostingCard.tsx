import type { JobPost } from '@chairside/api';
import { formatJobPostRoleMeta } from '@chairside/config';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Pressable, Text, View } from 'react-native';

import { showJobPostManageMenu } from '@/components/clinic/jobPostManageMenu';
import { JobPostStatusBadge } from '@/components/clinic/JobPostStatusBadge';
import { useTheme, useThemedStyles } from '@/theme';

export type RolePostingCardManageProps = {
  clinicId: string;
  onUpdated: (job: JobPost) => void;
  onDeleted: () => void;
};

type RolePostingCardProps = {
  job: JobPost;
  applicantCount?: number;
  onPress?: () => void;
  manage?: RolePostingCardManageProps;
};

export function RolePostingCard({
  job,
  applicantCount,
  onPress,
  manage,
}: RolePostingCardProps) {
  const { colors } = useTheme();
  const hasApplicants = applicantCount != null && applicantCount > 0;
  const showFooter = Boolean(job.wage_range || applicantCount != null);

  const styles = useThemedStyles(({ colors, spacing }) => ({
    card: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.separator,
      overflow: 'hidden',
    },
    cardPressed: {
      opacity: 0.92,
    },
    cardBody: {
      padding: spacing.md,
      gap: spacing.sm,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: spacing.sm,
    },
    headerMain: {
      flex: 1,
      gap: spacing.xs,
      paddingRight: spacing.xs,
      minWidth: 0,
    },
    headerActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      flexShrink: 0,
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
    title: {
      fontSize: 16,
      fontWeight: '600',
      lineHeight: 22,
      letterSpacing: -0.2,
      color: colors.labelPrimary,
    },
    meta: {
      fontSize: 14,
      lineHeight: 20,
      color: colors.labelSecondary,
      marginTop: 2,
    },
    footer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: spacing.sm,
    },
    footerEnd: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
      flexShrink: 0,
    },
    wage: {
      fontSize: 15,
      fontWeight: '600',
      color: colors.primary,
      letterSpacing: -0.1,
      flex: 1,
    },
    applicants: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.labelSecondary,
    },
    applicantsActive: {
      color: colors.primary,
    },
    applicantsPill: {
      backgroundColor: colors.primarySubtle,
      borderRadius: 999,
      paddingHorizontal: spacing.sm,
      paddingVertical: 4,
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

  const navigate = onPress
    ? () => {
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress();
      }
    : undefined;

  const body = (
    <>
      <View style={styles.header}>
        <View style={styles.headerMain}>
          <Text style={styles.title} numberOfLines={2}>
            {job.title}
          </Text>
          <Text style={styles.meta}>{formatJobPostRoleMeta(job)}</Text>
        </View>
        <View style={styles.headerActions}>
          <JobPostStatusBadge status={job.status} />
          {manage ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Manage role posting"
              hitSlop={10}
              onPress={handleManagePress}
              style={({ pressed }) => [styles.menuButton, pressed && styles.menuButtonPressed]}
            >
              <Ionicons name="ellipsis-horizontal" size={20} color={colors.labelTertiary} />
            </Pressable>
          ) : null}
        </View>
      </View>

      {showFooter ? (
        <View style={styles.footer}>
          {job.wage_range ? (
            <Text style={styles.wage} numberOfLines={1}>
              {job.wage_range}
            </Text>
          ) : (
            <View style={{ flex: 1 }} />
          )}
          {applicantCount != null ? (
            <View style={styles.footerEnd}>
              <View style={hasApplicants ? styles.applicantsPill : undefined}>
                <Text style={[styles.applicants, hasApplicants && styles.applicantsActive]}>
                  {applicantCount === 1 ? '1 applicant' : `${applicantCount} applicants`}
                </Text>
              </View>
              {onPress ? (
                <Ionicons name="chevron-forward" size={16} color={colors.labelTertiary} />
              ) : null}
            </View>
          ) : onPress ? (
            <Ionicons name="chevron-forward" size={16} color={colors.labelTertiary} />
          ) : null}
        </View>
      ) : onPress ? (
        <View style={[styles.footer, { justifyContent: 'flex-end' }]}>
          <Ionicons name="chevron-forward" size={16} color={colors.labelTertiary} />
        </View>
      ) : null}
    </>
  );

  if (!onPress) {
    return (
      <View style={styles.card}>
        <View style={styles.cardBody}>{body}</View>
      </View>
    );
  }

  return (
    <Pressable
      accessibilityRole="button"
      onPress={navigate}
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
    >
      <View style={styles.cardBody}>{body}</View>
    </Pressable>
  );
}
