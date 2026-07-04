import type { LiveJobPost, LiveShiftPost, WorkerApplication, WorkerProfile } from '@chairside/api';
import { getWorkerRoleTypes } from '@chairside/api';
import { formatRoleTypesLabel } from '@chairside/config';
import { Ionicons } from '@expo/vector-icons';
import { useMemo } from 'react';
import { Text, View } from 'react-native';

import { partitionWorkerShiftApplications } from '@/lib/fillInFilters';
import { FillInListingCard } from '@/components/worker/FillInListingCard';
import { RoleListingCard } from '@/components/worker/RoleListingCard';
import { WorkerApplicationListCard } from '@/components/worker/WorkerApplicationListCard';
import { DashboardHeroCard } from '@/components/dashboard/DashboardHeroCard';
import { DashboardHeroActions } from '@/components/dashboard/DashboardHeroActions';
import { DashboardHeroName, DashboardHeroSubtitle } from '@/components/dashboard/DashboardHeroIdentity';
import {
  DashboardStatGrid,
  DASHBOARD_OVERVIEW_SEGMENT_ACCENTS,
  getDashboardOverviewAccent,
  type DashboardOverviewStat,
} from '@/components/dashboard/DashboardStatGrid';
import { DashboardEmptyState } from '@/components/dashboard/DashboardEmptyState';
import { FadeInSection } from '@/components/dashboard/FadeInSection';
import { dashboardSectionGap } from '@/components/dashboard/dashboardLayout';
import { DashboardSectionHeader } from '@/components/dashboard/DashboardSectionHeader';
import { useProfilePhoto } from '@/hooks/useProfilePhoto';
import { WORKER_PROFILE } from '@/lib/routing';
import { OnboardingButton } from '@/components/onboarding/OnboardingButton';
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
  workerProfile?: WorkerProfile | null;
  showActions?: boolean;
};

export function WorkerDashboardHero({
  displayName,
  workerProfile,
  showActions = true,
}: WorkerDashboardHeroProps) {
  const { photoUri } = useProfilePhoto();
  const subtitle =
    (workerProfile && formatRoleTypesLabel(getWorkerRoleTypes(workerProfile))) ||
    'Dental professional';

  return (
    <DashboardHeroCard
      profileHref={WORKER_PROFILE}
      avatarKind="worker"
      displayName={displayName}
      photoUri={photoUri}
      namePlaceholder="Your profile"
      subtitle={subtitle}
      showActions={showActions}
    />
  );
}

type WorkerDashboardHeaderActionsProps = {
  displayName?: string | null;
};

export function WorkerDashboardHeaderActions({ displayName }: WorkerDashboardHeaderActionsProps) {
  const { photoUri } = useProfilePhoto();

  return (
    <DashboardHeroActions
      profileHref={WORKER_PROFILE}
      avatarKind="worker"
      displayName={displayName}
      photoUri={photoUri}
    />
  );
}

type WorkerDashboardHeaderIdentityProps = {
  displayName?: string | null;
  workerProfile?: WorkerProfile | null;
};

function getWorkerDashboardSubtitle(workerProfile?: WorkerProfile | null) {
  return (
    (workerProfile && formatRoleTypesLabel(getWorkerRoleTypes(workerProfile))) ||
    'Dental professional'
  );
}

export function WorkerDashboardHeaderName({
  displayName,
}: Pick<WorkerDashboardHeaderIdentityProps, 'displayName'>) {
  return <DashboardHeroName displayName={displayName} namePlaceholder="Your profile" />;
}

export function WorkerDashboardHeaderSubtitle({
  workerProfile,
}: Pick<WorkerDashboardHeaderIdentityProps, 'workerProfile'>) {
  return <DashboardHeroSubtitle subtitle={getWorkerDashboardSubtitle(workerProfile)} />;
}

export function WorkerDashboardHeaderIdentity({
  displayName,
  workerProfile,
}: WorkerDashboardHeaderIdentityProps) {
  return (
    <>
      <WorkerDashboardHeaderName displayName={displayName} />
      <WorkerDashboardHeaderSubtitle workerProfile={workerProfile} />
    </>
  );
}

export { DashboardHeroGreeting as WorkerDashboardGreeting } from '@/components/dashboard/DashboardHeroIdentity';

/** @deprecated Use `DashboardSectionHeader` from `@/components/dashboard/DashboardSectionHeader`. */
export { DashboardSectionHeader as WorkerSectionHeader } from '@/components/dashboard/DashboardSectionHeader';

/** @deprecated Use `DashboardQuickActionTile` from `@/components/dashboard/DashboardQuickActionTile`. */
export { DashboardQuickActionTile as QuickActionTile } from '@/components/dashboard/DashboardQuickActionTile';

export type WorkerOverviewStat = DashboardOverviewStat;

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
  return (
    <DashboardStatGrid
      selected={selected}
      onSelect={onSelect}
      accent={getDashboardOverviewAccent(selected)}
      segmentAccents={DASHBOARD_OVERVIEW_SEGMENT_ACCENTS}
      stats={[
        { key: 'roles', label: 'Open roles', value: openRoles, badgeCount: 0 },
        { key: 'fill-ins', label: 'Fill-ins', value: openFillIns, badgeCount: fillInUpdateCount },
        {
          key: 'applications',
          label: 'Applications',
          value: pendingApplications,
          badgeCount: applicationUpdateCount,
        },
      ]}
    />
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
  savedJobIds?: Set<string>;
  savedShiftIds?: Set<string>;
  unreadMap?: Record<string, boolean>;
  onJobPress?: (jobId: string) => void;
  onShiftPress?: (shiftId: string) => void;
  onToggleSavedJob?: (jobId: string, nextSaved: boolean) => void;
  onToggleSavedShift?: (shiftId: string, nextSaved: boolean) => void;
  onApplicationUpdated?: () => void;
  onViewAllPress?: () => void;
};

export function WorkerOverviewPanel({
  selected,
  jobs,
  shifts,
  jobApplications,
  shiftApplications,
  savedJobIds,
  savedShiftIds,
  unreadMap,
  onJobPress,
  onShiftPress,
  onToggleSavedJob,
  onToggleSavedShift,
  onApplicationUpdated,
  onViewAllPress,
}: WorkerOverviewPanelProps) {
  const styles = useThemedStyles(({ spacing }) => {
    const cardGap = dashboardSectionGap(spacing);
    return {
      root: {
        width: '100%',
        alignSelf: 'stretch' as const,
      },
      list: { gap: cardGap, width: '100%', alignSelf: 'stretch' as const },
      group: { gap: cardGap, width: '100%', alignSelf: 'stretch' as const },
    };
  });

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
    <View style={styles.root}>
      <DashboardSectionHeader
        title={OVERVIEW_TITLES[selected]}
        actionLabel={onViewAllPress ? 'View all' : undefined}
        onActionPress={onViewAllPress}
      />
      <FadeInSection key={selected} delayMs={0}>
        {selected === 'roles' ? (
        jobs.length === 0 ? (
          <DashboardEmptyState
            icon="briefcase-outline"
            title="No open roles yet"
            message="New roles in your province will appear here when clinics post them."
          />
        ) : (
          <View style={styles.list}>
            {jobs.slice(0, 5).map((job) => (
              <RoleListingCard
                key={job.id}
                job={job}
                isSaved={savedJobIds?.has(job.id) ?? false}
                onToggleSaved={
                  onToggleSavedJob
                    ? () =>
                        onToggleSavedJob(job.id, !(savedJobIds?.has(job.id) ?? false))
                    : undefined
                }
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
          <DashboardEmptyState
            icon="calendar-outline"
            title="No fill-in shifts yet"
            message="Temporary and urgent shifts in your province will show up here."
            accent="secondary"
          />
        ) : (
          <View style={styles.list}>
            {shifts.length > 0 ? (
              <View style={styles.group}>
                <DashboardSectionHeader title="Open" compact />
                {shifts.slice(0, 5).map((shift) => (
                  <FillInListingCard
                    key={shift.id}
                    shift={shift}
                    accent="secondary"
                    isSaved={savedShiftIds?.has(shift.id) ?? false}
                    onToggleSaved={
                      onToggleSavedShift
                        ? () =>
                            onToggleSavedShift(shift.id, !(savedShiftIds?.has(shift.id) ?? false))
                        : undefined
                    }
                    onPress={onShiftPress ? () => onShiftPress(shift.id) : undefined}
                  />
                ))}
              </View>
            ) : null}
            {confirmedShiftApplications.length > 0 ? (
              <View style={styles.group}>
                <DashboardSectionHeader title="Upcoming confirmed" compact />
                {confirmedShiftApplications.map((application) => (
                  <WorkerApplicationListCard
                    key={application.id}
                    application={application}
                    hasUnreadMessages={Boolean(unreadMap?.[application.id])}
                    returnTo="dashboard-fill-ins"
                  />
                ))}
              </View>
            ) : null}
            {activeShiftApplications.length > 0 ? (
              <View style={styles.group}>
                <DashboardSectionHeader title="In progress" compact />
                {activeShiftApplications.map((application) => (
                  <WorkerApplicationListCard
                    key={application.id}
                    application={application}
                    hasUnreadMessages={Boolean(unreadMap?.[application.id])}
                    returnTo="dashboard-fill-ins"
                  />
                ))}
              </View>
            ) : null}
          </View>
        )
      ) : null}

      {selected === 'applications' ? (
        jobApplications.length === 0 ? (
          <DashboardEmptyState
            icon="document-text-outline"
            title="No applications yet"
            message="When you apply to roles, your application status will appear here."
          />
        ) : (
          <View style={styles.list}>
            {previewJobApplications.map((application) => (
              <WorkerApplicationListCard
                key={application.id}
                application={application}
                hasUnreadMessages={Boolean(unreadMap?.[application.id])}
                returnTo="dashboard-applications"
              />
            ))}
          </View>
        )
        ) : null}
      </FadeInSection>
    </View>
  );
}
