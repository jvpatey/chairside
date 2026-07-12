import {
  getMissingClinicProfileFields,
  listJobPosts,
  getJobPostApplicationCountsMap,
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
  getJobDetailRoute,
  getRoleHistoryRoute,
} from '@/lib/routing';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, View } from 'react-native';

import { RolePostingFilters } from '@/components/clinic/PostingFilters';
import { RolePostingCard } from '@/components/clinic/RolePostingCard';
import { PlanUpgradeCallout } from '@/components/billing/PlanUpgradeCallout';
import { DashboardQuickActionTile } from '@/components/dashboard/DashboardQuickActionTile';
import { DashboardSectionHeader } from '@/components/dashboard/DashboardSectionHeader';
import { ListSearchFilterRow } from '@/components/ui/ListSearchFilterRow';
import { dashboardSectionGap } from '@/components/dashboard/dashboardLayout';
import { EmptyState } from '@/components/ui/EmptyState';
import { PageLoadingList } from '@/components/ui/PageLoadingState';
import { Screen } from '@/components/ui/Screen';
import { StaggeredList } from '@/components/ui/StaggeredList';
import { BrowseListGroup } from '@/components/ui/BrowseListGroup';
import { BrowseListRow } from '@/components/ui/BrowseListRow';
import { useAuth } from '@/contexts/AuthContext';
import { useClinicProfile } from '@/contexts/ClinicProfileContext';
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
  const { clinicProfile, isProfileComplete } = useClinicProfile();
  const { billing, isBillingReady, refreshBilling, upgradePrompt, showPublishUpgrade } =
    useClinicUpgradePrompt();
  const { tab } = useLocalSearchParams<{ tab?: string }>();
  const [jobs, setJobs] = useState<JobPost[]>([]);
  const [applicantCounts, setApplicantCounts] = useState<Record<string, number>>({});
  const [jobStatusFilter, setJobStatusFilter] = useState<JobStatusFilter>('all');
  const [jobRoleTypeFilter, setJobRoleTypeFilter] = useState<RoleTypeFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (tab === 'fill-ins') {
      router.replace(CLINIC_FILL_INS);
    }
  }, [tab]);

  const mainListJobs = useMemo(() => filterJobPostsForMainList(jobs, 'all', 'all'), [jobs]);

  const filteredJobs = useMemo(
    () =>
      filterJobPostsForMainList(jobs, jobStatusFilter, jobRoleTypeFilter).filter((job) =>
        matchesJobPostSearch(job, searchQuery),
      ),
    [jobs, jobStatusFilter, jobRoleTypeFilter, searchQuery],
  );

  const hasSearch = hasActiveListSearch(searchQuery);
  const hasActiveFilters = jobStatusFilter !== 'all' || jobRoleTypeFilter !== 'all';

  const historyCounts = useMemo(() => countHistoryJobs(jobs), [jobs]);
  const hasRoleHistory = historyCounts.archived > 0 || historyCounts.filled > 0;

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
    if (!user?.id) {
      setJobs([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const [jobPosts, counts] = await Promise.all([
        listJobPosts(user.id),
        getJobPostApplicationCountsMap(user.id),
      ]);
      setJobs(jobPosts);
      setApplicantCounts(counts);
      await refreshBilling();
    } catch (error) {
      setJobs([]);
      setApplicantCounts({});
      Alert.alert(
        'Could not load postings',
        error instanceof Error ? error.message : 'Please try again.',
      );
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, refreshBilling]);

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

  const showRoleControls = !isLoading && mainListJobs.length > 0;
  const historyDetail = `${historyCounts.archived === 1 ? '1 archived' : `${historyCounts.archived} archived`} · ${historyCounts.filled === 1 ? '1 filled' : `${historyCounts.filled} filled`}`;

  return (
    <>
      {upgradePrompt}
      <Screen
        title="Postings"
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
                    <Ionicons name="compass-outline" size={20} color={colors.labelSecondary} />
                  </View>
                }
                title="Roles from other clinics"
                headerDetail="Live openings in your province"
                onPress={() => router.push(getClinicDiscoverRoute('roles'))}
              />
            </BrowseListGroup>
          ) : null}

          {roleLimitReached && billing ? (
            <PlanUpgradeCallout
              title={getClinicPostingLimitTitle('role')}
              message={getClinicPostingLimitReachedMessage(billing, 'role')}
              compact
            />
          ) : null}

        {showRoleControls ? (
          <ListSearchFilterRow
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search role title or type"
            accessibilityLabel="Search postings"
            filter={
              <RolePostingFilters
                statusFilter={jobStatusFilter}
                roleTypeFilter={jobRoleTypeFilter}
                onStatusChange={setJobStatusFilter}
                onRoleTypeChange={setJobRoleTypeFilter}
              />
            }
          />
        ) : null}

        {isLoading ? (
          <PageLoadingList message="Loading postings…" />
        ) : (
          <>
            {jobs.length === 0 ? (
              <EmptyState
                icon="briefcase-outline"
                title="No roles yet"
                message="Post your first role to start receiving applications from candidates."
              />
            ) : mainListJobs.length === 0 ? (
              <EmptyState
                icon="briefcase-outline"
                title="No active roles"
                message="Paused and live roles appear here. View role history for archived and filled postings."
              />
            ) : filteredJobs.length === 0 ? (
              <EmptyState
                icon="filter-outline"
                title={
                  hasSearch || hasActiveFilters
                    ? 'No roles match your search'
                    : 'No roles in this filter'
                }
                message={
                  hasSearch || hasActiveFilters
                    ? 'Try a different search or filter, or publish a new role.'
                    : 'Try a different filter or publish a new role.'
                }
              />
            ) : (
              <View style={styles.cardList}>
                <StaggeredList>
                  {filteredJobs.map((job) => (
                    <RolePostingCard
                      key={job.id}
                      job={job}
                      applicantCount={applicantCounts[job.id] ?? 0}
                      onPress={() => router.push(getJobDetailRoute(job.id))}
                      onApplicantsPress={() =>
                        router.push(getClinicRoleApplicationsRoute(job.id, 'postings-tab'))
                      }
                      manage={
                        user?.id
                          ? {
                              clinicId: user.id,
                              onUpdated: handleJobUpdated,
                              onDeleted: () => handleJobDeleted(job.id),
                            }
                          : undefined
                      }
                    />
                  ))}
                </StaggeredList>
              </View>
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
                    title="Archived & filled roles"
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
