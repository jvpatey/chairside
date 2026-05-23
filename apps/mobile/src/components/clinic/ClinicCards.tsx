import type { ClinicApplication, JobPost, ShiftPost } from '@chairside/api';
import { formatJobPostCardMeta, formatOfferingLabel, getRoleTypeLabel } from '@chairside/config';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import type { ReactNode } from 'react';
import { Pressable, Text, View } from 'react-native';

import { JobPostStatusBadge } from '@/components/clinic/JobPostStatusBadge';

import { OnboardingButton } from '@/components/onboarding/OnboardingButton';
import { getTimeOfDayGreeting } from '@/lib/greeting';
import { useTheme, useThemedStyles } from '@/theme';

type SetupBannerProps = {
  onPress: () => void;
};

export function SetupBanner({ onPress }: SetupBannerProps) {
  const { colors } = useTheme();
  const styles = useThemedStyles(({ colors, spacing, typography }) => ({
    card: {
      backgroundColor: colors.primarySubtle,
      borderRadius: 16,
      padding: spacing.lg,
      gap: spacing.md,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
    },
    iconWrap: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    textBlock: {
      flex: 1,
      gap: spacing.xs,
    },
    title: {
      ...typography.body,
      fontWeight: '600',
      color: colors.labelPrimary,
    },
    body: {
      ...typography.subtitle,
      fontSize: 14,
      lineHeight: 20,
    },
  }));

  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <View style={styles.iconWrap}>
          <Ionicons name="business" size={20} color={colors.primaryOnPrimary} />
        </View>
        <View style={styles.textBlock}>
          <Text style={styles.title}>Complete your clinic profile</Text>
          <Text style={styles.body}>
            Add practice details to unlock posting roles and fill-in shifts.
          </Text>
        </View>
      </View>
      <OnboardingButton label="Continue setup" onPress={onPress} />
    </View>
  );
}

type DashboardHeroProps = {
  clinicName?: string | null;
};

const CLINIC_NAME_PLACEHOLDER = 'Your practice';

export function DashboardHero({ clinicName }: DashboardHeroProps) {
  const greeting = getTimeOfDayGreeting();
  const displayName = clinicName?.trim();

  const styles = useThemedStyles(({ colors, spacing, typography }) => ({
    card: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.separator,
      padding: spacing.lg,
      gap: spacing.xs,
    },
    greeting: {
      ...typography.subtitle,
      fontSize: 15,
    },
    name: {
      ...typography.title,
      fontSize: 26,
      lineHeight: 32,
      minHeight: 32,
    },
    nameHidden: {
      opacity: 0,
    },
  }));

  return (
    <View style={styles.card}>
      <Text style={styles.greeting}>{greeting}</Text>
      <Text
        style={[styles.name, !displayName && styles.nameHidden]}
        numberOfLines={1}
        accessibilityElementsHidden={!displayName}
        importantForAccessibility={displayName ? 'yes' : 'no-hide-descendants'}>
        {displayName || CLINIC_NAME_PLACEHOLDER}
      </Text>
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
  applications: ClinicApplication[];
  onJobPress?: (jobId: string) => void;
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
  applications,
  onJobPress,
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
                <DashboardListCard
                  key={job.id}
                  title={job.title}
                  subtitle={formatJobPostCardMeta(job)}
                  meta={job.wage_range ?? undefined}
                  statusBadge={<JobPostStatusBadge status={job.status} />}
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
            {liveShifts.map((shift) => {
              const roleLabel = getRoleTypeLabel(shift.role_type);

              return (
                <DashboardListCard
                  key={shift.id}
                  title={`${roleLabel} · ${shift.shift_date}`}
                  subtitle={`${shift.start_time} – ${shift.end_time}`}
                  meta={shift.compensation ?? undefined}
                />
              );
            })}
          </View>
        )
      ) : null}

      {selected === 'applications' ? (
        applications.length === 0 ? (
          <DashboardEmptyState message="No applications yet. They will appear when workers apply to your postings." />
        ) : (
          <View style={styles.list}>
            {applications.map((application) => (
              <DashboardListCard
                key={application.id}
                title={application.post_title}
                subtitle={`${application.post_type === 'job' ? 'Role' : 'Fill-in'} · ${application.status}`}
                meta={
                  application.match_score != null
                    ? `Match score: ${application.match_score}%`
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
