import { listLiveJobPosts, listWorkerAppliedJobPostIds, type LiveJobPost } from '@chairside/api';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Text, View } from 'react-native';

import { RoleListingCard } from '@/components/worker/RoleListingCard';
import { WorkerRoleBrowseFilters } from '@/components/clinic/PostingFilters';
import { DashboardEmptyState } from '@/components/dashboard/DashboardEmptyState';
import { PageLoadingList } from '@/components/ui/PageLoadingState';
import { Screen } from '@/components/ui/Screen';
import { BrowseListGroup } from '@/components/ui/BrowseListGroup';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { WorkerBrowseSearchBar } from '@/components/worker/WorkerBrowseSearchBar';
import { useAuth } from '@/contexts/AuthContext';
import { useWorkerProfile } from '@/contexts/WorkerProfileContext';
import { useRefreshOnFocus } from '@/hooks/useRefreshOnFocus';
import { useMarkGetStartedBrowseVisit } from '@/hooks/useMarkGetStartedBrowseVisit';
import { ROLES_BROWSE_MODE_OPTIONS, type RolesBrowseMode } from '@/lib/postingFilters';
import {
  DEFAULT_WORKER_ROLE_BROWSE_FILTERS,
  filterAndSortLiveJobs,
  type EnrichedLiveJobPost,
} from '@/lib/workerBrowseFilters';
import { buildLiveJobMatchDisplayContext, computeJobMatchBreakdown } from '@/lib/workerMatch';
import { getWorkerJobDetailRoute } from '@/lib/routing';
import { useTheme, useThemedStyles } from '@/theme';

function BrowseEmptyState({
  icon,
  title,
  body,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  body: string;
}) {
  const { colors } = useTheme();
  const styles = useThemedStyles(({ colors, spacing, typography }) => ({
    card: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.separator,
      padding: spacing.xl,
      alignItems: 'center',
      gap: spacing.sm,
    },
    iconWrap: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: colors.fillSubtle,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: spacing.xs,
    },
    title: { ...typography.body, fontWeight: '600', textAlign: 'center' },
    body: { ...typography.subtitle, fontSize: 14, lineHeight: 20, textAlign: 'center' },
  }));

  return (
    <View style={styles.card}>
      <View style={styles.iconWrap}>
        <Ionicons name={icon} size={24} color={colors.labelSecondary} />
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.body}>{body}</Text>
    </View>
  );
}

function renderRoleListingCards(
  jobs: EnrichedLiveJobPost[],
  appliedJobIds: Set<string>,
  workerProfile: ReturnType<typeof useWorkerProfile>['workerProfile'],
) {
  return jobs.map((job) => (
    <RoleListingCard
      key={job.id}
      job={job}
      layout="list"
      hasApplied={appliedJobIds.has(job.id)}
      distanceLabel={job.distanceLabel}
      jobMatch={workerProfile ? computeJobMatchBreakdown(workerProfile, job) : null}
      matchContext={workerProfile ? buildLiveJobMatchDisplayContext(workerProfile, job) : undefined}
      onPress={() => router.push(getWorkerJobDetailRoute(job.id))}
    />
  ));
}

export default function BrowseScreen() {
  useMarkGetStartedBrowseVisit('roles');
  const { user } = useAuth();
  const { workerProfile } = useWorkerProfile();
  const province = workerProfile?.province ?? 'NS';
  const [selectedMode, setSelectedMode] = useState<RolesBrowseMode>('open');
  const [jobs, setJobs] = useState<LiveJobPost[]>([]);
  const [appliedJobIds, setAppliedJobIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState(DEFAULT_WORKER_ROLE_BROWSE_FILTERS.searchQuery);
  const [roleTypeFilter, setRoleTypeFilter] = useState(
    DEFAULT_WORKER_ROLE_BROWSE_FILTERS.roleTypeFilter,
  );
  const [sort, setSort] = useState(DEFAULT_WORKER_ROLE_BROWSE_FILTERS.sort);
  const [distanceFilter, setDistanceFilter] = useState(
    DEFAULT_WORKER_ROLE_BROWSE_FILTERS.distanceFilter,
  );
  const [softwareFilter, setSoftwareFilter] = useState(
    DEFAULT_WORKER_ROLE_BROWSE_FILTERS.softwareFilter,
  );
  const [payListedFilter, setPayListedFilter] = useState(
    DEFAULT_WORKER_ROLE_BROWSE_FILTERS.payListedFilter,
  );
  const [matchTierFilter, setMatchTierFilter] = useState(
    DEFAULT_WORKER_ROLE_BROWSE_FILTERS.matchTierFilter,
  );
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const [jobRows, appliedIds] = await Promise.all([
        listLiveJobPosts(province),
        user?.id ? listWorkerAppliedJobPostIds(user.id) : Promise.resolve([]),
      ]);
      setJobs(jobRows);
      setAppliedJobIds(new Set(appliedIds));
    } catch {
      setJobs([]);
      setAppliedJobIds(new Set());
    } finally {
      setIsLoading(false);
    }
  }, [province, user?.id]);

  useRefreshOnFocus(load);

  const filteredJobs = useMemo(
    () =>
      filterAndSortLiveJobs(jobs, workerProfile, {
        searchQuery,
        roleTypeFilter,
        sort,
        distanceFilter,
        softwareFilter,
        payListedFilter,
        matchTierFilter,
      }),
    [
      distanceFilter,
      jobs,
      matchTierFilter,
      payListedFilter,
      roleTypeFilter,
      searchQuery,
      softwareFilter,
      sort,
      workerProfile,
    ],
  );

  const { openJobs, appliedJobs } = useMemo(() => {
    const open: EnrichedLiveJobPost[] = [];
    const applied: EnrichedLiveJobPost[] = [];

    for (const job of filteredJobs) {
      if (appliedJobIds.has(job.id)) {
        applied.push(job);
      } else {
        open.push(job);
      }
    }

    return { openJobs: open, appliedJobs: applied };
  }, [appliedJobIds, filteredJobs]);

  const hasBothSections = openJobs.length > 0 && appliedJobs.length > 0;
  const segmentJobs = selectedMode === 'open' ? openJobs : appliedJobs;
  const hasActiveFilters =
    searchQuery.trim().length > 0 ||
    roleTypeFilter !== DEFAULT_WORKER_ROLE_BROWSE_FILTERS.roleTypeFilter ||
    sort !== DEFAULT_WORKER_ROLE_BROWSE_FILTERS.sort ||
    distanceFilter !== DEFAULT_WORKER_ROLE_BROWSE_FILTERS.distanceFilter ||
    softwareFilter !== DEFAULT_WORKER_ROLE_BROWSE_FILTERS.softwareFilter ||
    payListedFilter !== DEFAULT_WORKER_ROLE_BROWSE_FILTERS.payListedFilter ||
    matchTierFilter !== DEFAULT_WORKER_ROLE_BROWSE_FILTERS.matchTierFilter;

  const styles = useThemedStyles(({ spacing }) => ({
    wrap: { gap: spacing.lg },
    panel: { gap: spacing.lg },
    searchRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
    },
    searchField: { flex: 1, minWidth: 0 },
  }));

  const showBrowseControls = !isLoading && jobs.length > 0;

  const browseControls = showBrowseControls ? (
    <View style={styles.searchRow}>
      <View style={styles.searchField}>
        <WorkerBrowseSearchBar
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Search roles, clinics, cities, or pay"
          accessibilityLabel="Search roles"
        />
      </View>
      <WorkerRoleBrowseFilters
        roleTypeFilter={roleTypeFilter}
        sort={sort}
        distanceFilter={distanceFilter}
        softwareFilter={softwareFilter}
        payListedFilter={payListedFilter}
        matchTierFilter={matchTierFilter}
        onRoleTypeChange={setRoleTypeFilter}
        onSortChange={setSort}
        onDistanceFilterChange={setDistanceFilter}
        onSoftwareFilterChange={setSoftwareFilter}
        onPayListedFilterChange={setPayListedFilter}
        onMatchTierFilterChange={setMatchTierFilter}
      />
    </View>
  ) : null;

  return (
    <Screen title="Roles" subtitle="Open roles in your province.">
      <View style={styles.wrap}>
        {isLoading ? (
          <PageLoadingList message="Loading roles…" />
        ) : jobs.length === 0 ? (
          <BrowseEmptyState
            icon="briefcase-outline"
            title="No open roles"
            body="Check back soon for new opportunities in your province."
          />
        ) : (
          <View style={styles.panel}>
            {hasBothSections ? (
              <SegmentedControl
                options={ROLES_BROWSE_MODE_OPTIONS}
                selected={selectedMode}
                onChange={setSelectedMode}
                density="compact"
              />
            ) : null}
            {browseControls}
            {filteredJobs.length === 0 ? (
              <BrowseEmptyState
                icon="filter-outline"
                title="No roles match your search"
                body={
                  hasActiveFilters
                    ? 'Try a different search term or adjust your filters.'
                    : 'Check back soon for new opportunities.'
                }
              />
            ) : hasBothSections ? (
              segmentJobs.length === 0 ? (
                <DashboardEmptyState
                  icon={selectedMode === 'open' ? 'briefcase-outline' : 'checkmark-circle-outline'}
                  title={
                    selectedMode === 'open'
                      ? 'No open roles in this filter'
                      : 'No applied roles in this filter'
                  }
                  message={
                    selectedMode === 'open'
                      ? 'Try a different search or filter, or check the Applied tab.'
                      : 'Roles you apply to will appear here while they are still posted.'
                  }
                />
              ) : (
                <BrowseListGroup>
                  {renderRoleListingCards(segmentJobs, appliedJobIds, workerProfile)}
                </BrowseListGroup>
              )
            ) : (
              <BrowseListGroup>
                {renderRoleListingCards(filteredJobs, appliedJobIds, workerProfile)}
              </BrowseListGroup>
            )}
          </View>
        )}
      </View>
    </Screen>
  );
}
