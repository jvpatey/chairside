import type { JobApplicationSummary, JobPost, ShiftPost } from '@chairside/api';
import { getProvinceLabel } from '@chairside/config';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import type { ReactNode } from 'react';
import { Pressable, Text, View } from 'react-native';

import { FillInPostingCard } from '@/components/clinic/FillInPostingCard';
import { RolePostingCard } from '@/components/clinic/RolePostingCard';
import { ChairsideWordmark } from '@/components/brand/ChairsideWordmark';

import { OnboardingButton } from '@/components/onboarding/OnboardingButton';
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
  newApplications: number;
  selected: OverviewStat;
  onSelect: (stat: OverviewStat) => void;
};

export function StatGrid({
  openRoles,
  fillInsPosted,
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
      value: newApplications,
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
  jobApplicationSummaries: JobApplicationSummary[];
  applicantCounts?: Record<string, number>;
  onJobPress?: (jobId: string) => void;
  onShiftPress?: (shiftId: string) => void;
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
  const styles = useThemedStyles(({ colors, spacing, typography }) => ({
    card: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.separator,
      padding: spacing.md,
      gap: spacing.xs,
    },
    cardPressed: {
      opacity: 0.9,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      gap: spacing.sm,
    },
    headerMain: {
      flex: 1,
      gap: spacing.xs,
    },
    title: {
      ...typography.body,
      fontWeight: '600',
    },
    subtitle: typography.subtitle,
    meta: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.primary,
    },
  }));

  const content = (
    <>
      <View style={styles.header}>
        <View style={styles.headerMain}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>{subtitle}</Text>
        </View>
        {statusBadge}
      </View>
      {meta ? <Text style={styles.meta}>{meta}</Text> : null}
    </>
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
  jobApplicationSummaries,
  applicantCounts,
  onJobPress,
  onShiftPress,
  onJobApplicationsPress,
}: DashboardOverviewPanelProps) {
  const styles = useThemedStyles(({ spacing }) => ({
    list: {
      gap: spacing.sm,
    },
  }));

  const roleJobs = jobs.filter((job) => job.status === 'live' || job.status === 'paused');
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
                />
              ))}
          </View>
        )
      ) : null}

      {selected === 'fill-ins' ? (
        liveShifts.length === 0 ? (
          <DashboardEmptyState message="No live fill-in shifts yet. Post a fill-in to get started." />
        ) : (
          <View style={styles.list}>
            {liveShifts.map((shift) => (
              <FillInPostingCard
                key={shift.id}
                shift={shift}
                onPress={onShiftPress ? () => onShiftPress(shift.id) : undefined}
              />
            ))}
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
                meta={
                  summary.pending_count > 0
                    ? summary.pending_count === 1
                      ? '1 new application'
                      : `${summary.pending_count} new applications`
                    : undefined
                }
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
