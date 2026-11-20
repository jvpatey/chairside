import {
  getClinicDashboardCounts,
  getJobPostApplicationCountsMap,
  getJobPostListingViewCountsMap,
  getShiftPostApplicationCount,
  getShiftPostListingViewCountsMap,
  getShiftPostPendingApplicationCountsMap,
  listClinicApplications,
  listClinicInvitations,
  listClinicMemberships,
  listJobPosts,
  listShiftPosts,
  type ClinicApplication,
  type ClinicDashboardCounts,
  type JobPost,
  type ShiftPost,
} from '@chairside/api';
import type { Href } from 'expo-router';
import { router } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View } from 'react-native';

import { DashboardWelcomeCelebration } from '@/components/celebration/DashboardWelcomeCelebration';
import { CardInfoPanel, CardInfoPanelText } from '@/components/ui/CardInfoPanel';
import { GroupLocationsGlanceWidget } from '@/components/clinic/GroupLocationsGlanceWidget';
import { ClinicLocationScopeSwitcher } from '@/components/clinic/ClinicLocationScopeSwitcher';
import { DashboardBodyLayout } from '@/components/dashboard/DashboardBodyLayout';
import { DashboardErrorBanner } from '@/components/dashboard/DashboardErrorBanner';
import { DashboardHero } from '@/components/dashboard/DashboardHero';
import { DashboardLoadingShell } from '@/components/dashboard/DashboardLoadingShell';
import { DashboardNeedsAttention } from '@/components/dashboard/DashboardNeedsAttention';
import { CoverageFeedSection } from '@/components/dashboard/CoverageFeedSection';
import { DashboardEmptyState } from '@/components/dashboard/DashboardEmptyState';
import { DashboardQuickActionsRow } from '@/components/dashboard/DashboardQuickActionsRow';
import { DashboardScreen } from '@/components/dashboard/DashboardScreen';
import { FadeInSection } from '@/components/dashboard/FadeInSection';
import { FillInPostingCard } from '@/components/clinic/FillInPostingCard';
import { RolePostingCard } from '@/components/clinic/RolePostingCard';
import { CoverageCardGrid } from '@/components/dashboard/CoverageCardGrid';
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
import {
  getManagerAccessBannerCopy,
  getManagerAccessBlockReason,
  getOwnerUnassignedManagersCopy,
} from '@/lib/clinicManagerAccess';
import { guardClinicPosting } from '@/lib/clinicPostingGuard';
import { FILL_IN_ICON } from '@/lib/fillInIcons';
import { isTodayOrUpcomingShiftDate } from '@/lib/fillInFilters';
import { isMainListJob } from '@/lib/postingFilters';
import { useThemedStyles } from '@/theme';
import {
  isClinicBillingFeatureUnlocked,
  isFillInPostingLimitReached,
  isRolePostingLimitReached,
} from '@/lib/clinicPlanPresentation';
import {
  buildLocationGlanceRows,
  buildTeamPulseCounts,
  type TeamPulseCounts,
} from '@/lib/groupDashboardMetrics';
import {
  CLINIC_APPLICATIONS,
  CLINIC_FILL_INS,
  CLINIC_POSTINGS,
  CLINIC_POST_JOB,
  CLINIC_PROFILE,
  getClinicApplicationRoute,
  getClinicRoleApplicationsRoute,
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
  const { pendingCount: applicationUpdateCount } = useApplicationTabBadge();
  const { clinicProfile, isProfileComplete, locations, organization, membership } =
    useClinicProfile();
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
  const [counts, setCounts] = useState<ClinicDashboardCounts>({
    openRoles: 0,
    fillInsPosted: 0,
    totalApplications: 0,
    newApplications: 0,
    openRolesWeekDelta: 0,
    fillInsWeekDelta: 0,
    applicationsWeekDelta: 0,
  });
  const [jobs, setJobs] = useState<JobPost[]>([]);
  const [expandedHomeShiftId, setExpandedHomeShiftId] = useState<string | null>(null);
  const feedStyles = useThemedStyles(({ spacing }) => ({
    feedStack: {
      gap: spacing.xl,
      width: '100%',
    },
  }));
  const [shifts, setShifts] = useState<ShiftPost[]>([]);
  const [applicantCounts, setApplicantCounts] = useState<Record<string, number>>({});
  const [jobViewCounts, setJobViewCounts] = useState<Record<string, number>>({});
  const [shiftPendingCounts, setShiftPendingCounts] = useState<Record<string, number>>({});
  const [shiftApplicationCounts, setShiftApplicationCounts] = useState<Record<string, number>>({});
  const [shiftViewCounts, setShiftViewCounts] = useState<Record<string, number>>({});
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
        clinicApplications,
      ] = await Promise.all([
        getClinicDashboardCounts(clinicId, { locationIds: scopedLocationIds }),
        listJobPosts(clinicId, { locationIds: scopedLocationIds }),
        listShiftPosts(clinicId, { locationIds: scopedLocationIds }),
        getJobPostApplicationCountsMap(clinicId, { locationIds: scopedLocationIds }),
        getShiftPostPendingApplicationCountsMap(clinicId, {
          locationIds: scopedLocationIds,
        }),
        listClinicApplications(clinicId, 'active', { locationIds: scopedLocationIds }),
      ]);

      const shiftApplicationCountEntries = await Promise.all(
        shiftPosts.map(async (shift) => {
          const count = await getShiftPostApplicationCount(clinicId, shift.id);
          return [shift.id, count] as const;
        }),
      );
      const [jobViews, shiftViews] = await Promise.all([
        getJobPostListingViewCountsMap(jobPosts.map((job) => job.id)),
        getShiftPostListingViewCountsMap(shiftPosts.map((shift) => shift.id)),
      ]);

      setCounts(nextCounts);
      setJobs(jobPosts);
      setShifts(shiftPosts);
      setApplicantCounts(counts);
      setJobViewCounts(jobViews);
      setShiftPendingCounts(pendingShiftCounts);
      setShiftApplicationCounts(Object.fromEntries(shiftApplicationCountEntries));
      setShiftViewCounts(shiftViews);
      setApplications(clinicApplications);

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

  const assignedLocationIds =
    membership?.location_ids?.length
      ? membership.location_ids
      : locations.map((location) => location.id).filter(Boolean);

  const guardPosting = (target: Href) => {
    guardClinicPosting({
      isProfileComplete,
      clinicProfile,
      locations,
      isGroup,
      isOwner,
      assignedLocationIds,
      target,
      onAllowed: (href) => router.push(href),
    });
  };

  const clinicName = clinicProfile?.clinic_name?.trim() || null;
  const managerAccessReason = getManagerAccessBlockReason({
    isGroup,
    isOwner,
    clinicProfile,
    locations,
    assignedLocationIds,
  });
  const managerAccessCopy = managerAccessReason
    ? getManagerAccessBannerCopy(managerAccessReason)
    : null;
  const ownerUnassignedCopy =
    isGroup && isOwner && teamPulse.unassignedManagers > 0
      ? getOwnerUnassignedManagersCopy(teamPulse.unassignedManagers)
      : null;
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

  const attentionItems = useMemo(
    () =>
      buildClinicAttentionItems({
        newApplications: counts.newApplications,
        applicationUpdateCount,
        fillInUpdateCount,
        applications,
        canUseCrmFollowups: isClinicBillingFeatureUnlocked(
          billing,
          isBillingReady,
          'canUseCrmFollowups',
        ),
        onOpenApplications: () => router.push(CLINIC_APPLICATIONS),
        onOpenFillIns: () => router.push(CLINIC_FILL_INS),
        onOpenFollowUp: (application) => {
          router.push(getClinicApplicationRoute(application.id, 'dashboard-applications'));
        },
      }),
    [
      applicationUpdateCount,
      applications,
      billing,
      isBillingReady,
      counts.newApplications,
      fillInUpdateCount,
    ],
  );

  const liveHomeShifts = useMemo(
    () =>
      shifts
        .filter((shift) => shift.status === 'live' && isTodayOrUpcomingShiftDate(shift.shift_date))
        .slice(0, 5),
    [shifts],
  );
  const liveHomeRoles = useMemo(() => jobs.filter(isMainListJob).slice(0, 3), [jobs]);

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
            flush
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
            statusLine={
              isProfileComplete
                ? liveHomeShifts.length === 1
                  ? '1 open fill-in needs coverage'
                  : `${liveHomeShifts.length} open fill-ins · Post when you need cover`
                : null
            }
            onStatusPress={() => router.push(CLINIC_FILL_INS)}
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
        managerAccessCopy || ownerUnassignedCopy || locationGlanceRows.length > 0 ? (
          <FadeInSection delayMs={40}>
            <View style={{ gap: 12 }}>
              {managerAccessCopy ? (
                <CardInfoPanel
                  variant="info"
                  icon="information-circle-outline"
                  title={managerAccessCopy.title}>
                  <CardInfoPanelText>{managerAccessCopy.message}</CardInfoPanelText>
                </CardInfoPanel>
              ) : null}
              {ownerUnassignedCopy ? (
                <CardInfoPanel
                  variant="info"
                  icon="people-outline"
                  title={ownerUnassignedCopy.title}>
                  <CardInfoPanelText>{ownerUnassignedCopy.message}</CardInfoPanelText>
                  <CardInfoPanelText>
                    Open Team & access from Settings to assign clinics.
                  </CardInfoPanelText>
                </CardInfoPanel>
              ) : null}
              {locationGlanceRows.length > 0 ? (
                <GroupLocationsGlanceWidget
                  rows={locationGlanceRows}
                  onSelectLocation={focusLocation}
                />
              ) : null}
            </View>
          </FadeInSection>
        ) : null
      }
      quickActions={
        <FadeInSection delayMs={100}>
          <DashboardQuickActionsRow
            emphasizeFirst
            actions={[
              {
                label: 'Post fill-in',
                description: 'We’ll text matching professionals',
                icon: FILL_IN_ICON.outline,
                variant: 'secondary',
                disabled: fillInLimitReached,
                onPress: () => guardPosting(getPostShiftRoute('fill-ins-tab')),
              },
              {
                label: 'Post a role',
                description: 'Alert matched candidates',
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
          <View style={feedStyles.feedStack}>
            <CoverageFeedSection
              title="Needs response"
              count={liveHomeShifts.length}
              accent="secondary"
              icon={FILL_IN_ICON.outline}
              onViewAll={() => router.push(CLINIC_FILL_INS)}>
              {liveHomeShifts.length === 0 ? (
                <DashboardEmptyState
                  icon={FILL_IN_ICON.outline}
                  title="No open fill-ins"
                  message="Post a fill-in and we’ll text matching professionals."
                  accent="secondary"
                />
              ) : (
                <CoverageCardGrid>
                  {liveHomeShifts.map((shift) => (
                    <FillInPostingCard
                      key={shift.id}
                      shift={shift}
                      pendingRequestCount={shiftPendingCounts[shift.id] ?? 0}
                      applicationCount={shiftApplicationCounts[shift.id] ?? 0}
                      viewCount={shiftViewCounts[shift.id] ?? 0}
                      clinicId={clinicId ?? undefined}
                      returnTo="dashboard-fill-ins"
                      accent="secondary"
                      expanded={expandedHomeShiftId === shift.id}
                      onExpandChange={(next) =>
                        setExpandedHomeShiftId(next ? shift.id : null)
                      }
                      onShiftUpdated={handleShiftUpdated}
                      onShiftDeleted={() => handleShiftDeleted(shift.id)}
                    />
                  ))}
                </CoverageCardGrid>
              )}
            </CoverageFeedSection>

            <CoverageFeedSection
              quiet
              title="Permanent openings"
              count={liveHomeRoles.length}
              accent="primary"
              icon="briefcase-outline"
              onViewAll={() => router.push(CLINIC_POSTINGS)}>
              {liveHomeRoles.length === 0 ? (
                <DashboardEmptyState
                  icon="briefcase-outline"
                  title="No active roles yet"
                  message="Post a role to alert matched professionals."
                />
              ) : (
                <CoverageCardGrid>
                  {liveHomeRoles.map((job) => (
                    <RolePostingCard
                      key={job.id}
                      job={job}
                      applicants={applicantPreviewByJobId?.[job.id]}
                      applicantCount={applicantCounts?.[job.id] ?? 0}
                      viewCount={jobViewCounts[job.id] ?? 0}
                      onPress={() => router.push(getJobDetailRoute(job.id))}
                      onApplicantsPress={() =>
                        router.push(getClinicRoleApplicationsRoute(job.id, 'postings-tab'))
                      }
                      onApplicantPress={(applicationId) =>
                        router.push(
                          getClinicApplicationRoute(applicationId, 'postings-tab', job.id),
                        )
                      }
                      manage={
                        clinicId
                          ? {
                              clinicId,
                              onUpdated: handleJobUpdated,
                              onDeleted: () => handleJobDeleted(job.id),
                            }
                          : undefined
                      }
                    />
                  ))}
                </CoverageCardGrid>
              )}
            </CoverageFeedSection>
          </View>
        </FadeInSection>
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
