import {
  getWorkerDashboardCounts,
  getWorkerSavedPostIds,
  listConversationsForWorker,
  listLiveJobPosts,
  listLiveShiftPosts,
  listWorkerAppliedJobPostIds,
  listWorkerJobApplications,
  listWorkerShiftApplications,
  saveJobPost,
  saveShiftPost,
  unsaveJobPost,
  unsaveShiftPost,
  type Conversation,
  type LiveJobPost,
  type LiveShiftPost,
  type WorkerApplication,
  type WorkerDashboardCounts,
} from '@chairside/api';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, View } from 'react-native';

import { DashboardErrorBanner } from '@/components/dashboard/DashboardErrorBanner';
import { DashboardLoadingShell } from '@/components/dashboard/DashboardLoadingShell';
import { DashboardScreen } from '@/components/dashboard/DashboardScreen';
import { FadeInSection } from '@/components/dashboard/FadeInSection';
import { DashboardQuickActionTile } from '@/components/dashboard/DashboardQuickActionTile';
import { DashboardSectionHeader } from '@/components/dashboard/DashboardSectionHeader';
import { getDashboardLayoutStyles } from '@/components/dashboard/dashboardLayout';
import { DashboardStatGrid, DASHBOARD_OVERVIEW_SEGMENT_ACCENTS, getDashboardOverviewAccent } from '@/components/dashboard/DashboardStatGrid';
import {
  WorkerDashboardHeaderActions,
  WorkerDashboardHeaderName,
  WorkerDashboardHeaderSubtitle,
  WorkerDashboardGreeting,
  WorkerOverviewPanel,
  type WorkerOverviewStat,
} from '@/components/worker/WorkerCards';
import { WorkerReadinessChecklist } from '@/components/worker/WorkerReadinessChecklist';
import { useApplicationTabBadge } from '@/contexts/ApplicationTabBadgeContext';
import { useAuth } from '@/contexts/AuthContext';
import { useMessageUnread } from '@/contexts/MessageUnreadContext';
import { useWorkerProfile } from '@/contexts/WorkerProfileContext';
import { useRefreshOnFocus } from '@/hooks/useRefreshOnFocus';
import { useGetStartedBrowseProgress } from '@/contexts/GetStartedBrowseProgressContext';
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
  const { workerProfile, isProfileComplete } = useWorkerProfile();
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
  const [savedJobIds, setSavedJobIds] = useState<Set<string>>(new Set());
  const [savedShiftIds, setSavedShiftIds] = useState<Set<string>>(new Set());
  const [shifts, setShifts] = useState<LiveShiftPost[]>([]);
  const [jobApplications, setJobApplications] = useState<WorkerApplication[]>([]);
  const [shiftApplications, setShiftApplications] = useState<WorkerApplication[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const hasLoadedOnce = useRef(false);
  const { markVisited: markGetStartedBrowseVisited } = useGetStartedBrowseProgress();

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
        savedPostIds,
      ] = await Promise.all([
        getWorkerDashboardCounts(user.id, province),
        listLiveJobPosts(province),
        listWorkerAppliedJobPostIds(user.id),
        listLiveShiftPosts(province),
        listWorkerJobApplications(user.id),
        listWorkerShiftApplications(user.id),
        listConversationsForWorker(user.id),
        getWorkerSavedPostIds(user.id),
      ]);

      setCounts(nextCounts);
      setJobs(jobPosts);
      setAppliedJobPostIds(new Set(appliedJobIds));
      setSavedJobIds(savedPostIds.jobIds);
      setSavedShiftIds(savedPostIds.shiftIds);
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
        setSavedJobIds(new Set());
        setSavedShiftIds(new Set());
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

  useEffect(() => {
    if (selectedOverview === 'fill-ins') {
      void markGetStartedBrowseVisited('fillIns');
    }
  }, [markGetStartedBrowseVisited, selectedOverview]);

  const openJobs = useMemo(
    () => jobs.filter((job) => !appliedJobPostIds.has(job.id)),
    [appliedJobPostIds, jobs],
  );

  const handleToggleSavedJob = useCallback(
    async (jobId: string, nextSaved: boolean) => {
      if (!user?.id) return;
      const previous = new Set(savedJobIds);
      setSavedJobIds((current) => {
        const next = new Set(current);
        if (nextSaved) next.add(jobId);
        else next.delete(jobId);
        return next;
      });
      try {
        if (nextSaved) await saveJobPost(jobId);
        else await unsaveJobPost(jobId);
      } catch (error) {
        setSavedJobIds(previous);
        Alert.alert(
          'Could not update saved role',
          error instanceof Error ? error.message : 'Please try again.',
        );
      }
    },
    [savedJobIds, user?.id],
  );

  const handleToggleSavedShift = useCallback(
    async (shiftId: string, nextSaved: boolean) => {
      if (!user?.id) return;
      const previous = new Set(savedShiftIds);
      setSavedShiftIds((current) => {
        const next = new Set(current);
        if (nextSaved) next.add(shiftId);
        else next.delete(shiftId);
        return next;
      });
      try {
        if (nextSaved) await saveShiftPost(shiftId);
        else await unsaveShiftPost(shiftId);
      } catch (error) {
        setSavedShiftIds(previous);
        Alert.alert(
          'Could not update saved fill-in',
          error instanceof Error ? error.message : 'Please try again.',
        );
      }
    },
    [savedShiftIds, user?.id],
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
  const showMobileHeaderIdentity = !isTablet && isProfileComplete;

  return (
    <DashboardScreen
      showBrandHeader
      brandHeaderLeading={showMobileHeaderIdentity ? <WorkerDashboardGreeting /> : undefined}
      brandHeaderName={
        showMobileHeaderIdentity ? (
          <WorkerDashboardHeaderName displayName={profile?.display_name} />
        ) : undefined
      }
      brandHeaderSubtitle={
        showMobileHeaderIdentity ? (
          <WorkerDashboardHeaderSubtitle workerProfile={workerProfile} />
        ) : undefined
      }
      brandHeaderTrailing={
        !isTablet ? (
          <WorkerDashboardHeaderActions displayName={profile?.display_name} />
        ) : undefined
      }
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

          <FadeInSection delayMs={40}>
            <WorkerReadinessChecklist
              workerProfile={workerProfile}
              jobApplicationCount={jobApplications.length}
              shiftApplicationCount={shiftApplications.length}
              savedShiftCount={savedShiftIds.size}
            />
          </FadeInSection>

          {isTablet ? (
            <FadeInSection delayMs={80}>
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
                segmentAccents={DASHBOARD_OVERVIEW_SEGMENT_ACCENTS}
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
                savedJobIds={savedJobIds}
                savedShiftIds={savedShiftIds}
                unreadMap={unreadMap}
                onJobPress={(jobId) => router.push(getWorkerJobDetailRoute(jobId))}
                onShiftPress={(shiftId) =>
                  router.push(getWorkerShiftDetailRoute(shiftId, 'dashboard-fill-ins'))
                }
                onToggleSavedJob={(jobId, nextSaved) => void handleToggleSavedJob(jobId, nextSaved)}
                onToggleSavedShift={(shiftId, nextSaved) =>
                  void handleToggleSavedShift(shiftId, nextSaved)
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
