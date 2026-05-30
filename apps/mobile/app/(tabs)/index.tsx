import {
  getWorkerDashboardCounts,
  isWorkerProfileComplete,
  listConversationsForWorker,
  listLiveJobPosts,
  listLiveShiftPosts,
  listWorkerApplications,
  type Conversation,
  type LiveJobPost,
  type LiveShiftPost,
  type WorkerApplication,
  type WorkerDashboardCounts,
} from '@chairside/api';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { View } from 'react-native';

import { DashboardUnreadMessagesCard } from '@/components/messaging/DashboardUnreadMessagesCard';
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
import { useMessageUnread } from '@/contexts/MessageUnreadContext';
import { useWorkerProfile } from '@/contexts/WorkerProfileContext';
import { useRefreshOnFocus } from '@/hooks/useRefreshOnFocus';
import {
  WORKER_BROWSE,
  WORKER_FILLINS,
  getWorkerApplicationMessagesRoute,
  getWorkerApplicationRoute,
  getWorkerJobDetailRoute,
  getWorkerMessagesRoute,
  getWorkerShiftDetailRoute,
} from '@/lib/routing';
import { useThemedStyles } from '@/theme';

export default function WorkerDashboardScreen() {
  const { user, profile } = useAuth();
  const { refreshUnread } = useMessageUnread();
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
  const [conversations, setConversations] = useState<Conversation[]>([]);

  const styles = useThemedStyles(({ spacing }) => ({
    content: { gap: spacing.xl },
    row: { flexDirection: 'row', gap: spacing.sm },
  }));

  const loadDashboard = useCallback(async () => {
    if (!user?.id) return;

    try {
      const [nextCounts, jobPosts, shiftPosts, applicationRows, conversationRows] =
        await Promise.all([
        getWorkerDashboardCounts(user.id, province),
        listLiveJobPosts(province),
        listLiveShiftPosts(province),
        listWorkerApplications(user.id),
        listConversationsForWorker(user.id),
      ]);

      setCounts(nextCounts);
      setJobs(jobPosts);
      setShifts(shiftPosts);
      setApplications(applicationRows);
      setConversations(conversationRows);
      await refreshUnread();
    } catch {
      setCounts({ openRolesInProvince: 0, openFillInsInProvince: 0, pendingApplications: 0 });
      setJobs([]);
      setShifts([]);
      setApplications([]);
      setConversations([]);
    }
  }, [province, refreshUnread, user?.id]);

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

  const unreadMap = useMemo(() => {
    const map: Record<string, boolean> = {};
    for (const conversation of conversations) {
      if (conversation.unread) {
        map[conversation.application_id] = true;
      }
    }
    return map;
  }, [conversations]);

  return (
    <Screen showHeader={false} showNotifications={false}>
      <View style={styles.content}>
        <WorkerDashboardHero
          displayName={profile?.display_name}
          province={province}
          showProvinceBadge={isWorkerProfileComplete(workerProfile)}
        />

        <WorkerReadinessChecklist workerProfile={workerProfile} />

        <DashboardUnreadMessagesCard
          conversations={conversations}
          avatarKind="clinic"
          onConversationPress={(conversation) =>
            router.push(
              getWorkerApplicationMessagesRoute(conversation.application_id, 'dashboard-applications', {
                conversationId: conversation.id,
                title: conversation.counterpart_name,
                subtitle: conversation.post_title,
              }),
            )
          }
          onViewAllPress={() => router.push(getWorkerMessagesRoute())}
        />

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
          unreadMap={unreadMap}
          onJobPress={(jobId) => router.push(getWorkerJobDetailRoute(jobId))}
          onShiftPress={(shiftId) => router.push(getWorkerShiftDetailRoute(shiftId))}
          onApplicationPress={(applicationId) =>
            router.push(getWorkerApplicationRoute(applicationId, 'dashboard-applications'))
          }
        />
      </View>
    </Screen>
  );
}
