import type { ConfirmedFillInSummary, JobApplicationSummary, JobPost, ShiftPost } from '@chairside/api';
import { getProvinceLabel, formatJobApplicationSummaryMeta } from '@chairside/config';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import type { ReactNode } from 'react';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { FillInPostingCard } from '@/components/clinic/FillInPostingCard';
import { ConfirmedFillInCard } from '@/components/clinic/ConfirmedFillInCard';
import { RolePostingCard } from '@/components/clinic/RolePostingCard';
import { ChairsideWordmark } from '@/components/brand/ChairsideWordmark';
import { ProfileHeaderButton } from '@/components/navigation/ProfileHeaderButton';
import { useClinicProfile } from '@/contexts/ClinicProfileContext';
import { useClinicLogo } from '@/hooks/useClinicLogo';
import { NotificationBell } from '@/components/notifications/NotificationBell';
import { ClinicPostHeader } from '@/components/worker/ClinicPostHeader';
import { CLINIC_PROFILE, type FillInReturnTarget } from '@/lib/routing';

import { isMainListJob } from '@/lib/postingFilters';
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
  const displayName = clinicName?.trim();

  const styles = useThemedStyles(({ colors, spacing, typography }) => ({
    card: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.separator,
      padding: spacing.lg,
      gap: spacing.sm,
    },
    profile: {
      position: 'absolute',
      top: spacing.md,
      left: spacing.md,
      zIndex: 1,
    },
    bell: {
      position: 'absolute',
      top: spacing.md,
      right: spacing.md,
      zIndex: 1,
    },
    wordmarkWrap: {
      alignItems: 'center',
    },
    name: {
      ...typography.title,
      fontSize: 26,
      lineHeight: 32,
      minHeight: 32,
      textAlign: 'center',
    },
    nameHidden: {
      opacity: 0,
    },
    badge: {
      alignSelf: 'center',
      backgroundColor: colors.secondarySubtle,
      borderRadius: 6,
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
    },
    badgeText: { fontSize: 12, fontWeight: '600', color: colors.secondary },
  }));

  return (
    <View style={styles.card}>
      <View style={styles.profile}>
        <ProfileHeaderButton
          href={CLINIC_PROFILE}
          placement="hero"
          avatarKind="clinic"
          displayName={displayName}
          photoUri={logoUri}
        />
      </View>
      <View style={styles.bell}>
        <NotificationBell placement="hero" />
      </View>
      <View style={styles.wordmarkWrap}>
        <ChairsideWordmark variant="small" />
      </View>
      <Text
        style={[styles.name, !displayName && styles.nameHidden]}
        numberOfLines={1}
        accessibilityElementsHidden={!displayName}
        importantForAccessibility={displayName ? 'yes' : 'no-hide-descendants'}
      >
        {displayName || CLINIC_NAME_PLACEHOLDER}
      </Text>
      {showLocationBadge ? (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{getProvinceLabel(province)}</Text>
        </View>
      ) : null}
    </View>
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
  const isPrimary = variant === 'primary';

  const styles = useThemedStyles(({ colors, spacing, typography }) => ({
    tile: {
      flex: 1,
      borderRadius: 16,
      padding: spacing.md,
      gap: spacing.sm,
      minHeight: 112,
      borderWidth: 1,
      borderColor: isPrimary ? colors.primary : colors.separator,
      backgroundColor: isPrimary ? colors.primary : colors.surface,
    },
    iconWrap: {
      width: 36,
      height: 36,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: isPrimary ? 'rgba(255,255,255,0.2)' : colors.fillSubtle,
    },
    label: {
      ...typography.body,
      fontWeight: '600',
      fontSize: 15,
      color: isPrimary ? colors.primaryOnPrimary : colors.labelPrimary,
    },
    description: {
      fontSize: 12,
      lineHeight: 16,
      color: isPrimary ? 'rgba(255,255,255,0.85)' : colors.labelSecondary,
    },
  }));

  const handlePress = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={handlePress}
      style={({ pressed }) => [styles.tile, pressed && { opacity: 0.9 }]}>
      <View style={styles.iconWrap}>
        <Ionicons
          name={icon}
          size={20}
          color={isPrimary ? colors.primaryOnPrimary : colors.primary}
        />
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
  newApplications: number;
  selected: OverviewStat;
  onSelect: (stat: OverviewStat) => void;
};

export function StatGrid({
  openRoles,
  fillInsPosted,
  totalApplications,
  newApplications,
  selected,
  onSelect,
}: StatGridProps) {
  const stats: { key: OverviewStat; label: string; value: number; highlight?: boolean }[] = [
    { key: 'roles', label: 'Open roles', value: openRoles },
    { key: 'fill-ins', label: 'Fill-ins', value: fillInsPosted },
    {
      key: 'applications',
      label: 'Applications',
      value: totalApplications,
      highlight: newApplications > 0,
    },
  ];

  const styles = useThemedStyles(({ colors, spacing, typography }) => ({
    grid: {
      flexDirection: 'row',
      gap: spacing.sm,
    },
    cell: {
      flex: 1,
      backgroundColor: colors.surface,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.separator,
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.sm,
      alignItems: 'center',
      gap: spacing.xs,
    },
    cellSelected: {
      borderColor: colors.primary,
      backgroundColor: colors.primarySubtle,
    },
    value: {
      ...typography.title,
      fontSize: 24,
      lineHeight: 28,
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

  return (
    <View style={styles.grid}>
      {stats.map((stat) => {
        const isSelected = selected === stat.key;
        return (
          <Pressable
            key={stat.key}
            accessibilityRole="button"
            accessibilityState={{ selected: isSelected }}
            accessibilityLabel={`${stat.label}: ${stat.value}`}
            onPress={() => onSelect(stat.key)}
            style={({ pressed }) => [
              styles.cell,
              isSelected && styles.cellSelected,
              pressed && { opacity: 0.85 },
            ]}>
            <Text style={[styles.value, isSelected && styles.valueSelected]}>{stat.value}</Text>
            <Text style={styles.label}>{stat.label}</Text>
          </Pressable>
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
  onPress,
}: {
  title: string;
  subtitle: string;
  meta?: string;
  statusBadge?: ReactNode;
  onPress?: () => void;
}) {
  const { clinicProfile } = useClinicProfile();
  const clinicName = clinicProfile?.clinic_name?.trim() || 'Your clinic';
  const location = [clinicProfile?.city, clinicProfile?.province].filter(Boolean).join(', ');

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
    statPill: {
      alignSelf: 'flex-start',
      backgroundColor: colors.primarySubtle,
      borderRadius: 999,
      paddingHorizontal: spacing.sm,
      paddingVertical: 4,
    },
    statText: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.primary,
    },
    meta: {
      fontSize: 14,
      lineHeight: 20,
      color: colors.labelSecondary,
    },
  }));

  const content = (
    <ClinicPostHeader
      clinicName={clinicName}
      logoStoragePath={clinicProfile?.logo_storage_path}
      title={title}
      location={location || null}
      detail={meta ?? null}
      avatarSize={44}
      accessory={statusBadge}
      textFooter={
        subtitle ? (
          <View style={styles.statPill}>
            <Text style={styles.statText}>{subtitle}</Text>
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
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}>
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
  const liveShifts = shifts.filter((shift) => shift.status === 'live');

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
                    postTitle={row.postTitle}
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
            {jobApplicationSummaries.map((summary) => (
              <DashboardListCard
                key={summary.job_post_id}
                title={summary.post_title}
                subtitle={
                  summary.applicant_count === 1
                    ? '1 applicant'
                    : `${summary.applicant_count} applicants`
                }
                meta={formatJobApplicationSummaryMeta(summary)}
                onPress={
                  onJobApplicationsPress
                    ? () => onJobApplicationsPress(summary.job_post_id)
                    : undefined
                }
              />
            ))}
          </View>
        )
      ) : null}
    </View>
  );
}
