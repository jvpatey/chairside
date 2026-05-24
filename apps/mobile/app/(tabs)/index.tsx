import {
  getWorkerDashboardCounts,
  isWorkerProfileComplete,
  listLiveJobPosts,
  listLiveShiftPosts,
  listWorkerApplications,
  type LiveJobPost,
  type LiveShiftPost,
  type WorkerApplication,
  type WorkerDashboardCounts,
} from '@chairside/api';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { View } from 'react-native';

import {
  QuickActionTile,
  WorkerDashboardHero,
  WorkerOverviewPanel,
  WorkerSectionHeader,
  WorkerStatGrid,
  type WorkerOverviewStat,
} from '@/components/worker/WorkerCards';
import { WorkerReadinessChecklist } from '@/components/worker/WorkerReadinessChecklist';
import { Screen } from '@/components/ui/Screen';
import { useAuth } from '@/contexts/AuthContext';
import { useWorkerProfile } from '@/contexts/WorkerProfileContext';
import { useRefreshOnFocus } from '@/hooks/useRefreshOnFocus';
import {
  WORKER_BROWSE,
  WORKER_FILLINS,
  getWorkerJobDetailRoute,
  getWorkerShiftDetailRoute,
} from '@/lib/routing';
import { useThemedStyles } from '@/theme';

export default function WorkerDashboardScreen() {
  const { user, profile } = useAuth();
  const { workerProfile } = useWorkerProfile();
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

  const appliedJobIds = useMemo(
    () =>
      new Set(
        applications
          .filter((application) => application.post_type === 'job' && application.job_post_id)
          .map((application) => application.job_post_id as string),
      ),
    [applications],
  );

  return (
    <Screen showHeader={false}>
      <View style={styles.content}>
        <WorkerDashboardHero
          displayName={profile?.display_name}
          province={province}
          showProvinceBadge={isWorkerProfileComplete(workerProfile)}
        />

        <WorkerReadinessChecklist workerProfile={workerProfile} />

        <View>
          <WorkerSectionHeader title="Quick actions" />
          <View style={styles.row}>
            <QuickActionTile
              label="Find jobs"
              description="Open roles in your province"
              icon="search-outline"
              onPress={() => router.push(WORKER_BROWSE)}
            />
            <QuickActionTile
              label="Find fill-ins"
              description="Temp shifts in your province"
              icon="calendar-outline"
              variant="secondary"
              onPress={() => router.push(WORKER_FILLINS)}
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
          appliedJobIds={appliedJobIds}
          onJobPress={(jobId) => router.push(getWorkerJobDetailRoute(jobId))}
          onShiftPress={(shiftId) => router.push(getWorkerShiftDetailRoute(shiftId))}
        />
      </View>
    </Screen>
  );
}
