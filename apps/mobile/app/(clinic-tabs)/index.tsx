import {
  getClinicDashboardCounts,
  getJobPostApplicationCountsMap,
  getShiftPostApplicationCount,
  getShiftPostPendingApplicationCountsMap,
  listClinicApplications,
  listClinicCalendarEvents,
  listClinicInvitations,
  listClinicMemberships,
  listConversationsForClinic,
  listJobPosts,
  listShiftPosts,
  type CalendarEvent,
  type ClinicApplication,
  type ClinicDashboardCounts,
  type Conversation,
  type JobPost,
  type ShiftPost,
} from '@chairside/api';
import type { Href } from 'expo-router';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View } from 'react-native';

import { DashboardWelcomeCelebration } from '@/components/celebration/DashboardWelcomeCelebration';
import {
  DashboardOverviewPanel,
  type OverviewStat,
} from '@/components/clinic/ClinicCards';
import { ClinicReadinessChecklist } from '@/components/clinic/ClinicReadinessChecklist';
import { GroupLocationsGlanceWidget } from '@/components/clinic/GroupLocationsGlanceWidget';
import { GroupTeamPulseWidget } from '@/components/clinic/GroupTeamPulseWidget';
import { GroupWeekCoverageWidget } from '@/components/clinic/GroupWeekCoverageWidget';
import { HiringInsightsPanel } from '@/components/clinic/HiringInsightsPanel';
import { ClinicLocationScopeSwitcher } from '@/components/clinic/ClinicLocationScopeSwitcher';
import { DashboardBodyLayout } from '@/components/dashboard/DashboardBodyLayout';
import { DashboardErrorBanner } from '@/components/dashboard/DashboardErrorBanner';
import { DashboardHero } from '@/components/dashboard/DashboardHero';
import { DashboardLoadingShell } from '@/components/dashboard/DashboardLoadingShell';
import { DashboardNeedsAttention } from '@/components/dashboard/DashboardNeedsAttention';
import { DashboardCalendarWidget } from '@/components/dashboard/DashboardCalendarWidget';
import { DashboardPlanUsage } from '@/components/dashboard/DashboardPlanUsage';
import { DashboardQuickActionsRow } from '@/components/dashboard/DashboardQuickActionsRow';
import { DashboardScreen } from '@/components/dashboard/DashboardScreen';
import { FileTabWell } from '@/components/dashboard/FileTabWell';
import { FadeInSection } from '@/components/dashboard/FadeInSection';
import { DashboardMessagesWidget } from '@/components/messaging/DashboardMessagesWidget';
import { useApplicationTabBadge } from '@/contexts/ApplicationTabBadgeContext';
import { useAuth } from '@/contexts/AuthContext';
import { useClinicProfile } from '@/contexts/ClinicProfileContext';
import { useFillInPending } from '@/contexts/FillInPendingContext';
import { useMessageUnread } from '@/contexts/MessageUnreadContext';
import { useDashboardWelcomeCelebration } from '@/hooks/useDashboardWelcomeCelebration';
import { useClinicActingContext } from '@/hooks/useClinicActingContext';
import { openClinicBillingModal } from '@/components/billing/ClinicBillingModal';
import { useClinicUpgradePrompt } from '@/hooks/useClinicUpgradePrompt';
import { useRefreshOnFocus } from '@/hooks/useRefreshOnFocus';
import { useClinicLogo } from '@/hooks/useClinicLogo';
import { useClinicMemberPhoto } from '@/hooks/useClinicMemberPhoto';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';
import {
  buildClinicAttentionItems,
  summarizeJobApplicantPreviews,
} from '@/lib/dashboardAttention';
import { getClinicDashboardHeroNaming } from '@/lib/clinicDashboardHeroNaming';
import { guardClinicPosting } from '@/lib/clinicPostingGuard';
import { FILL_IN_ICON } from '@/lib/fillInIcons';
import { buildClinicHeroPulse } from '@/lib/dashboardPulse';
import { sortDashboardApplications } from '@/lib/applicationPipeline';
import { isDecidedApplicationStatus } from '@chairside/config';
import {
  isFillInPostingLimitReached,
  isRolePostingLimitReached,
} from '@/lib/clinicPlanPresentation';
import { getMessageThreadPreview } from '@/lib/conversationDisplay';
import {
  buildLocationGlanceRows,
  buildTeamPulseCounts,
  buildWeekCoverageRows,
  type TeamPulseCounts,
} from '@/lib/groupDashboardMetrics';
import {
  CLINIC_APPLICATIONS,
  CLINIC_FILL_INS,
  CLINIC_POSTINGS,
  CLINIC_POST_JOB,
  CLINIC_PROFILE,
  CLINIC_PROFILE_TEAM,
  getClinicApplicationRoute,
  getClinicMessagesRoute,
  getClinicRoleApplicationsRoute,
  getConversationMessagesRoute,
  getJobDetailRoute,
  getPostShiftRoute,
} from '@/lib/routing';

export default function ClinicDashboardScreen() {
  const { user } = useAuth();
  const { visible: welcomeVisible, dismiss: dismissWelcome } = useDashboardWelcomeCelebration({
    role: 'clinic',
    userId: user?.id,
  });
  const { refreshUnread } = useMessageUnread();
  const { pendingCount: fillInUpdateCount } = useFillInPending();
  const { pendingCount: applicationUpdateCount, isApplicationHighlighted } =
    useApplicationTabBadge();
  const { clinicProfile, isProfileComplete, locations, organization } = useClinicProfile();
  const {
    clinicId,
    scopedLocationIds,
    isGroup,
    isOwner,
    memberDisplayName,
    memberRoleLabel,
    groupDisplayName,
    locationScope,
    accessibleLocations,
    setLocationScope,
  } = useClinicActingContext();
  const { isTablet } = useResponsiveLayout();
  const {
    billing,
    isBillingReady,
    isHealingSubscription,
    revenueCatPlan,
    refreshBilling,
    upgradePrompt,
  } = useClinicUpgradePrompt();
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
  const [selectedOverview, setSelectedOverview] = useState<OverviewStat>('fill-ins');
  const [jobs, setJobs] = useState<JobPost[]>([]);
  const [shifts, setShifts] = useState<ShiftPost[]>([]);
  const [applicantCounts, setApplicantCounts] = useState<Record<string, number>>({});
  const [shiftPendingCounts, setShiftPendingCounts] = useState<Record<string, number>>({});
  const [shiftApplicationCounts, setShiftApplicationCounts] = useState<Record<string, number>>({});
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const [applications, setApplications] = useState<ClinicApplication[]>([]);
  const [teamPulse, setTeamPulse] = useState<TeamPulseCounts>({
    pendingInvites: 0,
    unassignedManagers: 0,
  });
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
        counts,
        pendingShiftCounts,
        conversationRows,
        clinicApplications,
        calendarRows,
      ] = await Promise.all([
        getClinicDashboardCounts(clinicId, { locationIds: scopedLocationIds }),
        listJobPosts(clinicId, { locationIds: scopedLocationIds }),
        listShiftPosts(clinicId, { locationIds: scopedLocationIds }),
        getJobPostApplicationCountsMap(clinicId, { locationIds: scopedLocationIds }),
        getShiftPostPendingApplicationCountsMap(clinicId, {
          locationIds: scopedLocationIds,
        }),
        listConversationsForClinic(clinicId, { locationIds: scopedLocationIds }),
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
      setApplicantCounts(counts);
      setShiftPendingCounts(pendingShiftCounts);
      setShiftApplicationCounts(Object.fromEntries(shiftApplicationCountEntries));
      setConversations(conversationRows);
      setApplications(clinicApplications);
      setCalendarEvents(calendarRows);

      if (isGroup && isOwner) {
        try {
          const [invitations, memberships] = await Promise.all([
            listClinicInvitations(clinicId),
            listClinicMemberships(clinicId),
          ]);
          setTeamPulse(buildTeamPulseCounts({ invitations, memberships }));
        } catch {
          setTeamPulse({ pendingInvites: 0, unassignedManagers: 0 });
        }
      } else {
        setTeamPulse({ pendingInvites: 0, unassignedManagers: 0 });
      }

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
        setApplicantCounts({});
        setShiftPendingCounts({});
        setShiftApplicationCounts({});
        setConversations([]);
        setTeamPulse({ pendingInvites: 0, unassignedManagers: 0 });
      }
    } finally {
      setIsLoading(false);
    }
  }, [clinicId, isGroup, isOwner, refreshBilling, refreshUnread, scopedLocationIds]);

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
    guardClinicPosting({
      isProfileComplete,
      clinicProfile,
      locations,
      isGroup,
      target,
      onAllowed: (href) => router.push(href),
    });
  };

  const clinicName = clinicProfile?.clinic_name?.trim() || null;
  const groupName =
    groupDisplayName || organization?.name?.trim() || clinicName || 'Dental group';
  const {
    greetingName: heroGreetingName,
    displayName: heroDisplayName,
    namePlaceholder: heroNamePlaceholder,
    subtitle: heroSubtitle,
    identityLine: heroIdentityLine,
  } = getClinicDashboardHeroNaming({
    isGroup,
    isProfileComplete,
    clinicName,
    groupName,
    memberDisplayName,
    memberRoleLabel,
    contactName: clinicProfile?.contact_name,
    locationScope,
    accessibleLocations,
    clinicCity: clinicProfile?.city,
    clinicProvince: clinicProfile?.province,
  });
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
          id: application.id,
          job_post_id: application.job_post_id,
          worker_display_name: application.worker_display_name,
          worker_photo_storage_path: application.worker_photo_storage_path,
        })),
      ),
    [applications],
  );

  const dashboardApplications = useMemo(
    () =>
      sortDashboardApplications(
        applications.filter((application) => !isDecidedApplicationStatus(application.status)),
        isApplicationHighlighted,
      ),
    [applications, isApplicationHighlighted],
  );

  const attentionItems = useMemo(
    () =>
      buildClinicAttentionItems({
        newApplications: counts.newApplications,
        applicationUpdateCount,
        fillInUpdateCount,
        applications,
        canUseCrmFollowups: Boolean(billing?.canUseCrmFollowups),
        onOpenApplications: () => router.push(CLINIC_APPLICATIONS),
        onOpenFillIns: () => router.push(CLINIC_FILL_INS),
        onOpenFollowUp: (application) => {
          router.push(getClinicApplicationRoute(application.id, 'dashboard-applications'));
        },
      }),
    [
      applicationUpdateCount,
      applications,
      billing?.canUseCrmFollowups,
      counts.newApplications,
      fillInUpdateCount,
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
            onOpenApplications: () => router.push(CLINIC_APPLICATIONS),
          })
        : null,
    [counts.newApplications, isProfileComplete],
  );

  // Incomplete profiles need the checklist most — it owns the setup CTA.
  // Once complete, keep it while early hiring steps are still open.
  const showChecklist =
    !isProfileComplete ||
    counts.openRoles === 0 ||
    counts.fillInsPosted === 0 ||
    counts.totalApplications === 0;

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

  const locationGlanceRows = useMemo(() => {
    if (!isGroup || locationScope !== 'all' || accessibleLocations.length < 2) {
      return [];
    }
    return buildLocationGlanceRows({
      locations: accessibleLocations,
      jobs,
      shifts,
      applications,
    });
  }, [accessibleLocations, applications, isGroup, jobs, locationScope, shifts]);

  const weekCoverageRows = useMemo(() => {
    if (isGroup) {
      return buildWeekCoverageRows({
        locations: accessibleLocations,
        shifts,
        locationIdFilter: locationScope === 'all' ? null : locationScope,
      });
    }

    if (!clinicId) return [];

    const practiceLocations =
      accessibleLocations.length > 0
        ? accessibleLocations
        : [
            {
              id: clinicId,
              name: clinicProfile?.clinic_name?.trim() || 'Your practice',
              city: clinicProfile?.city ?? null,
              province: clinicProfile?.province ?? null,
              logo_storage_path: clinicProfile?.logo_storage_path ?? null,
            },
          ];

    return buildWeekCoverageRows({
      locations: practiceLocations,
      shifts,
      fallbackLocationId: accessibleLocations.length === 0 ? clinicId : null,
    });
  }, [
    accessibleLocations,
    clinicId,
    clinicProfile?.city,
    clinicProfile?.clinic_name,
    clinicProfile?.logo_storage_path,
    clinicProfile?.province,
    isGroup,
    locationScope,
    shifts,
  ]);

  const focusLocation = useCallback(
    (locationId: string) => {
      if (isGroup) {
        setLocationScope(locationId);
        return;
      }
      router.push(CLINIC_FILL_INS);
    },
    [isGroup, setLocationScope],
  );

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
            namePlaceholder={heroNamePlaceholder}
            subtitle={heroSubtitle}
            identityLine={heroIdentityLine}
            greetingName={heroGreetingName}
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
      needsAttention={
        attentionItems.length > 0 ? (
          <DashboardNeedsAttention items={attentionItems} />
        ) : null
      }
      alerts={
        locationGlanceRows.length > 0 ? (
          <FadeInSection delayMs={40}>
            <GroupLocationsGlanceWidget
              rows={locationGlanceRows}
              onSelectLocation={focusLocation}
            />
          </FadeInSection>
        ) : null
      }
      calendar={
        <FadeInSection delayMs={60}>
          <DashboardCalendarWidget
            events={upcomingCalendarEvents}
            onEventPress={handleCalendarEventPress}
            onViewAllPress={() => router.push('/(clinic-tabs)/calendar' as Href)}
          />
        </FadeInSection>
      }
      coverage={
        <FadeInSection delayMs={80}>
          <GroupWeekCoverageWidget
            rows={weekCoverageRows}
            onSelectLocation={focusLocation}
          />
        </FadeInSection>
      }
      quickActions={
        <FadeInSection delayMs={100}>
          <DashboardQuickActionsRow
            actions={[
              {
                label: 'Post fill-in',
                description: 'Temp or urgent shift',
                icon: FILL_IN_ICON.outline,
                variant: 'secondary',
                disabled: fillInLimitReached,
                onPress: () => guardPosting(getPostShiftRoute('fill-ins-tab')),
              },
              {
                label: 'Post a role',
                description: 'Full-time or part-time hire',
                icon: 'briefcase-outline',
                variant: 'primary',
                disabled: roleLimitReached,
                onPress: () => guardPosting(CLINIC_POST_JOB),
              },
            ]}
          />
        </FadeInSection>
      }
      workspace={
        <FadeInSection delayMs={120}>
          <FileTabWell
            variant="dashboard"
            selected={selectedOverview}
            onSelect={setSelectedOverview}
            tabs={[
              {
                value: 'fill-ins',
                label: 'Fill-ins',
                count: counts.fillInsPosted,
                badgeCount: fillInUpdateCount,
                accent: 'secondary',
                icon: FILL_IN_ICON.outline,
              },
              {
                value: 'roles',
                label: 'Roles',
                count: counts.openRoles,
                accent: 'primary',
                icon: 'briefcase-outline',
              },
              {
                value: 'applications',
                label: 'Applications',
                count: counts.totalApplications,
                badgeCount: applicationUpdateCount || counts.newApplications,
                accent: 'tertiary',
                icon: 'people-outline',
              },
            ]}>
            <DashboardOverviewPanel
              embedded
              selected={selectedOverview}
              applicantPreviewByJobId={applicantPreviewByJobId}
              jobs={jobs}
              shifts={shifts}
              applications={dashboardApplications}
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
              onApplicantPress={(applicationId, jobId) =>
                router.push(
                  getClinicApplicationRoute(applicationId, 'dashboard-applications', jobId),
                )
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
              label="Fill-ins"
              used={billing.activeFillInCount}
              limit={billing.activeFillInLimit}
              secondaryLabel="Open roles"
              secondaryUsed={billing.activeRoleCount}
              secondaryLimit={billing.activeRoleLimit}
              syncNotice={
                isHealingSubscription ||
                (revenueCatPlan != null &&
                  revenueCatPlan !== 'free' &&
                  billing.plan === 'free')
                  ? 'Subscription found — refreshing…'
                  : null
              }
              onViewPlansPress={() =>
                openClinicBillingModal({
                  focus: billing.planFamily === 'group' || isGroup ? 'group' : 'clinic',
                })
              }
            />
          </FadeInSection>
        ) : null
      }
      insights={
        clinicId && billing?.canUseHiringInsights ? (
          <FadeInSection delayMs={160}>
            <HiringInsightsPanel
              clinicId={clinicId}
              locationIds={Array.isArray(scopedLocationIds) ? scopedLocationIds : undefined}
              canUseHiringInsights
              showLocationBreakdown={billing.plan === 'group_pro'}
            />
          </FadeInSection>
        ) : null
      }
      checklist={
        showChecklist ? (
          <FadeInSection delayMs={180}>
            <ClinicReadinessChecklist
              clinicProfile={clinicProfile}
              locations={accessibleLocations}
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
        <FadeInSection delayMs={200}>
          <DashboardMessagesWidget
            conversations={conversations}
            avatarKind="worker"
            role="clinic"
            onConversationPress={openConversation}
            onViewAllPress={() => router.push(getClinicMessagesRoute())}
          />
        </FadeInSection>
      }
      teamPulse={
        isGroup && isOwner ? (
          <FadeInSection delayMs={220}>
            <GroupTeamPulseWidget
              counts={teamPulse}
              onPress={() => router.push(CLINIC_PROFILE_TEAM)}
            />
          </FadeInSection>
        ) : null
      }
    />
  );

  return (
    <DashboardScreen>
      <DashboardWelcomeCelebration
        visible={welcomeVisible}
        role="clinic"
        isGroup={isGroup}
        onDismiss={() => void dismissWelcome()}
      />
      {upgradePrompt}
      {isLoading && !hasLoadedOnce.current ? <DashboardLoadingShell /> : dashboardBody}
    </DashboardScreen>
  );
}
