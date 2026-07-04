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
import { getWorkerRoleTypes } from '@chairside/api';
import { formatRoleTypesLabel } from '@chairside/config';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert } from 'react-native';

import { DashboardBodyLayout } from '@/components/dashboard/DashboardBodyLayout';
import { DashboardErrorBanner } from '@/components/dashboard/DashboardErrorBanner';
import { DashboardHero } from '@/components/dashboard/DashboardHero';
import { DashboardLoadingShell } from '@/components/dashboard/DashboardLoadingShell';
import { DashboardQuickActionsRow } from '@/components/dashboard/DashboardQuickActionsRow';
import { DashboardScreen } from '@/components/dashboard/DashboardScreen';
import { DashboardSpotlightCard } from '@/components/dashboard/DashboardSpotlightCard';
import { DashboardStatCards } from '@/components/dashboard/DashboardStatCards';
import { FadeInSection } from '@/components/dashboard/FadeInSection';
import {
  WorkerOverviewPanel,
  type WorkerOverviewStat,
} from '@/components/worker/WorkerCards';
import { WorkerReadinessChecklist } from '@/components/worker/WorkerReadinessChecklist';
import { DashboardUnreadMessagesCard } from '@/components/messaging/DashboardUnreadMessagesCard';
import { useApplicationTabBadge } from '@/contexts/ApplicationTabBadgeContext';
import { useAuth } from '@/contexts/AuthContext';
import { useMessageUnread } from '@/contexts/MessageUnreadContext';
import { useWorkerProfile } from '@/contexts/WorkerProfileContext';
import { useRefreshOnFocus } from '@/hooks/useRefreshOnFocus';
import { useGetStartedBrowseProgress } from '@/contexts/GetStartedBrowseProgressContext';
import { useProfilePhoto } from '@/hooks/useProfilePhoto';
import { pickWorkerSpotlight } from '@/lib/dashboardSpotlight';
import { getMessageThreadPreview } from '@/lib/conversationDisplay';
import {
  WORKER_APPLICATIONS,
  WORKER_BROWSE,
  WORKER_FILLINS,
  WORKER_PROFILE,
  getConversationMessagesRoute,
  getWorkerApplicationRoute,
  getWorkerJobDetailRoute,
  getWorkerMessagesRoute,
  getWorkerShiftDetailRoute,
} from '@/lib/routing';

export default function WorkerDashboardScreen() {
  const { user, profile } = useAuth();
  const { refreshUnread } = useMessageUnread();
  const { pendingCount: applicationUpdateCount, fillInPendingCount } = useApplicationTabBadge();
  const { workerProfile, isProfileComplete } = useWorkerProfile();
  const { photoUri } = useProfilePhoto();
  const { overview } = useLocalSearchParams<{ overview?: string }>();
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

  const openConversation = useCallback((conversation: Conversation) => {
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
  }, []);

  const spotlight = useMemo(
    () =>
      pickWorkerSpotlight({
        conversations,
        jobApplications,
        shiftApplications,
        openJobs,
        unreadMap,
        onOpenConversation: openConversation,
        onOpenApplication: (application) => {
          router.push(
            getWorkerApplicationRoute(
              application.id,
              application.post_type === 'shift' ? 'dashboard-fill-ins' : 'dashboard-applications',
            ),
          );
        },
        onOpenJob: (jobId) => router.push(getWorkerJobDetailRoute(jobId)),
        onOpenApplicationsTab: () => router.push(WORKER_APPLICATIONS),
        onOpenMessages: () => router.push(getWorkerMessagesRoute()),
      }),
    [
      conversations,
      jobApplications,
      openConversation,
      openJobs,
      shiftApplications,
      unreadMap,
    ],
  );

  const workerSubtitle =
    (workerProfile && formatRoleTypesLabel(getWorkerRoleTypes(workerProfile))) ||
    'Dental professional';

  const overviewViewAll = useCallback(() => {
    if (selectedOverview === 'roles') {
      router.push(WORKER_BROWSE);
      return;
    }
    if (selectedOverview === 'fill-ins') {
      router.push(WORKER_FILLINS);
      return;
    }
    router.push(WORKER_APPLICATIONS);
  }, [selectedOverview]);

  const dashboardBody = (
    <DashboardBodyLayout
      hero={
        <FadeInSection delayMs={0}>
          <DashboardHero
            profileHref={WORKER_PROFILE}
            avatarKind="worker"
            displayName={isProfileComplete ? profile?.display_name : null}
            photoUri={photoUri}
            namePlaceholder="Your profile"
            subtitle={workerSubtitle}
            showActions={isProfileComplete}
          />
        </FadeInSection>
      }
      error={
        loadError ? (
          <FadeInSection>
            <DashboardErrorBanner onRetry={() => void loadDashboard()} />
          </FadeInSection>
        ) : null
      }
      spotlight={
        spotlight ? (
          <FadeInSection delayMs={60}>
            <DashboardSpotlightCard item={spotlight} />
          </FadeInSection>
        ) : null
      }
      statCards={
        <FadeInSection delayMs={100}>
          <DashboardStatCards
            selected={selectedOverview}
            onSelect={setSelectedOverview}
            stats={[
              {
                key: 'roles',
                label: 'Open roles',
                value: openJobs.length,
                icon: 'briefcase-outline',
                accent: 'primary',
              },
              {
                key: 'fill-ins',
                label: 'Fill-ins',
                value: counts.openFillInsInProvince,
                badgeCount: fillInPendingCount,
                icon: 'calendar-outline',
                accent: 'secondary',
              },
              {
                key: 'applications',
                label: 'Applications',
                value: counts.pendingApplications,
                badgeCount: applicationUpdateCount,
                icon: 'document-text-outline',
                accent: 'primary',
              },
            ]}
          />
        </FadeInSection>
      }
      quickActions={
        <FadeInSection delayMs={140}>
          <DashboardQuickActionsRow
            actions={[
              {
                label: 'Find jobs',
                description: 'Browse open roles nearby',
                icon: 'briefcase-outline',
                variant: 'primary',
                onPress: () => router.push(WORKER_BROWSE),
              },
              {
                label: 'Find fill-ins',
                description: 'Browse temp shifts nearby',
                icon: 'calendar-outline',
                variant: 'secondary',
                onPress: () => router.push(WORKER_FILLINS),
              },
            ]}
          />
        </FadeInSection>
      }
      overview={
        <FadeInSection delayMs={180}>
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
            onViewAllPress={overviewViewAll}
          />
        </FadeInSection>
      }
      checklist={
        <FadeInSection delayMs={220}>
          <WorkerReadinessChecklist
            workerProfile={workerProfile}
            jobApplicationCount={jobApplications.length}
            shiftApplicationCount={shiftApplications.length}
            savedShiftCount={savedShiftIds.size}
          />
        </FadeInSection>
      }
      messages={
        conversations.some((conversation) => conversation.unread) ? (
          <FadeInSection delayMs={160}>
            <DashboardUnreadMessagesCard
              conversations={conversations}
              avatarKind="clinic"
              role="worker"
              onConversationPress={openConversation}
              onViewAllPress={() => router.push(getWorkerMessagesRoute())}
            />
          </FadeInSection>
        ) : null
      }
    />
  );

  return (
    <DashboardScreen>
      {isLoading && !hasLoadedOnce.current ? <DashboardLoadingShell /> : dashboardBody}
    </DashboardScreen>
  );
}
