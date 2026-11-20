import {
  getWorkerDashboardCounts,
  getWorkerSavedPostIds,
  listLiveJobPosts,
  listLiveShiftPosts,
  listWorkerAppliedJobPostIds,
  listWorkerShiftApplications,
  saveJobPost,
  saveShiftPost,
  unsaveJobPost,
  unsaveShiftPost,
  type LiveJobPost,
  type LiveShiftPost,
  type WorkerApplication,
  type WorkerDashboardCounts,
} from '@chairside/api';
import { getWorkerRoleTypes } from '@chairside/api';
import { formatRoleTypesLabel } from '@chairside/config';
import { router } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, View } from 'react-native';

import { DashboardWelcomeCelebration } from '@/components/celebration/DashboardWelcomeCelebration';
import { CoverageFeedSection } from '@/components/dashboard/CoverageFeedSection';
import { DashboardBodyLayout } from '@/components/dashboard/DashboardBodyLayout';
import { DashboardEmptyState } from '@/components/dashboard/DashboardEmptyState';
import { DashboardErrorBanner } from '@/components/dashboard/DashboardErrorBanner';
import { DashboardHero } from '@/components/dashboard/DashboardHero';
import { DashboardLoadingShell } from '@/components/dashboard/DashboardLoadingShell';
import { DashboardNeedsAttention } from '@/components/dashboard/DashboardNeedsAttention';
import { CoverageCardGrid } from '@/components/dashboard/CoverageCardGrid';
import { DashboardQuickActionsRow } from '@/components/dashboard/DashboardQuickActionsRow';
import { DashboardScreen } from '@/components/dashboard/DashboardScreen';
import { FadeInSection } from '@/components/dashboard/FadeInSection';
import { FillInAlertsNudgeCard } from '@/components/worker/FillInAlertsNudgeCard';
import { FillInListingCard } from '@/components/worker/FillInListingCard';
import { RoleListingCard } from '@/components/worker/RoleListingCard';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';
import { useApplicationTabBadge } from '@/contexts/ApplicationTabBadgeContext';
import { useAuth } from '@/contexts/AuthContext';
import { useGetStartedBrowseProgress } from '@/contexts/GetStartedBrowseProgressContext';
import { useWorkerProfile } from '@/contexts/WorkerProfileContext';
import { useDashboardWelcomeCelebration } from '@/hooks/useDashboardWelcomeCelebration';
import { useProfilePhoto } from '@/hooks/useProfilePhoto';
import { useRefreshOnFocus } from '@/hooks/useRefreshOnFocus';
import { buildWorkerAttentionItems } from '@/lib/dashboardAttention';
import { getWorkerOpenListExcludedShiftIds } from '@/lib/fillInFilters';
import { FILL_IN_ICON } from '@/lib/fillInIcons';
import { getFillInSmsStatus } from '@/lib/fillInAvailabilitySummary';
import { getFirstName } from '@/lib/greeting';
import {
  WORKER_APPLICATIONS,
  WORKER_BROWSE,
  WORKER_FILLINS,
  WORKER_PROFILE,
  WORKER_PROFILE_NOTIFICATIONS,
  getWorkerJobDetailRoute,
  getWorkerShiftDetailRoute,
} from '@/lib/routing';
import { useThemedStyles } from '@/theme';

const HOME_FILL_IN_PREVIEW = 5;
const HOME_ROLE_PREVIEW = 3;

export default function WorkerDashboardScreen() {
  const { user, profile } = useAuth();
  const { visible: welcomeVisible, dismiss: dismissWelcome } = useDashboardWelcomeCelebration({
    role: 'worker',
    userId: user?.id,
  });
  const { pendingCount: applicationUpdateCount, fillInPendingCount } = useApplicationTabBadge();
  const { workerProfile, isProfileComplete } = useWorkerProfile();
  const { photoUri } = useProfilePhoto();
  const { isTablet } = useResponsiveLayout();
  const province = workerProfile?.province ?? 'NS';
  const [counts, setCounts] = useState<WorkerDashboardCounts>({
    openRolesInProvince: 0,
    openFillInsInProvince: 0,
    pendingApplications: 0,
  });
  const [jobs, setJobs] = useState<LiveJobPost[]>([]);
  const [appliedJobPostIds, setAppliedJobPostIds] = useState<Set<string>>(new Set());
  const [savedJobIds, setSavedJobIds] = useState<Set<string>>(new Set());
  const [savedShiftIds, setSavedShiftIds] = useState<Set<string>>(new Set());
  const [shifts, setShifts] = useState<LiveShiftPost[]>([]);
  const [shiftApplications, setShiftApplications] = useState<WorkerApplication[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const hasLoadedOnce = useRef(false);
  const { markVisited: markGetStartedBrowseVisited } = useGetStartedBrowseProgress();

  const feedStyles = useThemedStyles(({ spacing }) => ({
    feedStack: {
      gap: spacing.xl,
      width: '100%',
    },
  }));

  const loadDashboard = useCallback(async () => {
    if (!user?.id) return;

    if (!hasLoadedOnce.current) {
      setIsLoading(true);
    }
    setLoadError(false);

    try {
      const [nextCounts, jobPosts, appliedJobIds, shiftPosts, shiftApplicationRows, savedPostIds] =
        await Promise.all([
          getWorkerDashboardCounts(user.id, province),
          listLiveJobPosts(province),
          listWorkerAppliedJobPostIds(user.id),
          listLiveShiftPosts(province),
          listWorkerShiftApplications(user.id),
          getWorkerSavedPostIds(user.id),
        ]);

      setCounts(nextCounts);
      setJobs(jobPosts);
      setAppliedJobPostIds(new Set(appliedJobIds));
      setSavedJobIds(savedPostIds.jobIds);
      setSavedShiftIds(savedPostIds.shiftIds);
      setShifts(shiftPosts);
      setShiftApplications(shiftApplicationRows);
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
        setShiftApplications([]);
      }
    } finally {
      setIsLoading(false);
    }
  }, [province, user?.id]);

  useRefreshOnFocus(loadDashboard);

  useEffect(() => {
    void markGetStartedBrowseVisited('fillIns');
  }, [markGetStartedBrowseVisited]);

  const openJobs = useMemo(
    () => jobs.filter((job) => !appliedJobPostIds.has(job.id)),
    [appliedJobPostIds, jobs],
  );

  const openShifts = useMemo(() => {
    const excludedShiftIds = getWorkerOpenListExcludedShiftIds(shiftApplications);
    return shifts.filter((shift) => !excludedShiftIds.has(shift.id));
  }, [shiftApplications, shifts]);

  const previewShifts = useMemo(
    () => openShifts.slice(0, HOME_FILL_IN_PREVIEW),
    [openShifts],
  );
  const previewJobs = useMemo(() => openJobs.slice(0, HOME_ROLE_PREVIEW), [openJobs]);

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

  const attentionItems = useMemo(
    () =>
      buildWorkerAttentionItems({
        applicationUpdateCount,
        fillInPendingCount,
        onOpenApplications: () => router.push(WORKER_APPLICATIONS),
        onOpenFillIns: () => router.push(WORKER_FILLINS),
      }),
    [applicationUpdateCount, fillInPendingCount],
  );

  const workerSubtitle =
    (workerProfile && formatRoleTypesLabel(getWorkerRoleTypes(workerProfile))) ||
    'Dental professional';

  const locationLine = [workerProfile?.city, workerProfile?.province]
    .filter(Boolean)
    .join(', ');

  const heroSubtitle = isProfileComplete
    ? [workerSubtitle, locationLine || null].filter(Boolean).join(' · ')
    : 'Finish your profile setup';

  const smsStatus = getFillInSmsStatus(workerProfile);
  const fillInCountLabel =
    openShifts.length === 1
      ? '1 open fill-in nearby'
      : `${openShifts.length} open fill-ins nearby`;
  const smsStatusLabel = smsStatus.smsActive
    ? 'Text alerts on'
    : smsStatus.smsNeedsPhone
      ? 'Add phone for texts'
      : smsStatus.fillInsOn
        ? 'Text alerts off'
        : null;
  const homeStatusLine = isProfileComplete
    ? [fillInCountLabel, smsStatusLabel].filter(Boolean).join(' · ')
    : null;

  const dashboardBody = (
    <DashboardBodyLayout
      hero={
        <FadeInSection delayMs={0}>
          <DashboardHero
            flush
            profileHref={WORKER_PROFILE}
            avatarKind="worker"
            displayName={isProfileComplete ? profile?.display_name : null}
            photoUri={isProfileComplete ? photoUri : null}
            namePlaceholder={isProfileComplete ? 'Your profile' : 'Welcome to Chairside'}
            subtitle={heroSubtitle}
            greetingName={isProfileComplete ? getFirstName(profile?.display_name) : null}
            statusLine={homeStatusLine}
            onStatusPress={
              smsStatusLabel && !smsStatus.smsActive
                ? () => router.push(WORKER_PROFILE_NOTIFICATIONS)
                : () => router.push(WORKER_FILLINS)
            }
            hideProfileOnWebTablet
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
        isProfileComplete ? (
          <FillInAlertsNudgeCard openFillInCount={counts.openFillInsInProvince} />
        ) : null
      }
      quickActions={
        isTablet ? null : (
          <FadeInSection delayMs={100}>
            <DashboardQuickActionsRow
              emphasizeFirst
              actions={[
                {
                  label: 'Find fill-ins',
                  description: 'Open shifts near you — request in a tap',
                  icon: FILL_IN_ICON.outline,
                  variant: 'secondary',
                  onPress: () => router.push(WORKER_FILLINS),
                },
                {
                  label: 'Browse roles',
                  description: 'See permanent openings nearby',
                  icon: 'briefcase-outline',
                  variant: 'primary',
                  onPress: () => router.push(WORKER_BROWSE),
                },
              ]}
            />
          </FadeInSection>
        )
      }
      workspace={
        <FadeInSection delayMs={120}>
          <View style={feedStyles.feedStack}>
            <CoverageFeedSection
              title="Open fill-ins near you"
              count={openShifts.length}
              accent="secondary"
              icon={FILL_IN_ICON.outline}
              onViewAll={() => router.push(WORKER_FILLINS)}>
              {previewShifts.length === 0 ? (
                <DashboardEmptyState
                  icon={FILL_IN_ICON.outline}
                  title="No open fill-ins yet"
                  message="We’ll text you when a shift opens near you."
                  accent="secondary"
                />
              ) : (
                <CoverageCardGrid>
                  {previewShifts.map((shift) => (
                    <FillInListingCard
                      key={shift.id}
                      shift={shift}
                      accent="secondary"
                      isSaved={savedShiftIds.has(shift.id)}
                      onToggleSaved={() =>
                        void handleToggleSavedShift(shift.id, !savedShiftIds.has(shift.id))
                      }
                      onPress={() =>
                        router.push(getWorkerShiftDetailRoute(shift.id, 'dashboard-fill-ins'))
                      }
                    />
                  ))}
                </CoverageCardGrid>
              )}
            </CoverageFeedSection>

            <CoverageFeedSection
              quiet
              title="Permanent openings"
              count={openJobs.length}
              accent="primary"
              icon="briefcase-outline"
              onViewAll={() => router.push(WORKER_BROWSE)}>
              {previewJobs.length === 0 ? (
                <DashboardEmptyState
                  icon="briefcase-outline"
                  title="No open roles yet"
                  message="New roles in your province will appear here when clinics post them."
                />
              ) : (
                <CoverageCardGrid>
                  {previewJobs.map((job) => (
                    <RoleListingCard
                      key={job.id}
                      job={job}
                      isSaved={savedJobIds.has(job.id)}
                      onToggleSaved={() =>
                        void handleToggleSavedJob(job.id, !savedJobIds.has(job.id))
                      }
                      onPress={() =>
                        router.push(getWorkerJobDetailRoute(job.id, 'dashboard-roles'))
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
        role="worker"
        onDismiss={() => void dismissWelcome()}
      />
      {isLoading && !hasLoadedOnce.current ? <DashboardLoadingShell /> : dashboardBody}
    </DashboardScreen>
  );
}
