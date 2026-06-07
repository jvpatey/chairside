import type { LiveJobPost, LiveShiftPost, WorkerApplication } from '@chairside/api';
import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { Platform, Pressable, Text, View, type ViewStyle } from 'react-native';

import { partitionWorkerShiftApplications } from '@/lib/fillInFilters';
import { FillInListingCard } from '@/components/worker/FillInListingCard';
import { RoleListingCard } from '@/components/worker/RoleListingCard';
import { WorkerApplicationListCard } from '@/components/worker/WorkerApplicationListCard';
import { DashboardHeroCard } from '@/components/dashboard/DashboardHeroCard';
import { NotificationCountBadge } from '@/components/ui/NotificationCountBadge';
import { useProfilePhoto } from '@/hooks/useProfilePhoto';
import { WORKER_PROFILE } from '@/lib/routing';
import { OnboardingButton } from '@/components/onboarding/OnboardingButton';
import { webOnlyStyle, webPointer, webTileHoverStyles } from '@/lib/webPressableStyles';
import { useTheme, useThemedStyles } from '@/theme';

type WorkerSetupBannerProps = {
  onPress: () => void;
};

export function WorkerSetupBanner({ onPress }: WorkerSetupBannerProps) {
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
    textBlock: { flex: 1, gap: spacing.xs },
    title: { ...typography.body, fontWeight: '600' },
    body: { ...typography.subtitle, fontSize: 14, lineHeight: 20 },
  }));

  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <View style={styles.iconWrap}>
          <Ionicons name="person" size={20} color={colors.primaryOnPrimary} />
        </View>
        <View style={styles.textBlock}>
          <Text style={styles.title}>Complete your profile</Text>
          <Text style={styles.body}>
            Add your credentials to apply for roles and receive fill-in alerts.
          </Text>
        </View>
      </View>
      <OnboardingButton label="Continue setup" onPress={onPress} />
    </View>
  );
}

type WorkerDashboardHeroProps = {
  displayName?: string | null;
  province?: string;
  showProvinceBadge?: boolean;
};

export function WorkerDashboardHero({
  displayName,
  province = 'NS',
  showProvinceBadge = false,
}: WorkerDashboardHeroProps) {
  const { photoUri } = useProfilePhoto();

  return (
    <DashboardHeroCard
      profileHref={WORKER_PROFILE}
      avatarKind="worker"
      displayName={displayName}
      photoUri={photoUri}
      namePlaceholder="Your profile"
      province={province}
      showProvinceBadge={showProvinceBadge}
    />
  );
}

export function WorkerSectionHeader({ title }: { title: string }) {
  const styles = useThemedStyles(({ spacing, typography }) => ({
    header: { marginBottom: spacing.sm },
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

export { QuickActionTile } from '@/components/clinic/ClinicCards';

export type WorkerOverviewStat = 'roles' | 'fill-ins' | 'applications';

type WorkerStatGridProps = {
  openRoles: number;
  openFillIns: number;
  pendingApplications: number;
  applicationUpdateCount?: number;
  fillInUpdateCount?: number;
  selected: WorkerOverviewStat;
  onSelect: (stat: WorkerOverviewStat) => void;
};

export function WorkerStatGrid({
  openRoles,
  openFillIns,
  pendingApplications,
  applicationUpdateCount = 0,
  fillInUpdateCount = 0,
  selected,
  onSelect,
}: WorkerStatGridProps) {
  const stats: {
    key: WorkerOverviewStat;
    label: string;
    value: number;
    badgeCount: number;
  }[] = [
    { key: 'roles', label: 'Open roles', value: openRoles, badgeCount: 0 },
    { key: 'fill-ins', label: 'Fill-ins', value: openFillIns, badgeCount: fillInUpdateCount },
    {
      key: 'applications',
      label: 'Applications',
      value: pendingApplications,
      badgeCount: applicationUpdateCount,
    },
  ];

  const styles = useThemedStyles(({ colors, spacing, typography, isDark }) => ({
    grid: { flexDirection: 'row', gap: spacing.sm },
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
      ...webPointer(),
    },
    cellSelected: {
      borderColor: colors.primary,
      backgroundColor: colors.surface,
    },
    cellHovered: webTileHoverStyles(colors, isDark),
    cellSelectedHovered: webOnlyStyle({
      borderColor: colors.primary,
      boxShadow: isDark
        ? '0 4px 12px rgba(74, 154, 255, 0.16)'
        : '0 4px 12px rgba(26, 111, 212, 0.12)',
    } as ViewStyle),
    value: {
      ...typography.title,
      fontSize: 20,
      lineHeight: 24,
      color: colors.labelPrimary,
    },
    valueSelected: { color: colors.primary },
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

const OVERVIEW_TITLES: Record<WorkerOverviewStat, string> = {
  roles: 'Open roles near you',
  'fill-ins': 'Fill-in shifts',
  applications: 'Your applications',
};

type WorkerOverviewPanelProps = {
  selected: WorkerOverviewStat;
  jobs: LiveJobPost[];
  shifts: LiveShiftPost[];
  jobApplications: WorkerApplication[];
  shiftApplications: WorkerApplication[];
  appliedJobIds?: Set<string>;
  unreadMap?: Record<string, boolean>;
  onJobPress?: (jobId: string) => void;
  onShiftPress?: (shiftId: string) => void;
  onApplicationUpdated?: () => void;
};

export function WorkerOverviewPanel({
  selected,
  jobs,
  shifts,
  jobApplications,
  shiftApplications,
  appliedJobIds,
  unreadMap,
  onJobPress,
  onShiftPress,
  onApplicationUpdated,
}: WorkerOverviewPanelProps) {
  const [expandedApplicationId, setExpandedApplicationId] = useState<string | null>(null);
  const styles = useThemedStyles(({ colors, spacing, typography }) => ({
    list: { gap: spacing.sm },
    group: { gap: spacing.sm },
    empty: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.separator,
      padding: spacing.xl,
      alignItems: 'center',
    },
    emptyText: { ...typography.subtitle, fontSize: 14, textAlign: 'center' },
  }));

  const previewJobApplications = useMemo(() => {
    return [...jobApplications]
      .sort((a, b) => {
        const aUnread = unreadMap?.[a.id] ? 1 : 0;
        const bUnread = unreadMap?.[b.id] ? 1 : 0;
        if (aUnread !== bUnread) return bUnread - aUnread;
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      })
      .slice(0, 5);
  }, [jobApplications, unreadMap]);

  const { upcomingConfirmed, upcomingInProgress } = useMemo(
    () => partitionWorkerShiftApplications(shiftApplications),
    [shiftApplications],
  );

  const confirmedShiftApplications = useMemo(
    () => upcomingConfirmed.slice(0, 5),
    [upcomingConfirmed],
  );

  const activeShiftApplications = useMemo(
    () => upcomingInProgress.slice(0, 5),
    [upcomingInProgress],
  );

  return (
    <View>
      <WorkerSectionHeader title={OVERVIEW_TITLES[selected]} />
      {selected === 'roles' ? (
        jobs.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No open roles in your province yet.</Text>
          </View>
        ) : (
          <View style={styles.list}>
            {jobs.slice(0, 5).map((job) => (
              <RoleListingCard
                key={job.id}
                job={job}
                hasApplied={appliedJobIds?.has(job.id)}
                onPress={onJobPress ? () => onJobPress(job.id) : undefined}
              />
            ))}
          </View>
        )
      ) : null}

      {selected === 'fill-ins' ? (
        shifts.length === 0 &&
        confirmedShiftApplications.length === 0 &&
        activeShiftApplications.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No fill-in shifts in your province yet.</Text>
          </View>
        ) : (
          <View style={styles.list}>
            {shifts.length > 0 ? (
              <View style={styles.group}>
                <WorkerSectionHeader title="Open" />
                {shifts.slice(0, 5).map((shift) => (
                  <FillInListingCard
                    key={shift.id}
                    shift={shift}
                    onPress={onShiftPress ? () => onShiftPress(shift.id) : undefined}
                  />
                ))}
              </View>
            ) : null}
            {confirmedShiftApplications.length > 0 ? (
              <View style={styles.group}>
                <WorkerSectionHeader title="Upcoming confirmed" />
                {confirmedShiftApplications.map((application) => (
                  <WorkerApplicationListCard
                    key={application.id}
                    application={application}
                    hasUnreadMessages={Boolean(unreadMap?.[application.id])}
                    returnTo="dashboard-fill-ins"
                    expanded={expandedApplicationId === application.id}
                    onExpandChange={(next) =>
                      setExpandedApplicationId(next ? application.id : null)
                    }
                    onUpdated={onApplicationUpdated}
                    onHidden={onApplicationUpdated}
                  />
                ))}
              </View>
            ) : null}
            {activeShiftApplications.length > 0 ? (
              <View style={styles.group}>
                <WorkerSectionHeader title="In progress" />
                {activeShiftApplications.map((application) => (
                  <WorkerApplicationListCard
                    key={application.id}
                    application={application}
                    hasUnreadMessages={Boolean(unreadMap?.[application.id])}
                    returnTo="dashboard-fill-ins"
                    expanded={expandedApplicationId === application.id}
                    onExpandChange={(next) =>
                      setExpandedApplicationId(next ? application.id : null)
                    }
                    onUpdated={onApplicationUpdated}
                    onHidden={onApplicationUpdated}
                  />
                ))}
              </View>
            ) : null}
          </View>
        )
      ) : null}

      {selected === 'applications' ? (
        jobApplications.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>You have not applied to any roles yet.</Text>
          </View>
        ) : (
          <View style={styles.list}>
            {previewJobApplications.map((application) => (
              <WorkerApplicationListCard
                key={application.id}
                application={application}
                hasUnreadMessages={Boolean(unreadMap?.[application.id])}
                returnTo="dashboard-applications"
                expanded={expandedApplicationId === application.id}
                onExpandChange={(next) => setExpandedApplicationId(next ? application.id : null)}
                onUpdated={onApplicationUpdated}
                onHidden={onApplicationUpdated}
              />
            ))}
          </View>
        )
      ) : null}
    </View>
  );
}
