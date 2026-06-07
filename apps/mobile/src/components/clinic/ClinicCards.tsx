import type { ConfirmedFillInSummary, JobApplicationSummary, JobPost, ShiftPost } from '@chairside/api';
import { formatJobApplicationSummaryMeta } from '@chairside/config';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import type { ReactNode } from 'react';
import { useState } from 'react';
import { Pressable, Platform, Text, View } from 'react-native';

import { FillInPostingCard } from '@/components/clinic/FillInPostingCard';
import { ConfirmedFillInCard } from '@/components/clinic/ConfirmedFillInCard';
import { RolePostingCard } from '@/components/clinic/RolePostingCard';
import { DashboardHeroCard } from '@/components/dashboard/DashboardHeroCard';
import { ApplicationCardBadge } from '@/components/ui/ApplicationCardBadge';
import { NotificationCountBadge } from '@/components/ui/NotificationCountBadge';
import { useClinicProfile } from '@/contexts/ClinicProfileContext';
import { useClinicLogo } from '@/hooks/useClinicLogo';
import { ClinicPostHeader } from '@/components/worker/ClinicPostHeader';
import { CLINIC_PROFILE, type FillInReturnTarget } from '@/lib/routing';

import { isTodayOrUpcomingShiftDate } from '@/lib/fillInFilters';
import { isMainListJob } from '@/lib/postingFilters';
import { webHover, webPointer, webTileHoverStyles } from '@/lib/webPressableStyles';
import { useTheme, useThemedStyles } from '@/theme';

type DashboardHeroProps = {
  clinicName?: string | null;
  province?: string;
  showLocationBadge?: boolean;
};

const CLINIC_NAME_PLACEHOLDER = 'Your practice';

export function DashboardHero({
  clinicName,
  province = 'NS',
  showLocationBadge = false,
}: DashboardHeroProps) {
  const { logoUri } = useClinicLogo();

  return (
    <DashboardHeroCard
      profileHref={CLINIC_PROFILE}
      avatarKind="clinic"
      displayName={clinicName}
      photoUri={logoUri}
      namePlaceholder={CLINIC_NAME_PLACEHOLDER}
      province={province}
      showProvinceBadge={showLocationBadge}
    />
  );
}

type SectionHeaderProps = {
  title: string;
};

export function SectionHeader({ title }: SectionHeaderProps) {
  const styles = useThemedStyles(({ spacing, typography }) => ({
    header: {
      marginBottom: spacing.sm,
    },
    title: {
      ...typography.body,
      fontSize: 13,
      fontWeight: '600',
      letterSpacing: 0.4,
      textTransform: 'uppercase',
      color: typography.subtitle.color,
    },
  }));

  return (
    <View style={styles.header}>
      <Text style={styles.title}>{title}</Text>
    </View>
  );
}

type QuickActionTileProps = {
  label: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  variant?: 'primary' | 'secondary';
  onPress: () => void;
};

export function QuickActionTile({
  label,
  description,
  icon,
  variant = 'primary',
  onPress,
}: QuickActionTileProps) {
  const { colors } = useTheme();
  const iconWrapBackground =
    variant === 'primary' ? colors.primarySubtle : colors.fillSubtle;

  const styles = useThemedStyles(({ colors, spacing, typography, isDark }) => ({
    tile: {
      flex: 1,
      borderRadius: 16,
      padding: spacing.md,
      gap: spacing.sm,
      minHeight: 112,
      borderWidth: 1,
      borderColor: colors.separator,
      backgroundColor: colors.surface,
      // @ts-expect-error — cursor is web-only
      cursor: 'pointer',
      // @ts-expect-error — transitionDuration is web-only
      transitionDuration: '140ms',
    },
    tileHovered: {
      backgroundColor: colors.fillSubtle,
      borderColor: colors.labelTertiary,
      // @ts-expect-error — boxShadow is web-only
      boxShadow: isDark
        ? '0 6px 18px rgba(0, 0, 0, 0.22)'
        : '0 4px 14px rgba(0, 0, 0, 0.08)',
    },
    tilePressed: {
      opacity: 0.88,
      backgroundColor: colors.fillSubtle,
    },
    iconWrap: {
      width: 36,
      height: 36,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: iconWrapBackground,
    },
    label: {
      ...typography.body,
      fontWeight: '600',
      fontSize: 15,
      color: colors.labelPrimary,
    },
    description: {
      fontSize: 12,
      lineHeight: 16,
      color: colors.labelSecondary,
    },
  }));

  const handlePress = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  const isWeb = Platform.OS === 'web';

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${label}. ${description}`}
      accessibilityHint="Opens this section of the app"
      onPress={handlePress}
      style={({ pressed, hovered }) => [
        styles.tile,
        isWeb && hovered && !pressed && styles.tileHovered,
        pressed && styles.tilePressed,
      ]}>
      <View style={styles.iconWrap}>
        <Ionicons name={icon} size={20} color={colors.primary} />
      </View>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.description}>{description}</Text>
    </Pressable>
  );
}

export type OverviewStat = 'roles' | 'fill-ins' | 'applications';

type StatGridProps = {
  openRoles: number;
  fillInsPosted: number;
  totalApplications: number;
  applicationUpdateCount?: number;
  fillInUpdateCount?: number;
  selected: OverviewStat;
  onSelect: (stat: OverviewStat) => void;
};

export function StatGrid({
  openRoles,
  fillInsPosted,
  totalApplications,
  applicationUpdateCount = 0,
  fillInUpdateCount = 0,
  selected,
  onSelect,
}: StatGridProps) {
  const stats: {
    key: OverviewStat;
    label: string;
    value: number;
    badgeCount: number;
  }[] = [
    { key: 'roles', label: 'Open roles', value: openRoles, badgeCount: 0 },
    { key: 'fill-ins', label: 'Fill-ins', value: fillInsPosted, badgeCount: fillInUpdateCount },
    {
      key: 'applications',
      label: 'Applications',
      value: totalApplications,
      badgeCount: applicationUpdateCount,
    },
  ];

  const styles = useThemedStyles(({ colors, spacing, typography, isDark }) => ({
    grid: {
      flexDirection: 'row',
      gap: spacing.sm,
    },
    cellWrap: {
      flex: 1,
      position: 'relative',
    },
    badgeAnchor: {
      position: 'absolute',
      top: -4,
      right: -2,
      zIndex: 1,
    },
    cell: {
      backgroundColor: colors.backgroundGrouped,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.separator,
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.sm,
      alignItems: 'center',
      gap: 2,
      // @ts-expect-error — cursor is web-only
      cursor: 'pointer',
      // @ts-expect-error — transitionDuration is web-only
      transitionDuration: '140ms',
    },
    cellSelected: {
      borderColor: colors.primary,
      backgroundColor: colors.surface,
    },
    cellHovered: {
      backgroundColor: colors.surface,
      borderColor: colors.labelTertiary,
      // @ts-expect-error — boxShadow is web-only
      boxShadow: isDark
        ? '0 4px 12px rgba(0, 0, 0, 0.2)'
        : '0 4px 12px rgba(0, 0, 0, 0.07)',
    },
    cellSelectedHovered: {
      borderColor: colors.primary,
      // @ts-expect-error — boxShadow is web-only
      boxShadow: isDark
        ? '0 4px 12px rgba(74, 154, 255, 0.16)'
        : '0 4px 12px rgba(26, 111, 212, 0.12)',
    },
    value: {
      ...typography.title,
      fontSize: 20,
      lineHeight: 24,
      color: colors.labelPrimary,
    },
    valueSelected: {
      color: colors.primary,
    },
    label: {
      fontSize: 11,
      fontWeight: '600',
      color: colors.labelSecondary,
      textAlign: 'center',
    },
  }));

  const isWeb = Platform.OS === 'web';

  return (
    <View style={styles.grid}>
      {stats.map((stat) => {
        const isSelected = selected === stat.key;
        return (
          <View key={stat.key} style={styles.cellWrap}>
            {stat.badgeCount > 0 ? (
              <View style={styles.badgeAnchor}>
                <NotificationCountBadge count={stat.badgeCount} />
              </View>
            ) : null}
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ selected: isSelected }}
              accessibilityLabel={`${stat.label}: ${stat.value}${
                stat.badgeCount > 0 ? `, ${stat.badgeCount} updates` : ''
              }`}
              onPress={() => onSelect(stat.key)}
              style={({ pressed, hovered }) => [
                styles.cell,
                isSelected && styles.cellSelected,
                isWeb && hovered && !pressed && (isSelected ? styles.cellSelectedHovered : styles.cellHovered),
                pressed && { opacity: 0.85 },
              ]}>
              <Text style={[styles.value, isSelected && styles.valueSelected]}>{stat.value}</Text>
              <Text style={styles.label}>{stat.label}</Text>
            </Pressable>
          </View>
        );
      })}
    </View>
  );
}

const OVERVIEW_SECTION_TITLES: Record<OverviewStat, string> = {
  roles: 'Open roles',
  'fill-ins': 'Fill-ins',
  applications: 'Applications',
};

type DashboardOverviewPanelProps = {
  selected: OverviewStat;
  jobs: JobPost[];
  shifts: ShiftPost[];
  confirmedFillIns?: ConfirmedFillInSummary[];
  jobApplicationSummaries: JobApplicationSummary[];
  applicantCounts?: Record<string, number>;
  shiftPendingCounts?: Record<string, number>;
  shiftApplicationCounts?: Record<string, number>;
  clinicId?: string;
  fillInReturnTo?: FillInReturnTarget;
  onJobUpdated?: (job: JobPost) => void;
  onJobDeleted?: (jobId: string) => void;
  onShiftUpdated?: (shift: ShiftPost) => void;
  onShiftDeleted?: (shiftId: string) => void;
  onJobPress?: (jobId: string) => void;
  onJobApplicationsPress?: (jobId: string) => void;
};

function DashboardListCard({
  title,
  subtitle,
  meta,
  statusBadge,
  highlighted = false,
  onPress,
}: {
  title: string;
  subtitle: string;
  meta?: string;
  statusBadge?: ReactNode;
  highlighted?: boolean;
  onPress?: () => void;
}) {
  const { clinicProfile } = useClinicProfile();
  const clinicName = clinicProfile?.clinic_name?.trim() || 'Your clinic';
  const location = [clinicProfile?.city, clinicProfile?.province].filter(Boolean).join(', ');

  const styles = useThemedStyles(({ colors, spacing, isDark }) => ({
    card: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.separator,
      padding: spacing.md,
      ...webPointer(),
    },
    cardHovered: webTileHoverStyles(colors, isDark),
    cardPressed: {
      opacity: 0.92,
    },
    statPill: {
      alignSelf: 'flex-start',
      backgroundColor: colors.primarySubtle,
      borderRadius: 999,
      paddingHorizontal: spacing.sm,
      paddingVertical: 4,
    },
    statPillHighlighted: {
      backgroundColor: colors.primary,
    },
    statText: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.primary,
    },
    statTextHighlighted: {
      color: colors.primaryOnPrimary,
    },
    meta: {
      fontSize: 14,
      lineHeight: 20,
      color: colors.labelSecondary,
    },
  }));

  const accessory = highlighted ? (statusBadge ?? <ApplicationCardBadge />) : statusBadge;

  const content = (
    <ClinicPostHeader
      clinicName={clinicName}
      logoStoragePath={clinicProfile?.logo_storage_path}
      title={title}
      location={location || null}
      detail={meta ?? null}
      avatarSize={44}
      accessory={accessory}
      textFooter={
        subtitle ? (
          <View style={[styles.statPill, highlighted && styles.statPillHighlighted]}>
            <Text style={[styles.statText, highlighted && styles.statTextHighlighted]}>
              {subtitle}
            </Text>
          </View>
        ) : null
      }
    />
  );

  if (!onPress) {
    return <View style={styles.card}>{content}</View>;
  }

  const handlePress = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  return (
    <Pressable
      accessibilityRole="button"
      onPress={handlePress}
      style={({ pressed, hovered }) => [
        styles.card,
        webHover(hovered, pressed, styles.cardHovered),
        pressed && styles.cardPressed,
      ]}>
      {content}
    </Pressable>
  );
}

function DashboardEmptyState({ message }: { message: string }) {
  const { colors } = useTheme();
  const styles = useThemedStyles(({ colors, spacing, typography }) => ({
    card: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.separator,
      padding: spacing.xl,
      alignItems: 'center',
      gap: spacing.sm,
    },
    iconWrap: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: colors.fillSubtle,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: spacing.xs,
    },
    body: {
      ...typography.subtitle,
      fontSize: 14,
      lineHeight: 20,
      textAlign: 'center',
    },
  }));

  return (
    <View style={styles.card}>
      <View style={styles.iconWrap}>
        <Ionicons name="document-text-outline" size={24} color={colors.labelSecondary} />
      </View>
      <Text style={styles.body}>{message}</Text>
    </View>
  );
}

export function DashboardOverviewPanel({
  selected,
  jobs,
  shifts,
  confirmedFillIns = [],
  jobApplicationSummaries,
  applicantCounts,
  shiftPendingCounts = {},
  shiftApplicationCounts = {},
  clinicId,
  fillInReturnTo = 'dashboard-fill-ins',
  onJobUpdated,
  onJobDeleted,
  onShiftUpdated,
  onShiftDeleted,
  onJobPress,
  onJobApplicationsPress,
}: DashboardOverviewPanelProps) {
  const [expandedShiftId, setExpandedShiftId] = useState<string | null>(null);
  const [expandedConfirmedId, setExpandedConfirmedId] = useState<string | null>(null);
  const styles = useThemedStyles(({ spacing, colors }) => ({
    list: {
      gap: spacing.md,
    },
    subsection: {
      gap: spacing.md,
    },
    subsectionTitle: {
      fontSize: 13,
      fontWeight: '600',
      letterSpacing: 0.3,
      textTransform: 'uppercase',
      color: colors.labelSecondary,
    },
  }));

  const roleJobs = jobs.filter(isMainListJob);
  const liveShifts = shifts.filter(
    (shift) => shift.status === 'live' && isTodayOrUpcomingShiftDate(shift.shift_date),
  );

  return (
    <View>
      <SectionHeader title={OVERVIEW_SECTION_TITLES[selected]} />
      {selected === 'roles' ? (
        roleJobs.length === 0 ? (
          <DashboardEmptyState message="No active role postings yet. Post a role to get started." />
        ) : (
          <View style={styles.list}>
            {roleJobs.map((job) => (
                <RolePostingCard
                  key={job.id}
                  job={job}
                  applicantCount={applicantCounts?.[job.id] ?? 0}
                  onPress={onJobPress ? () => onJobPress(job.id) : undefined}
                  onApplicantsPress={
                    onJobApplicationsPress && (applicantCounts?.[job.id] ?? 0) > 0
                      ? () => onJobApplicationsPress(job.id)
                      : undefined
                  }
                  manage={
                    clinicId && onJobUpdated && onJobDeleted
                      ? {
                          clinicId,
                          onUpdated: onJobUpdated,
                          onDeleted: () => onJobDeleted(job.id),
                        }
                      : undefined
                  }
                />
              ))}
          </View>
        )
      ) : null}

      {selected === 'fill-ins' ? (
        liveShifts.length === 0 && confirmedFillIns.length === 0 ? (
          <DashboardEmptyState message="No live fill-in shifts yet. Post a fill-in to get started." />
        ) : (
          <View style={styles.list}>
                {confirmedFillIns.length > 0 ? (
              <View style={styles.subsection}>
                <Text style={styles.subsectionTitle}>Upcoming confirmed</Text>
                {confirmedFillIns.map((row) => (
                  <ConfirmedFillInCard
                    key={row.applicationId}
                    workerName={row.workerName}
                    workerPhotoStoragePath={row.workerPhotoStoragePath}
                    shiftDate={row.shiftDate}
                    startTime={row.startTime}
                    endTime={row.endTime}
                    applicationId={row.applicationId}
                    returnTo="dashboard-fill-ins"
                    expanded={expandedConfirmedId === row.applicationId}
                    onExpandChange={(next) =>
                      setExpandedConfirmedId(next ? row.applicationId : null)
                    }
                  />
                ))}
              </View>
            ) : null}
            {liveShifts.length > 0 ? (
              <View style={styles.subsection}>
                {confirmedFillIns.length > 0 ? (
                  <Text style={styles.subsectionTitle}>Open fill-ins</Text>
                ) : null}
                {liveShifts.map((shift) => (
                  <FillInPostingCard
                    key={shift.id}
                    shift={shift}
                    pendingRequestCount={shiftPendingCounts[shift.id] ?? 0}
                    applicationCount={shiftApplicationCounts[shift.id] ?? 0}
                    clinicId={clinicId}
                    returnTo={fillInReturnTo}
                    expanded={expandedShiftId === shift.id}
                    onExpandChange={(next) => setExpandedShiftId(next ? shift.id : null)}
                    onShiftUpdated={onShiftUpdated}
                    onShiftDeleted={() => onShiftDeleted?.(shift.id)}
                  />
                ))}
              </View>
            ) : null}
          </View>
        )
      ) : null}

      {selected === 'applications' ? (
        jobApplicationSummaries.length === 0 ? (
          <DashboardEmptyState message="No applications yet. They will appear when workers apply to your postings." />
        ) : (
          <View style={styles.list}>
            {jobApplicationSummaries.map((summary) => {
              const hasNewApplicants = summary.pending_count > 0;
              return (
                <DashboardListCard
                  key={summary.job_post_id}
                  title={summary.post_title}
                  subtitle={
                    hasNewApplicants
                      ? summary.pending_count === 1
                        ? '1 new applicant'
                        : `${summary.pending_count} new applicants`
                      : summary.applicant_count === 1
                        ? '1 applicant'
                        : `${summary.applicant_count} applicants`
                  }
                  meta={formatJobApplicationSummaryMeta(summary)}
                  highlighted={hasNewApplicants}
                  onPress={
                    onJobApplicationsPress
                      ? () => onJobApplicationsPress(summary.job_post_id)
                      : undefined
                  }
                />
              );
            })}
          </View>
        )
      ) : null}
    </View>
  );
}
