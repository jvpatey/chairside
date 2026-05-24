import {
  getWorkerDashboardCounts,
  listLiveJobPosts,
  listLiveShiftPosts,
  listWorkerApplications,
  type LiveJobPost,
  type LiveShiftPost,
  type WorkerApplication,
  type WorkerDashboardCounts,
} from '@chairside/api';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { View } from 'react-native';

import {
  QuickActionTile,
  WorkerDashboardHero,
  WorkerOverviewPanel,
  WorkerSectionHeader,
  WorkerSetupBanner,
  WorkerStatGrid,
  type WorkerOverviewStat,
} from '@/components/worker/WorkerCards';
import { Screen } from '@/components/ui/Screen';
import { useAuth } from '@/contexts/AuthContext';
import { useWorkerProfile } from '@/contexts/WorkerProfileContext';
import { useRefreshOnFocus } from '@/hooks/useRefreshOnFocus';
import {
  WORKER_BROWSE,
  WORKER_SETUP_AVAILABILITY,
  WORKER_SETUP_BASICS,
  getWorkerJobDetailRoute,
  getWorkerShiftDetailRoute,
} from '@/lib/routing';
import { useThemedStyles } from '@/theme';

export default function WorkerDashboardScreen() {
  const { user, profile } = useAuth();
  const { workerProfile, isProfileComplete } = useWorkerProfile();
  const { overview } = useLocalSearchParams<{ overview?: string }>();
  const province = workerProfile?.province ?? 'NS';
  const [counts, setCounts] = useState<WorkerDashboardCounts>({
    openRolesInProvince: 0,
    openFillInsInProvince: 0,
    pendingApplications: 0,
  });
  const [selectedOverview, setSelectedOverview] = useState<WorkerOverviewStat>('roles');
  const [jobs, setJobs] = useState<LiveJobPost[]>([]);
  const [shifts, setShifts] = useState<LiveShiftPost[]>([]);
  const [applications, setApplications] = useState<WorkerApplication[]>([]);

  const styles = useThemedStyles(({ spacing }) => ({
    content: { gap: spacing.xl },
    row: { flexDirection: 'row', gap: spacing.sm },
  }));

  const loadDashboard = useCallback(async () => {
    if (!user?.id) return;

    try {
      const [nextCounts, jobPosts, shiftPosts, applicationRows] = await Promise.all([
        getWorkerDashboardCounts(user.id, province),
        listLiveJobPosts(province),
        listLiveShiftPosts(province),
        listWorkerApplications(user.id),
      ]);

      setCounts(nextCounts);
      setJobs(jobPosts);
      setShifts(shiftPosts);
      setApplications(applicationRows);
    } catch {
      setCounts({ openRolesInProvince: 0, openFillInsInProvince: 0, pendingApplications: 0 });
      setJobs([]);
      setShifts([]);
      setApplications([]);
    }
  }, [user?.id, province]);

  useRefreshOnFocus(loadDashboard);

  useEffect(() => {
    if (overview === 'roles' || overview === 'fill-ins' || overview === 'applications') {
      setSelectedOverview(overview);
    }
  }, [overview]);

  return (
    <Screen showHeader={false}>
      <View style={styles.content}>
        <WorkerDashboardHero displayName={profile?.display_name} province={province} />

        {!isProfileComplete ? (
          <WorkerSetupBanner onPress={() => router.push(WORKER_SETUP_BASICS)} />
        ) : null}

        <View>
          <WorkerSectionHeader title="Quick actions" />
          <View style={styles.row}>
            <QuickActionTile
              label="Browse roles"
              description="Open roles in your province"
              icon="search-outline"
              onPress={() => router.push(WORKER_BROWSE)}
            />
            <QuickActionTile
              label="Availability"
              description="Schedule & fill-in alerts"
              icon="calendar-outline"
              variant="secondary"
              onPress={() => router.push(WORKER_SETUP_AVAILABILITY)}
            />
          </View>
        </View>

        <View>
          <WorkerSectionHeader title="Overview" />
          <WorkerStatGrid
            openRoles={counts.openRolesInProvince}
            openFillIns={counts.openFillInsInProvince}
            pendingApplications={counts.pendingApplications}
            selected={selectedOverview}
            onSelect={setSelectedOverview}
          />
        </View>

        <WorkerOverviewPanel
          selected={selectedOverview}
          jobs={jobs}
          shifts={shifts}
          applications={applications}
          onJobPress={(jobId) => router.push(getWorkerJobDetailRoute(jobId))}
          onShiftPress={(shiftId) => router.push(getWorkerShiftDetailRoute(shiftId))}
        />
      </View>
    </Screen>
  );
}
