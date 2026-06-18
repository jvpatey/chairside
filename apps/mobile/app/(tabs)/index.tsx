import {
  getWorkerDashboardCounts,
  isWorkerProfileComplete,
  listConversationsForWorker,
  listLiveJobPosts,
  listLiveShiftPosts,
  listWorkerAppliedJobPostIds,
  listWorkerJobApplications,
  listWorkerShiftApplications,
  type Conversation,
  type LiveJobPost,
  type LiveShiftPost,
  type WorkerApplication,
  type WorkerDashboardCounts,
} from '@chairside/api';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View } from 'react-native';

import { DashboardErrorBanner } from '@/components/dashboard/DashboardErrorBanner';
import { DashboardLoadingShell } from '@/components/dashboard/DashboardLoadingShell';
import { DashboardScreen } from '@/components/dashboard/DashboardScreen';
import { FadeInSection } from '@/components/dashboard/FadeInSection';
import { DashboardQuickActionTile } from '@/components/dashboard/DashboardQuickActionTile';
import { DashboardSectionHeader } from '@/components/dashboard/DashboardSectionHeader';
import { getDashboardLayoutStyles } from '@/components/dashboard/dashboardLayout';
import { DashboardStatGrid, getDashboardOverviewAccent } from '@/components/dashboard/DashboardStatGrid';
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
import { DashboardUnreadMessagesCard } from '@/components/messaging/DashboardUnreadMessagesCard';

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
  const [appliedJobPostIds, setAppliedJobPostIds] = useState<Set<string>>(new Set());
  const [shifts, setShifts] = useState<LiveShiftPost[]>([]);
  const [jobApplications, setJobApplications] = useState<WorkerApplication[]>([]);
  const [shiftApplications, setShiftApplications] = useState<WorkerApplication[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const hasLoadedOnce = useRef(false);

  const styles = useThemedStyles((theme) => ({
    ...getDashboardLayoutStyles(theme),
  }));

  const loadDashboard = useCallback(async () => {
    if (!user?.id) return;

    if (!hasLoadedOnce.current) {
      setIsLoading(true);
    }
    setLoadError(false);

    try {
      const [
        nextCounts,
        jobPosts,
        appliedJobIds,
        shiftPosts,
        jobApplicationRows,
        shiftApplicationRows,
        conversationRows,
      ] = await Promise.all([
        getWorkerDashboardCounts(user.id, province),
        listLiveJobPosts(province),
        listWorkerAppliedJobPostIds(user.id),
        listLiveShiftPosts(province),
        listWorkerJobApplications(user.id),
        listWorkerShiftApplications(user.id),
        listConversationsForWorker(user.id),
      ]);

      setCounts(nextCounts);
      setJobs(jobPosts);
      setAppliedJobPostIds(new Set(appliedJobIds));
      setShifts(shiftPosts);
      setJobApplications(jobApplicationRows);
      setShiftApplications(shiftApplicationRows);
      setConversations(conversationRows);
      await refreshUnread();
      hasLoadedOnce.current = true;
    } catch {
      setLoadError(true);
      if (!hasLoadedOnce.current) {
        setCounts({ openRolesInProvince: 0, openFillInsInProvince: 0, pendingApplications: 0 });
        setJobs([]);
        setAppliedJobPostIds(new Set());
        setShifts([]);
        setJobApplications([]);
        setShiftApplications([]);
        setConversations([]);
      }
    } finally {
      setIsLoading(false);
    }
  }, [province, refreshUnread, user?.id]);

  useRefreshOnFocus(loadDashboard);

  useEffect(() => {
    if (overview === 'roles' || overview === 'fill-ins' || overview === 'applications') {
      setSelectedOverview(overview);
    }
  }, [overview]);

  const openJobs = useMemo(
    () => jobs.filter((job) => !appliedJobPostIds.has(job.id)),
    [appliedJobPostIds, jobs],
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

  const hasUnreadMessagePreviews = conversations.some((conversation) => conversation.unread);

  return (
    <DashboardScreen
      showBrandHeader
      tabletTitle="Dashboard"
      tabletSubtitle="Roles, fill-ins, and applications at a glance.">
      {isLoading && !hasLoadedOnce.current ? (
        <DashboardLoadingShell />
      ) : (
        <View style={styles.content}>
          {loadError ? (
            <FadeInSection>
              <DashboardErrorBanner onRetry={() => void loadDashboard()} />
            </FadeInSection>
          ) : null}

          {!isTablet ? (
            <FadeInSection delayMs={0}>
              <WorkerDashboardHero
                displayName={profile?.display_name}
                workerProfile={workerProfile}
              />
            </FadeInSection>
          ) : null}

          {isTablet ? (
            <FadeInSection delayMs={40}>
              <View style={styles.quickActionSection}>
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
            </FadeInSection>
          ) : null}

          {!isWorkerProfileComplete(workerProfile) ? (
            <FadeInSection delayMs={80}>
              <WorkerReadinessChecklist workerProfile={workerProfile} />
            </FadeInSection>
          ) : null}

          {hasUnreadMessagePreviews ? (
            <FadeInSection delayMs={120}>
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
            </FadeInSection>
          ) : null}

          {!isTablet ? (
            <FadeInSection delayMs={160}>
              <View style={styles.quickActionSection}>
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
            </FadeInSection>
          ) : null}

          <FadeInSection delayMs={200}>
            <View style={styles.overviewBlock}>
              <DashboardStatGrid
                selected={selectedOverview}
                onSelect={setSelectedOverview}
                accent={getDashboardOverviewAccent(selectedOverview)}
                stats={[
                  { key: 'roles', label: 'Open roles', value: openJobs.length },
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
              <WorkerOverviewPanel
                selected={selectedOverview}
                jobs={openJobs}
                shifts={shifts}
                jobApplications={jobApplications}
                shiftApplications={shiftApplications}
                unreadMap={unreadMap}
                onJobPress={(jobId) => router.push(getWorkerJobDetailRoute(jobId))}
                onShiftPress={(shiftId) =>
                  router.push(getWorkerShiftDetailRoute(shiftId, 'dashboard-fill-ins'))
                }
                onApplicationUpdated={() => void loadDashboard()}
              />
            </View>
          </FadeInSection>
        </View>
      )}
    </DashboardScreen>
  );
}
