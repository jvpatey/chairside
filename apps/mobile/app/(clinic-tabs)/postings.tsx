import {
  getMissingClinicProfileFields,
  listClinicApplications,
  listJobPosts,
  getJobPostApplicationCountsMap,
  type ClinicApplication,
  type JobPost,
} from '@chairside/api';
import { Ionicons } from '@expo/vector-icons';
import type { Href } from 'expo-router';
import { router, useLocalSearchParams } from 'expo-router';
import {
  CLINIC_FILL_INS,
  CLINIC_POST_JOB,
  CLINIC_SETUP_BASICS,
  getClinicDiscoverRoute,
  getClinicRoleApplicationsRoute,
  getClinicApplicationRoute,
  getJobDetailRoute,
  getRoleHistoryRoute,
} from '@/lib/routing';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, View } from 'react-native';

import { RoleTypeFilters } from '@/components/clinic/PostingFilters';
import { FileTabWell } from '@/components/dashboard/FileTabWell';
import { RolePostingCard } from '@/components/clinic/RolePostingCard';
import { PlanUpgradeCallout } from '@/components/billing/PlanUpgradeCallout';
import { DashboardErrorBanner } from '@/components/dashboard/DashboardErrorBanner';
import { DashboardQuickActionTile } from '@/components/dashboard/DashboardQuickActionTile';
import { DashboardSectionHeader } from '@/components/dashboard/DashboardSectionHeader';
import { ListSearchFilterRow } from '@/components/ui/ListSearchFilterRow';
import { dashboardSectionGap } from '@/components/dashboard/dashboardLayout';
import { EmptyState } from '@/components/ui/EmptyState';
import { PageLoadingList } from '@/components/ui/PageLoadingState';
import { ResponsiveGrid } from '@/components/ui/ResponsiveLayout';
import { Screen } from '@/components/ui/Screen';
import { ClinicDiscoverBrowseLink } from '@/components/clinic/ClinicDiscoverBrowseLink';
import { BrowseListGroup } from '@/components/ui/BrowseListGroup';
import { BrowseListRow } from '@/components/ui/BrowseListRow';
import { useAuth } from '@/contexts/AuthContext';
import { useClinicProfile } from '@/contexts/ClinicProfileContext';
import { useClinicActingContext } from '@/hooks/useClinicActingContext';
import { useClinicUpgradePrompt } from '@/hooks/useClinicUpgradePrompt';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';
import { usePullToRefresh } from '@/hooks/usePullToRefresh';
import { useRefreshOnFocus } from '@/hooks/useRefreshOnFocus';
import {
  countHistoryJobs,
  filterJobPostsForMainList,
  type JobStatusFilter,
  type RoleTypeFilter,
} from '@/lib/postingFilters';
import { hasActiveListSearch, matchesJobPostSearch } from '@/lib/clinicListSearch';
import { summarizeJobApplicantPreviews } from '@/lib/dashboardAttention';
import {
  getClinicPostingLimitReachedMessage,
  getClinicPostingLimitTitle,
  isRolePostingLimitReached,
} from '@/lib/clinicPlanPresentation';
import { useTheme, useThemedStyles } from '@/theme';

export default function ClinicPostingsScreen() {
  const { colors } = useTheme();
  const { isTablet } = useResponsiveLayout();
  const { user } = useAuth();
  const { clinicId, scopedLocationIds } = useClinicActingContext();
  const { clinicProfile, isProfileComplete } = useClinicProfile();
  const { billing, isBillingReady, refreshBilling, upgradePrompt, showPublishUpgrade, showDiscoverUpgrade } =
    useClinicUpgradePrompt();
  const { tab } = useLocalSearchParams<{ tab?: string }>();
  const [jobs, setJobs] = useState<JobPost[]>([]);
  const [applications, setApplications] = useState<ClinicApplication[]>([]);
  const [applicantCounts, setApplicantCounts] = useState<Record<string, number>>({});
  const [jobStatusFilter, setJobStatusFilter] = useState<
    Extract<JobStatusFilter, 'live' | 'paused' | 'filled'>
  >('live');
  const [jobRoleTypeFilter, setJobRoleTypeFilter] = useState<RoleTypeFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    if (tab === 'fill-ins') {
      router.replace(CLINIC_FILL_INS);
    }
  }, [tab]);

  const mainListJobs = useMemo(() => filterJobPostsForMainList(jobs, 'all', 'all'), [jobs]);
  const filledRoleCount = useMemo(
    () => jobs.filter((job) => job.status === 'filled').length,
    [jobs],
  );

  const filteredJobs = useMemo(
    () =>
      filterJobPostsForMainList(jobs, jobStatusFilter, jobRoleTypeFilter).filter((job) =>
        matchesJobPostSearch(job, searchQuery),
      ),
    [jobs, jobStatusFilter, jobRoleTypeFilter, searchQuery],
  );

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

  const hasSearch = hasActiveListSearch(searchQuery);
  const hasActiveFilters = jobRoleTypeFilter !== 'all';

  const historyCounts = useMemo(() => countHistoryJobs(jobs), [jobs]);
  const hasRoleHistory = historyCounts.archived > 0;
  const liveRoleCount = useMemo(
    () => mainListJobs.filter((job) => job.status === 'live').length,
    [mainListJobs],
  );
  const pausedRoleCount = useMemo(
    () => mainListJobs.filter((job) => job.status === 'paused').length,
    [mainListJobs],
  );
  const roleStatusTabs = useMemo(
    () => [
      {
        value: 'live' as const,
        label: 'Live',
        count: liveRoleCount,
        accent: 'primary' as const,
        icon: 'radio-button-on-outline' as const,
      },
      {
        value: 'paused' as const,
        label: 'Paused',
        count: pausedRoleCount,
        accent: 'primary' as const,
        icon: 'pause-circle-outline' as const,
      },
      {
        value: 'filled' as const,
        label: 'Filled',
        count: filledRoleCount,
        accent: 'tertiary' as const,
        icon: 'checkmark-circle-outline' as const,
      },
    ],
    [filledRoleCount, liveRoleCount, pausedRoleCount],
  );

  const styles = useThemedStyles(({ spacing }) => ({
    wrap: {
      gap: spacing.lg,
    },
    cardList: {
      gap: dashboardSectionGap(spacing),
    },
  }));

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

  const roleLimitReached = isBillingReady && isRolePostingLimitReached(billing);

  const handlePostRolePress = () => {
    if (roleLimitReached) {
      showPublishUpgrade('role');
      return;
    }
    guardPosting(CLINIC_POST_JOB);
  };

  const load = useCallback(async () => {
    if (!clinicId) {
      setJobs([]);
      setApplications([]);
      setLoadError(false);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setLoadError(false);
    try {
      const [jobPosts, counts, applicationRows] = await Promise.all([
        listJobPosts(clinicId, { locationIds: scopedLocationIds }),
        getJobPostApplicationCountsMap(clinicId),
        listClinicApplications(clinicId, 'active', { locationIds: scopedLocationIds }),
      ]);
      setJobs(jobPosts);
      setApplicantCounts(counts);
      setApplications(applicationRows);
      await refreshBilling();
    } catch {
      setJobs([]);
      setApplicantCounts({});
      setApplications([]);
      setLoadError(true);
    } finally {
      setIsLoading(false);
    }
  }, [clinicId, refreshBilling, scopedLocationIds]);

  useRefreshOnFocus(load);
  const { refreshing, onRefresh } = usePullToRefresh(load);

  const handleJobUpdated = useCallback(
    (updated: JobPost) => {
      setJobs((prev) => prev.map((job) => (job.id === updated.id ? updated : job)));
      void refreshBilling();
    },
    [refreshBilling],
  );

  const handleJobDeleted = useCallback(
    (jobId: string) => {
      setJobs((prev) => prev.filter((job) => job.id !== jobId));
      setApplicantCounts((prev) => {
        const next = { ...prev };
        delete next[jobId];
        return next;
      });
      void refreshBilling();
    },
    [refreshBilling],
  );

  const showRoleControls = !isLoading && (mainListJobs.length > 0 || filledRoleCount > 0);
  const historyDetail =
    historyCounts.archived === 1 ? '1 archived role' : `${historyCounts.archived} archived roles`;

  return (
    <>
      {upgradePrompt}
      <Screen
        title="Roles"
        subtitle="Open roles at your clinic."
        refreshing={refreshing}
        onRefresh={onRefresh}>
        <View style={styles.wrap}>
          <DashboardQuickActionTile
            label="Post role"
            description="Publish a new opening"
            icon="briefcase-outline"
            variant="primary"
            dimmed={roleLimitReached}
            onPress={handlePostRolePress}
          />

          {!isTablet ? (
            <ClinicDiscoverBrowseLink
              title="Roles from other clinics"
              onPress={() => {
                if (billing != null && !billing.canUseClinicDiscover) {
                  showDiscoverUpgrade();
                  return;
                }
                router.push(getClinicDiscoverRoute('roles', 'postings-tab'));
              }}
            />
          ) : null}

          {roleLimitReached && billing ? (
            <PlanUpgradeCallout
              title={getClinicPostingLimitTitle('role')}
              message={getClinicPostingLimitReachedMessage(billing, 'role')}
              compact
            />
          ) : null}

          {loadError ? (
            <DashboardErrorBanner
              message="Could not load roles."
              onRetry={() => void load()}
            />
          ) : null}

        {showRoleControls ? (
          <ListSearchFilterRow
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search role title or type"
            accessibilityLabel="Search roles"
            filter={
              <RoleTypeFilters
                roleTypeFilter={jobRoleTypeFilter}
                onRoleTypeChange={setJobRoleTypeFilter}
                accessibilityLabel="Filter roles"
                sheetTitle="Filter roles"
              />
            }
          />
        ) : null}

        {isLoading ? (
          <PageLoadingList message="Loading roles…" />
        ) : loadError ? null : (
          <>
            {jobs.length === 0 ? (
              <EmptyState
                icon="briefcase-outline"
                title="No roles yet"
                message="Post your first role to start receiving applications from candidates."
              />
            ) : mainListJobs.length === 0 && filledRoleCount === 0 ? (
              <EmptyState
                icon="briefcase-outline"
                title="No active roles"
                message="Paused and live roles appear here. View role history for archived roles."
              />
            ) : (
              <FileTabWell
                tabs={roleStatusTabs}
                selected={jobStatusFilter}
                onSelect={setJobStatusFilter}>
                {filteredJobs.length === 0 ? (
                  <EmptyState
                    embedded
                    icon="filter-outline"
                    title={
                      hasSearch || hasActiveFilters
                        ? 'No roles match your search'
                        : jobStatusFilter === 'live'
                          ? 'No live roles'
                          : jobStatusFilter === 'paused'
                            ? 'No paused roles'
                            : 'No filled roles'
                    }
                    message={
                      hasSearch || hasActiveFilters
                        ? 'Try a different search or filter, or publish a new role.'
                        : jobStatusFilter === 'live'
                          ? 'Publish a new role or check the Paused or Filled tabs.'
                          : jobStatusFilter === 'paused'
                            ? 'Paused roles will appear here when you pause a live posting.'
                            : 'Roles move here when you hire a candidate.'
                    }
                  />
                ) : (
                  <View style={styles.cardList}>
                    <ResponsiveGrid>
                      {filteredJobs.map((job) => (
                        <RolePostingCard
                          key={job.id}
                          job={job}
                          applicantCount={applicantCounts[job.id] ?? 0}
                          applicants={applicantPreviewByJobId[job.id]}
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
                            user?.id
                              ? {
                                  clinicId: clinicId ?? user.id,
                                  onUpdated: handleJobUpdated,
                                  onDeleted: () => handleJobDeleted(job.id),
                                }
                              : undefined
                          }
                        />
                      ))}
                    </ResponsiveGrid>
                  </View>
                )}
              </FileTabWell>
            )}

            {hasRoleHistory ? (
              <>
                <DashboardSectionHeader
                  title="Role history"
                  actionLabel="View all"
                  onActionPress={() => router.push(getRoleHistoryRoute())}
                />
                <BrowseListGroup>
                  <BrowseListRow
                    avatar={
                      <View
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: 20,
                          backgroundColor: colors.fillSubtle,
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Ionicons name="time-outline" size={20} color={colors.labelSecondary} />
                      </View>
                    }
                    title="Archived roles"
                    headerDetail={historyDetail}
                    onPress={() => router.push(getRoleHistoryRoute())}
                  />
                </BrowseListGroup>
              </>
            ) : null}
          </>
        )}
      </View>
    </Screen>
    </>
  );
}
