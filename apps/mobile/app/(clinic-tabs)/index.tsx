import {
  getClinicDashboardCounts,
  getJobPostApplicationCountsMap,
  getMissingClinicProfileFields,
  getShiftPostApplicationCount,
  getShiftPostPendingApplicationCountsMap,
  listClinicApplications,
  listClinicCalendarEvents,
  listConversationsForClinic,
  listJobApplicationSummaries,
  listJobPosts,
  listShiftPosts,
  type CalendarEvent,
  type ClinicApplication,
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
import { ClinicReadinessChecklist } from '@/components/clinic/ClinicReadinessChecklist';
import { DashboardBodyLayout } from '@/components/dashboard/DashboardBodyLayout';
import { DashboardErrorBanner } from '@/components/dashboard/DashboardErrorBanner';
import { DashboardHero } from '@/components/dashboard/DashboardHero';
import { DashboardLoadingShell } from '@/components/dashboard/DashboardLoadingShell';
import { DashboardNeedsAttention } from '@/components/dashboard/DashboardNeedsAttention';
import { DashboardNextUp } from '@/components/dashboard/DashboardNextUp';
import { DashboardPlanUsage } from '@/components/dashboard/DashboardPlanUsage';
import { DashboardQuickActionsRow } from '@/components/dashboard/DashboardQuickActionsRow';
import { DashboardScreen } from '@/components/dashboard/DashboardScreen';
import { FileTabWell } from '@/components/dashboard/FileTabWell';
import { FadeInSection } from '@/components/dashboard/FadeInSection';
import { DashboardUnreadMessagesCard } from '@/components/messaging/DashboardUnreadMessagesCard';
import { ClinicLocationScopeSwitcher } from '@/components/clinic/ClinicLocationScopeSwitcher';
import { useApplicationTabBadge } from '@/contexts/ApplicationTabBadgeContext';
import { useAuth } from '@/contexts/AuthContext';
import { useClinicProfile } from '@/contexts/ClinicProfileContext';
import { useFillInPending } from '@/contexts/FillInPendingContext';
import { useMessageUnread } from '@/contexts/MessageUnreadContext';
import { useClinicActingContext } from '@/hooks/useClinicActingContext';
import { HiringInsightsPanel } from '@/components/clinic/HiringInsightsPanel';
import { openClinicBillingModal } from '@/components/billing/ClinicBillingModal';
import { getClinicHiringInsightsUpgradeMessage } from '@/components/billing/ClinicUpgradePrompt';
import { useClinicUpgradePrompt } from '@/hooks/useClinicUpgradePrompt';
import { useRefreshOnFocus } from '@/hooks/useRefreshOnFocus';
import { useClinicLogo } from '@/hooks/useClinicLogo';
import { useClinicMemberPhoto } from '@/hooks/useClinicMemberPhoto';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';
import {
  buildClinicAttentionItems,
  summarizeJobApplicantPreviews,
} from '@/lib/dashboardAttention';
import { buildClinicHeroPulse } from '@/lib/dashboardPulse';
import { getFirstName } from '@/lib/greeting';
import {
  isFillInPostingLimitReached,
  isRolePostingLimitReached,
} from '@/lib/clinicPlanPresentation';
import { getMessageThreadPreview } from '@/lib/conversationDisplay';
import {
  CLINIC_APPLICATIONS,
  CLINIC_FILL_INS,
  CLINIC_POSTINGS,
  CLINIC_POST_JOB,
  CLINIC_PROFILE,
  CLINIC_SETUP_BASICS,
  getClinicApplicationRoute,
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
  const { clinicProfile, isProfileComplete, organization } = useClinicProfile();
  const {
    clinicId,
    scopedLocationIds,
    isGroup,
    memberDisplayName,
    memberRoleLabel,
    groupDisplayName,
  } = useClinicActingContext();
  const { isTablet } = useResponsiveLayout();
  const { billing, isBillingReady, refreshBilling, upgradePrompt } = useClinicUpgradePrompt();
  const { logoUri } = useClinicLogo();
  const { photoUri: memberPhotoUri } = useClinicMemberPhoto();
  const { overview } = useLocalSearchParams<{ overview?: string }>();
  const [counts, setCounts] = useState<ClinicDashboardCounts>({
    openRoles: 0,
    fillInsPosted: 0,
    totalApplications: 0,
    newApplications: 0,
    openRolesWeekDelta: 0,
    fillInsWeekDelta: 0,
    applicationsWeekDelta: 0,
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
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const [applications, setApplications] = useState<ClinicApplication[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const hasLoadedOnce = useRef(false);
  const loadDashboard = useCallback(async () => {
    if (!clinicId) return;

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
        clinicApplications,
        calendarRows,
      ] = await Promise.all([
        getClinicDashboardCounts(clinicId, { locationIds: scopedLocationIds }),
        listJobPosts(clinicId, { locationIds: scopedLocationIds }),
        listShiftPosts(clinicId, { locationIds: scopedLocationIds }),
        listJobApplicationSummaries(clinicId, { locationIds: scopedLocationIds }),
        getJobPostApplicationCountsMap(clinicId, { locationIds: scopedLocationIds }),
        getShiftPostPendingApplicationCountsMap(clinicId, {
          locationIds: scopedLocationIds,
        }),
        listConversationsForClinic(clinicId, { locationIds: scopedLocationIds }),
        listUpcomingConfirmedFillIns(clinicId, { locationIds: scopedLocationIds }),
        listClinicApplications(clinicId, 'active', { locationIds: scopedLocationIds }),
        listClinicCalendarEvents(clinicId),
      ]);

      const shiftApplicationCountEntries = await Promise.all(
        shiftPosts.map(async (shift) => {
          const count = await getShiftPostApplicationCount(clinicId, shift.id);
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
      setApplications(clinicApplications);
      setCalendarEvents(calendarRows);
      await refreshUnread();
      await refreshBilling();
      hasLoadedOnce.current = true;
    } catch {
      setLoadError(true);
      if (!hasLoadedOnce.current) {
        setCounts({
          openRoles: 0,
          fillInsPosted: 0,
          totalApplications: 0,
          newApplications: 0,
          openRolesWeekDelta: 0,
          fillInsWeekDelta: 0,
          applicationsWeekDelta: 0,
        });
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
  }, [clinicId, refreshBilling, refreshUnread, scopedLocationIds]);

  useRefreshOnFocus(loadDashboard);

  const handleShiftUpdated = useCallback(
    (updated: ShiftPost) => {
      setShifts((prev) => prev.map((shift) => (shift.id === updated.id ? updated : shift)));
      void refreshBilling();
    },
    [refreshBilling],
  );

  const handleShiftDeleted = useCallback(
    (shiftId: string) => {
      setShifts((prev) => prev.filter((shift) => shift.id !== shiftId));
      void refreshBilling();
    },
    [refreshBilling],
  );

  const handleJobUpdated = useCallback(
    (updated: JobPost) => {
      setJobs((prev) => prev.map((job) => (job.id === updated.id ? updated : job)));
      void loadDashboard();
      void refreshBilling();
    },
    [loadDashboard, refreshBilling],
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
      void refreshBilling();
    },
    [loadDashboard, refreshBilling],
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
  const groupName =
    groupDisplayName || organization?.name?.trim() || clinicName || 'Dental group';
  // Groups: person-first title; location lives in the scope switcher.
  // Individuals: clinic name as before.
  const heroDisplayName = !isProfileComplete
    ? null
    : isGroup
      ? memberDisplayName || null
      : clinicName;
  const heroSubtitle = !isProfileComplete
    ? 'Finish your clinic setup'
    : isGroup
      ? groupName
      : [clinicProfile?.city, clinicProfile?.province].filter(Boolean).join(', ') ||
        'Dental practice';
  const heroIdentityLine =
    isGroup && isProfileComplete && memberRoleLabel ? memberRoleLabel : undefined;
  const roleLimitReached = isBillingReady && isRolePostingLimitReached(billing);
  const fillInLimitReached = isBillingReady && isFillInPostingLimitReached(billing);

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

  const applicantPreviewByJobId = useMemo(
    () =>
      summarizeJobApplicantPreviews(
        applications.map((application) => ({
          job_post_id: application.job_post_id,
          worker_display_name: application.worker_display_name,
          worker_photo_storage_path: application.worker_photo_storage_path,
        })),
      ),
    [applications],
  );

  const attentionItems = useMemo(
    () =>
      buildClinicAttentionItems({
        newApplications: counts.newApplications,
        applicationUpdateCount,
        fillInUpdateCount,
        unreadConversations: conversations,
        applications,
        canUseCrmFollowups: Boolean(billing?.canUseCrmFollowups),
        onOpenApplications: () => router.push(CLINIC_APPLICATIONS),
        onOpenFillIns: () => router.push(CLINIC_FILL_INS),
        onOpenMessages: () => router.push(getClinicMessagesRoute()),
        onOpenConversation: openConversation,
        onOpenFollowUp: (application) => {
          router.push(getClinicApplicationRoute(application.id, 'dashboard-applications'));
        },
      }),
    [
      applicationUpdateCount,
      applications,
      billing?.canUseCrmFollowups,
      conversations,
      counts.newApplications,
      fillInUpdateCount,
      openConversation,
    ],
  );

  const upcomingCalendarEvents = useMemo(() => {
    const now = Date.now();
    return calendarEvents.filter((event) => new Date(event.startsAt).getTime() >= now);
  }, [calendarEvents]);

  const handleCalendarEventPress = useCallback((event: CalendarEvent) => {
    router.push(getClinicApplicationRoute(event.applicationId, 'dashboard-applications'));
  }, []);

  const heroPulse = useMemo(
    () =>
      isProfileComplete
        ? buildClinicHeroPulse({
            newApplications: counts.newApplications,
            upcomingEvents: upcomingCalendarEvents,
            unreadConversations: conversations,
            onOpenApplications: () => router.push(CLINIC_APPLICATIONS),
            onOpenEvent: handleCalendarEventPress,
            onOpenMessages: () => router.push(getClinicMessagesRoute()),
            onOpenConversation: openConversation,
          })
        : null,
    [
      conversations,
      counts.newApplications,
      handleCalendarEventPress,
      isProfileComplete,
      openConversation,
      upcomingCalendarEvents,
    ],
  );

  const showChecklist =
    isProfileComplete &&
    (counts.openRoles === 0 || counts.fillInsPosted === 0 || counts.totalApplications === 0);

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
            avatarKind={isGroup ? 'worker' : 'clinic'}
            displayName={heroDisplayName}
            photoUri={
              isProfileComplete
                ? isGroup
                  ? memberPhotoUri
                  : logoUri
                : null
            }
            namePlaceholder={
              isProfileComplete
                ? isGroup
                  ? 'Your profile'
                  : 'Your practice'
                : 'Welcome to Chairside'
            }
            subtitle={heroSubtitle}
            identityLine={heroIdentityLine}
            greetingName={isProfileComplete ? getFirstName(memberDisplayName) : null}
            pulse={heroPulse}
            hideProfileOnWebTablet
            contextSlot={
              isGroup && !isTablet ? (
                <ClinicLocationScopeSwitcher variant="hero" />
              ) : undefined
            }
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
      needsAttention={<DashboardNeedsAttention items={attentionItems} />}
      nextUp={
        <DashboardNextUp
          events={upcomingCalendarEvents}
          onEventPress={handleCalendarEventPress}
          onViewCalendar={() => router.push('/(clinic-tabs)/calendar' as Href)}
        />
      }
      quickActions={
        <FadeInSection delayMs={100}>
          <DashboardQuickActionsRow
            actions={[
              {
                label: 'Post a role',
                description: 'Full-time or part-time hire',
                icon: 'briefcase-outline',
                variant: 'primary',
                disabled: roleLimitReached,
                onPress: () => guardPosting(CLINIC_POST_JOB),
              },
              {
                label: 'Post fill-in',
                description: 'Temp or urgent shift',
                icon: 'calendar-outline',
                variant: 'secondary',
                disabled: fillInLimitReached,
                onPress: () => guardPosting(getPostShiftRoute('fill-ins-tab')),
              },
            ]}
          />
        </FadeInSection>
      }
      workspace={
        <FadeInSection delayMs={120}>
          <FileTabWell
            selected={selectedOverview}
            onSelect={setSelectedOverview}
            tabs={[
              {
                value: 'roles',
                label: 'Roles',
                count: counts.openRoles,
                accent: 'primary',
                icon: 'briefcase-outline',
              },
              {
                value: 'fill-ins',
                label: 'Fill-ins',
                count: counts.fillInsPosted,
                badgeCount: fillInUpdateCount,
                accent: 'secondary',
                icon: 'calendar-outline',
              },
              {
                value: 'applications',
                label: 'Applications',
                count: counts.totalApplications,
                badgeCount: applicationUpdateCount || counts.newApplications,
                accent: 'primary',
                icon: 'people-outline',
              },
            ]}>
            <DashboardOverviewPanel
              embedded
              selected={selectedOverview}
              applicantPreviewByJobId={applicantPreviewByJobId}
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
              onConfirmedFillInsUpdated={() => void loadDashboard()}
              onJobPress={(jobId) => router.push(getJobDetailRoute(jobId))}
              onJobApplicationsPress={(jobId) =>
                router.push(getClinicRoleApplicationsRoute(jobId, 'dashboard-applications'))
              }
              onViewAllPress={overviewViewAll}
            />
          </FileTabWell>
        </FadeInSection>
      }
      planUsage={
        billing && isBillingReady && billing.activeRoleLimit != null ? (
          <FadeInSection delayMs={140}>
            <DashboardPlanUsage
              label="Open roles"
              used={billing.activeRoleCount}
              limit={billing.activeRoleLimit}
              secondaryLabel="Fill-ins"
              secondaryUsed={billing.activeFillInCount}
              secondaryLimit={billing.activeFillInLimit}
            />
          </FadeInSection>
        ) : null
      }
      insights={
        clinicId ? (
          <FadeInSection delayMs={160}>
            <HiringInsightsPanel
              clinicId={clinicId}
              locationIds={Array.isArray(scopedLocationIds) ? scopedLocationIds : undefined}
              canUseHiringInsights={Boolean(billing?.canUseHiringInsights)}
              showLocationBreakdown={billing?.plan === 'group_pro'}
              lockedMessage={getClinicHiringInsightsUpgradeMessage(
                billing?.planFamily ?? (isGroup ? 'group' : 'clinic'),
              )}
              onUpgrade={() =>
                openClinicBillingModal({
                  focus: billing?.planFamily === 'group' || isGroup ? 'group' : 'clinic',
                })
              }
            />
          </FadeInSection>
        ) : null
      }
      checklist={
        showChecklist ? (
          <FadeInSection delayMs={180}>
            <ClinicReadinessChecklist
              clinicProfile={clinicProfile}
              fillInsPosted={counts.fillInsPosted}
              openRoles={counts.openRoles}
              totalApplications={counts.totalApplications}
              conversationCount={conversations.length}
              onPostFillIn={() => guardPosting(getPostShiftRoute('fill-ins-tab'))}
              onPostRole={() => guardPosting(CLINIC_POST_JOB)}
            />
          </FadeInSection>
        ) : null
      }
      messages={
        conversations.some((conversation) => conversation.unread) ? (
          <FadeInSection delayMs={200}>
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
    />
  );

  return (
    <DashboardScreen>
      {upgradePrompt}
      {isLoading && !hasLoadedOnce.current ? <DashboardLoadingShell /> : dashboardBody}
    </DashboardScreen>
  );
}
