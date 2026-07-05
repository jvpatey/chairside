import {
  getClinicDashboardCounts,
  getJobPostApplicationCountsMap,
  getMissingClinicProfileFields,
  getShiftPostApplicationCount,
  getShiftPostPendingApplicationCountsMap,
  listConversationsForClinic,
  listJobApplicationSummaries,
  listJobPosts,
  listShiftPosts,
  type ClinicDashboardCounts,
  listUpcomingConfirmedFillIns,
  type ConfirmedFillInSummary,
  type Conversation,
  type JobApplicationSummary,
  type JobPost,
  type ShiftPost,
} from '@chairside/api';
import type { Href } from 'expo-router';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert } from 'react-native';

import {
  DashboardOverviewPanel,
  type OverviewStat,
} from '@/components/clinic/ClinicCards';
import { DashboardCoverRequestsCard } from '@/components/clinic/DashboardCoverRequestsCard';
import { DashboardBodyLayout } from '@/components/dashboard/DashboardBodyLayout';
import { DashboardErrorBanner } from '@/components/dashboard/DashboardErrorBanner';
import { DashboardHero } from '@/components/dashboard/DashboardHero';
import { DashboardLoadingShell } from '@/components/dashboard/DashboardLoadingShell';
import { DashboardQuickActionsRow } from '@/components/dashboard/DashboardQuickActionsRow';
import { DashboardScreen } from '@/components/dashboard/DashboardScreen';
import { DashboardSpotlightCard } from '@/components/dashboard/DashboardSpotlightCard';
import { DashboardStatCards } from '@/components/dashboard/DashboardStatCards';
import { FadeInSection } from '@/components/dashboard/FadeInSection';
import { DashboardUnreadMessagesCard } from '@/components/messaging/DashboardUnreadMessagesCard';
import { useApplicationTabBadge } from '@/contexts/ApplicationTabBadgeContext';
import { useAuth } from '@/contexts/AuthContext';
import { useClinicProfile } from '@/contexts/ClinicProfileContext';
import { useFillInPending } from '@/contexts/FillInPendingContext';
import { useMessageUnread } from '@/contexts/MessageUnreadContext';
import { useDismissedDashboardSpotlights } from '@/hooks/useDismissedDashboardSpotlights';
import { useRefreshOnFocus } from '@/hooks/useRefreshOnFocus';
import { useClinicLogo } from '@/hooks/useClinicLogo';
import { pickClinicSpotlight } from '@/lib/dashboardSpotlight';
import { getMessageThreadPreview } from '@/lib/conversationDisplay';
import {
  CLINIC_APPLICATIONS,
  CLINIC_FILL_INS,
  CLINIC_POSTINGS,
  CLINIC_POST_JOB,
  CLINIC_PROFILE,
  CLINIC_SETUP_BASICS,
  getClinicMessagesRoute,
  getClinicRoleApplicationsRoute,
  getConversationMessagesRoute,
  getJobDetailRoute,
  getPostShiftRoute,
} from '@/lib/routing';

export default function ClinicDashboardScreen() {
  const { user } = useAuth();
  const { refreshUnread } = useMessageUnread();
  const { pendingCount: fillInUpdateCount } = useFillInPending();
  const { pendingCount: applicationUpdateCount } = useApplicationTabBadge();
  const { clinicProfile, isProfileComplete } = useClinicProfile();
  const { logoUri } = useClinicLogo();
  const { overview } = useLocalSearchParams<{ overview?: string }>();
  const [counts, setCounts] = useState<ClinicDashboardCounts>({
    openRoles: 0,
    fillInsPosted: 0,
    totalApplications: 0,
    newApplications: 0,
  });
  const [selectedOverview, setSelectedOverview] = useState<OverviewStat>('roles');
  const [jobs, setJobs] = useState<JobPost[]>([]);
  const [shifts, setShifts] = useState<ShiftPost[]>([]);
  const [jobApplicationSummaries, setJobApplicationSummaries] = useState<JobApplicationSummary[]>(
    [],
  );
  const [applicantCounts, setApplicantCounts] = useState<Record<string, number>>({});
  const [shiftPendingCounts, setShiftPendingCounts] = useState<Record<string, number>>({});
  const [shiftApplicationCounts, setShiftApplicationCounts] = useState<Record<string, number>>({});
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [confirmedFillIns, setConfirmedFillIns] = useState<ConfirmedFillInSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const hasLoadedOnce = useRef(false);
  const {
    isHydrated: isSpotlightDismissHydrated,
    dismissedIds: dismissedSpotlightIds,
    dismiss: dismissSpotlight,
  } = useDismissedDashboardSpotlights('clinic');

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
        shiftPosts,
        summaries,
        counts,
        pendingShiftCounts,
        conversationRows,
        confirmed,
      ] = await Promise.all([
        getClinicDashboardCounts(user.id),
        listJobPosts(user.id),
        listShiftPosts(user.id),
        listJobApplicationSummaries(user.id),
        getJobPostApplicationCountsMap(user.id),
        getShiftPostPendingApplicationCountsMap(user.id),
        listConversationsForClinic(user.id),
        listUpcomingConfirmedFillIns(user.id),
      ]);

      const shiftApplicationCountEntries = await Promise.all(
        shiftPosts.map(async (shift) => {
          const count = await getShiftPostApplicationCount(user.id, shift.id);
          return [shift.id, count] as const;
        }),
      );

      setCounts(nextCounts);
      setJobs(jobPosts);
      setShifts(shiftPosts);
      setJobApplicationSummaries(summaries);
      setApplicantCounts(counts);
      setShiftPendingCounts(pendingShiftCounts);
      setShiftApplicationCounts(Object.fromEntries(shiftApplicationCountEntries));
      setConversations(conversationRows);
      setConfirmedFillIns(confirmed);
      await refreshUnread();
      hasLoadedOnce.current = true;
    } catch {
      setLoadError(true);
      if (!hasLoadedOnce.current) {
        setCounts({ openRoles: 0, fillInsPosted: 0, totalApplications: 0, newApplications: 0 });
        setJobs([]);
        setShifts([]);
        setJobApplicationSummaries([]);
        setApplicantCounts({});
        setShiftPendingCounts({});
        setShiftApplicationCounts({});
        setConversations([]);
        setConfirmedFillIns([]);
      }
    } finally {
      setIsLoading(false);
    }
  }, [refreshUnread, user?.id]);

  useRefreshOnFocus(loadDashboard);

  const handleShiftUpdated = useCallback((updated: ShiftPost) => {
    setShifts((prev) => prev.map((shift) => (shift.id === updated.id ? updated : shift)));
  }, []);

  const handleShiftDeleted = useCallback((shiftId: string) => {
    setShifts((prev) => prev.filter((shift) => shift.id !== shiftId));
  }, []);

  const handleJobUpdated = useCallback(
    (updated: JobPost) => {
      setJobs((prev) => prev.map((job) => (job.id === updated.id ? updated : job)));
      void loadDashboard();
    },
    [loadDashboard],
  );

  const handleJobDeleted = useCallback(
    (jobId: string) => {
      setJobs((prev) => prev.filter((job) => job.id !== jobId));
      setApplicantCounts((prev) => {
        const next = { ...prev };
        delete next[jobId];
        return next;
      });
      void loadDashboard();
    },
    [loadDashboard],
  );

  useEffect(() => {
    if (overview === 'roles' || overview === 'fill-ins' || overview === 'applications') {
      setSelectedOverview(overview);
    }
  }, [overview]);

  const guardPosting = (target: Href) => {
    if (isProfileComplete) {
      router.push(target);
      return;
    }

    const missing = getMissingClinicProfileFields(clinicProfile);
    Alert.alert(
      'Complete your clinic profile',
      missing.length > 0
        ? `Add the following before posting: ${missing.join(', ')}`
        : 'Finish your clinic profile to start posting.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Continue setup', onPress: () => router.push(CLINIC_SETUP_BASICS) },
      ],
    );
  };

  const clinicName = clinicProfile?.clinic_name?.trim() || null;

  const openConversation = useCallback((conversation: Conversation) => {
    const preview = getMessageThreadPreview(conversation, 'clinic');
    router.push(
      getConversationMessagesRoute(
        conversation,
        'clinic',
        {
          conversationId: conversation.id,
          ...preview,
        },
        'messages-tab',
      ),
    );
  }, []);

  const spotlight = useMemo(
    () =>
      isSpotlightDismissHydrated
        ? pickClinicSpotlight({
            fillInUpdateCount,
            applicationUpdateCount,
            confirmedFillIns,
            jobs,
            jobApplicationSummaries,
            dismissedIds: dismissedSpotlightIds,
            onOpenFillIns: () => router.push(CLINIC_FILL_INS),
            onOpenApplications: () => router.push(CLINIC_APPLICATIONS),
            onOpenConfirmedFillIn: () => router.push(CLINIC_FILL_INS),
            onOpenJobApplicants: (jobId) =>
              router.push(getClinicRoleApplicationsRoute(jobId, 'dashboard-applications')),
          })
        : null,
    [
      applicationUpdateCount,
      confirmedFillIns,
      dismissedSpotlightIds,
      fillInUpdateCount,
      isSpotlightDismissHydrated,
      jobApplicationSummaries,
      jobs,
    ],
  );

  const overviewViewAll = useCallback(() => {
    if (selectedOverview === 'roles') {
      router.push(CLINIC_POSTINGS);
      return;
    }
    if (selectedOverview === 'fill-ins') {
      router.push(CLINIC_FILL_INS);
      return;
    }
    router.push(CLINIC_APPLICATIONS);
  }, [selectedOverview]);

  const dashboardBody = (
    <DashboardBodyLayout
      hero={
        <FadeInSection delayMs={0}>
          <DashboardHero
            profileHref={CLINIC_PROFILE}
            avatarKind="clinic"
            displayName={isProfileComplete ? clinicName : null}
            photoUri={isProfileComplete ? logoUri : null}
            namePlaceholder={isProfileComplete ? 'Your practice' : 'Welcome to Chairside'}
            subtitle={isProfileComplete ? 'Dental Clinic' : 'Finish your clinic setup'}
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
            <DashboardSpotlightCard
              item={spotlight}
              onDismiss={() => void dismissSpotlight(spotlight.id)}
            />
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
                value: counts.openRoles,
                accent: 'primary',
              },
              {
                key: 'fill-ins',
                label: 'Fill-ins',
                value: counts.fillInsPosted,
                badgeCount: fillInUpdateCount,
                accent: 'secondary',
              },
              {
                key: 'applications',
                label: 'Applications',
                value: counts.totalApplications,
                badgeCount: applicationUpdateCount,
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
                label: 'Post a role',
                description: 'Full-time or part-time hire',
                icon: 'briefcase-outline',
                variant: 'primary',
                onPress: () => guardPosting(CLINIC_POST_JOB),
              },
              {
                label: 'Post fill-in',
                description: 'Temp or urgent shift',
                icon: 'calendar-outline',
                variant: 'secondary',
                onPress: () => guardPosting(getPostShiftRoute('fill-ins-tab')),
              },
            ]}
          />
        </FadeInSection>
      }
      overview={
        <FadeInSection delayMs={180}>
          <DashboardOverviewPanel
            selected={selectedOverview}
            jobs={jobs}
            shifts={shifts}
            confirmedFillIns={confirmedFillIns}
            jobApplicationSummaries={jobApplicationSummaries}
            applicantCounts={applicantCounts}
            shiftPendingCounts={shiftPendingCounts}
            shiftApplicationCounts={shiftApplicationCounts}
            clinicId={user?.id}
            fillInReturnTo="dashboard-fill-ins"
            onJobUpdated={handleJobUpdated}
            onJobDeleted={handleJobDeleted}
            onShiftUpdated={handleShiftUpdated}
            onShiftDeleted={handleShiftDeleted}
            onJobPress={(jobId) => router.push(getJobDetailRoute(jobId))}
            onJobApplicationsPress={(jobId) =>
              router.push(getClinicRoleApplicationsRoute(jobId, 'dashboard-applications'))
            }
            onViewAllPress={overviewViewAll}
          />
        </FadeInSection>
      }
      messages={
        conversations.some((conversation) => conversation.unread) ? (
          <FadeInSection delayMs={160}>
            <DashboardUnreadMessagesCard
              conversations={conversations}
              avatarKind="worker"
              role="clinic"
              onConversationPress={openConversation}
              onViewAllPress={() => router.push(getClinicMessagesRoute())}
            />
          </FadeInSection>
        ) : null
      }
      alerts={
        fillInUpdateCount > 0 ? (
          <FadeInSection delayMs={200}>
            <DashboardCoverRequestsCard
              pendingCount={fillInUpdateCount}
              onPress={() => router.push(CLINIC_FILL_INS)}
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
