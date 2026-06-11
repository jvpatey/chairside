import {
  getWorkerDashboardCounts,
  isWorkerProfileComplete,
  listConversationsForWorker,
  listLiveJobPosts,
  listLiveShiftPosts,
  listWorkerJobApplications,
  listWorkerShiftApplications,
  type Conversation,
  type LiveJobPost,
  type LiveShiftPost,
  type WorkerApplication,
  type WorkerDashboardCounts,
} from '@chairside/api';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { View } from 'react-native';

import { DashboardTabletSectionHeader } from '@/components/dashboard/DashboardTabletSectionHeader';
import { DashboardQuickActionTile } from '@/components/dashboard/DashboardQuickActionTile';
import { DashboardSectionHeader } from '@/components/dashboard/DashboardSectionHeader';
import { getDashboardLayoutStyles } from '@/components/dashboard/dashboardLayout';
import { DashboardStatGrid } from '@/components/dashboard/DashboardStatGrid';
import { DashboardUnreadMessagesCard } from '@/components/messaging/DashboardUnreadMessagesCard';
import { Screen } from '@/components/ui/Screen';
import {
  WorkerDashboardHero,
  WorkerOverviewPanel,
  type WorkerOverviewStat,
} from '@/components/worker/WorkerCards';
import { WorkerReadinessChecklist } from '@/components/worker/WorkerReadinessChecklist';
import { useApplicationTabBadge } from '@/contexts/ApplicationTabBadgeContext';
import { useAuth } from '@/contexts/AuthContext';
import { useMessageUnread } from '@/contexts/MessageUnreadContext';
import { useWorkerProfile } from '@/contexts/WorkerProfileContext';
import { useRefreshOnFocus } from '@/hooks/useRefreshOnFocus';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';
import { getMessageThreadPreview } from '@/lib/conversationDisplay';
import {
  WORKER_BROWSE,
  WORKER_FILLINS,
  getConversationMessagesRoute,
  getWorkerJobDetailRoute,
  getWorkerMessagesRoute,
  getWorkerShiftDetailRoute,
} from '@/lib/routing';
import { useThemedStyles } from '@/theme';

export default function WorkerDashboardScreen() {
  const { user, profile } = useAuth();
  const { refreshUnread } = useMessageUnread();
  const { pendingCount: applicationUpdateCount, fillInPendingCount } = useApplicationTabBadge();
  const { workerProfile } = useWorkerProfile();
  const { overview } = useLocalSearchParams<{ overview?: string }>();
  const { isTablet } = useResponsiveLayout();
  const province = workerProfile?.province ?? 'NS';
  const [counts, setCounts] = useState<WorkerDashboardCounts>({
    openRolesInProvince: 0,
    openFillInsInProvince: 0,
    pendingApplications: 0,
  });
  const [selectedOverview, setSelectedOverview] = useState<WorkerOverviewStat>('roles');
  const [jobs, setJobs] = useState<LiveJobPost[]>([]);
  const [shifts, setShifts] = useState<LiveShiftPost[]>([]);
  const [jobApplications, setJobApplications] = useState<WorkerApplication[]>([]);
  const [shiftApplications, setShiftApplications] = useState<WorkerApplication[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);

  const styles = useThemedStyles((theme) => ({
    ...getDashboardLayoutStyles(theme),
  }));

  const loadDashboard = useCallback(async () => {
    if (!user?.id) return;

    try {
      const [nextCounts, jobPosts, shiftPosts, jobApplicationRows, shiftApplicationRows, conversationRows] =
        await Promise.all([
        getWorkerDashboardCounts(user.id, province),
        listLiveJobPosts(province),
        listLiveShiftPosts(province),
        listWorkerJobApplications(user.id),
        listWorkerShiftApplications(user.id),
        listConversationsForWorker(user.id),
      ]);

      setCounts(nextCounts);
      setJobs(jobPosts);
      setShifts(shiftPosts);
      setJobApplications(jobApplicationRows);
      setShiftApplications(shiftApplicationRows);
      setConversations(conversationRows);
      await refreshUnread();
    } catch {
      setCounts({ openRolesInProvince: 0, openFillInsInProvince: 0, pendingApplications: 0 });
      setJobs([]);
      setShifts([]);
      setJobApplications([]);
      setShiftApplications([]);
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
        jobApplications
          .filter((application) => application.job_post_id)
          .map((application) => application.job_post_id as string),
      ),
    [jobApplications],
  );

  const unreadMap = useMemo(() => {
    const map: Record<string, boolean> = {};
    for (const conversation of conversations) {
      if (conversation.application_id && conversation.unread) {
        map[conversation.application_id] = true;
      }
    }
    return map;
  }, [conversations]);

  return (
    <Screen showHeader={false} showNotifications={false}>
      <View style={styles.content}>
        {!isTablet ? (
          <WorkerDashboardHero
            displayName={profile?.display_name}
            province={province}
            showProvinceBadge={isWorkerProfileComplete(workerProfile)}
          />
        ) : null}

        {isTablet ? (
          <View style={styles.section}>
            <DashboardTabletSectionHeader title="Quick actions" />
            <View style={styles.quickActionRow}>
              <DashboardQuickActionTile
                label="Find jobs"
                description="Browse open roles nearby"
                icon="briefcase-outline"
                variant="primary"
                onPress={() => router.push(WORKER_BROWSE)}
              />
              <DashboardQuickActionTile
                label="Find fill-ins"
                description="Browse temp shifts nearby"
                icon="calendar-outline"
                variant="secondary"
                onPress={() => router.push(WORKER_FILLINS)}
              />
            </View>
          </View>
        ) : null}

        <WorkerReadinessChecklist workerProfile={workerProfile} />

        <DashboardUnreadMessagesCard
          conversations={conversations}
          avatarKind="clinic"
          role="worker"
          onConversationPress={(conversation) => {
            const preview = getMessageThreadPreview(conversation, 'worker');
            router.push(
              getConversationMessagesRoute(
                conversation,
                'worker',
                {
                  conversationId: conversation.id,
                  ...preview,
                },
                'dashboard-applications',
              ),
            );
          }}
          onViewAllPress={() => router.push(getWorkerMessagesRoute())}
        />

        {!isTablet ? (
          <View style={styles.section}>
            <DashboardSectionHeader title="Quick actions" />
            <View style={styles.quickActionRow}>
              <DashboardQuickActionTile
                label="Find jobs"
                description="Browse open roles nearby"
                icon="briefcase-outline"
                variant="primary"
                onPress={() => router.push(WORKER_BROWSE)}
              />
              <DashboardQuickActionTile
                label="Find fill-ins"
                description="Browse temp shifts nearby"
                icon="calendar-outline"
                variant="secondary"
                onPress={() => router.push(WORKER_FILLINS)}
              />
            </View>
          </View>
        ) : null}

        <View style={styles.overviewSection}>
          <DashboardSectionHeader title="Overview" />
          <DashboardStatGrid
            selected={selectedOverview}
            onSelect={setSelectedOverview}
            stats={[
              { key: 'roles', label: 'Open roles', value: counts.openRolesInProvince },
              {
                key: 'fill-ins',
                label: 'Fill-ins',
                value: counts.openFillInsInProvince,
                badgeCount: fillInPendingCount,
              },
              {
                key: 'applications',
                label: 'Applications',
                value: counts.pendingApplications,
                badgeCount: applicationUpdateCount,
              },
            ]}
          />
        </View>

        <WorkerOverviewPanel
          selected={selectedOverview}
          jobs={jobs}
          shifts={shifts}
          jobApplications={jobApplications}
          shiftApplications={shiftApplications}
          appliedJobIds={appliedJobIds}
          unreadMap={unreadMap}
          onJobPress={(jobId) => router.push(getWorkerJobDetailRoute(jobId))}
          onShiftPress={(shiftId) => router.push(getWorkerShiftDetailRoute(shiftId, 'dashboard-fill-ins'))}
          onApplicationUpdated={() => void loadDashboard()}
        />
      </View>
    </Screen>
  );
}
