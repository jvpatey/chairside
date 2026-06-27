import { listLiveJobPosts, listWorkerAppliedJobPostIds, getWorkerSavedJobPostIds, saveJobPost, unsaveJobPost, type LiveJobPost } from '@chairside/api';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Text, useWindowDimensions, View, type LayoutChangeEvent } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useMobileTabDockInset } from '@/components/navigation/mobileTabDockInset';

import { RoleListingCard } from '@/components/worker/RoleListingCard';
import { WorkerBrowseMap } from '@/components/worker/WorkerBrowseMap';
import { WorkerBrowseViewToggle } from '@/components/worker/WorkerBrowseViewToggle';
import { WorkerBrowseViewTransition } from '@/components/worker/WorkerBrowseViewTransition';
import { WorkerRoleBrowseFilters } from '@/components/clinic/PostingFilters';
import { DashboardEmptyState } from '@/components/dashboard/DashboardEmptyState';
import { dashboardSectionGap } from '@/components/dashboard/dashboardLayout';
import { PageLoadingList } from '@/components/ui/PageLoadingState';
import { Screen } from '@/components/ui/Screen';
import { PageTabBar } from '@/components/ui/PageTabBar';
import { WorkerClinicsDirectoryIconButton } from '@/components/worker/WorkerClinicsDirectoryEntryCard';
import { WorkerBrowseSearchBar } from '@/components/worker/WorkerBrowseSearchBar';
import { useAuth } from '@/contexts/AuthContext';
import { useWorkerProfile } from '@/contexts/WorkerProfileContext';
import { useRefreshOnFocus } from '@/hooks/useRefreshOnFocus';
import { useMarkGetStartedBrowseVisit } from '@/hooks/useMarkGetStartedBrowseVisit';
import { ROLES_BROWSE_MODE_OPTIONS, type RolesBrowseMode, type WorkerBrowseViewMode } from '@/lib/postingFilters';
import {
  DEFAULT_WORKER_ROLE_BROWSE_FILTERS,
  filterAndSortLiveJobs,
  type EnrichedLiveJobPost,
} from '@/lib/workerBrowseFilters';
import { buildLiveJobMatchDisplayContext, computeJobMatchBreakdown } from '@/lib/workerMatch';
import { getWorkerClinicsDirectoryRoute, getWorkerJobDetailRoute } from '@/lib/routing';
import {
  countUnmappablePosts,
  groupWorkerMapItemsByClinic,
  toWorkerMapItemsFromJobs,
} from '@/lib/workerMapItems';
import { getWorkerMapPanelHeight } from '@/lib/workerMapRegion';
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
  savedJobIds: Set<string>,
  workerProfile: ReturnType<typeof useWorkerProfile>['workerProfile'],
  onToggleSaved: (jobId: string, nextSaved: boolean) => void,
) {
  return jobs.map((job) => (
    <RoleListingCard
      key={job.id}
      job={job}
      hasApplied={appliedJobIds.has(job.id)}
      isSaved={savedJobIds.has(job.id)}
      onToggleSaved={() => onToggleSaved(job.id, !savedJobIds.has(job.id))}
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
  const profileComplete = Boolean(workerProfile?.setup_completed_at);
  const [selectedMode, setSelectedMode] = useState<RolesBrowseMode>('open');
  const [viewMode, setViewMode] = useState<WorkerBrowseViewMode>('list');
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
  const [savedJobIds, setSavedJobIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [controlsHeight, setControlsHeight] = useState(132);
  const { height: windowHeight } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const tabDockInset = useMobileTabDockInset();

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const [jobRows, appliedIds, savedIds] = await Promise.all([
        listLiveJobPosts(province),
        user?.id ? listWorkerAppliedJobPostIds(user.id) : Promise.resolve([]),
        user?.id ? getWorkerSavedJobPostIds(user.id) : Promise.resolve(new Set<string>()),
      ]);
      setJobs(jobRows);
      setAppliedJobIds(new Set(appliedIds));
      setSavedJobIds(savedIds);
    } catch {
      setJobs([]);
      setAppliedJobIds(new Set());
      setSavedJobIds(new Set());
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

  const { openJobs, appliedJobs, savedJobs } = useMemo(() => {
    const open: EnrichedLiveJobPost[] = [];
    const applied: EnrichedLiveJobPost[] = [];
    const saved: EnrichedLiveJobPost[] = [];

    for (const job of filteredJobs) {
      if (savedJobIds.has(job.id)) {
        saved.push(job);
      }
      if (appliedJobIds.has(job.id)) {
        applied.push(job);
      } else {
        open.push(job);
      }
    }

    return { openJobs: open, appliedJobs: applied, savedJobs: saved };
  }, [appliedJobIds, filteredJobs, savedJobIds]);

  const tabJobs =
    selectedMode === 'open'
      ? openJobs
      : selectedMode === 'applied'
        ? appliedJobs
        : savedJobs;
  const canUseMap = selectedMode === 'open';

  useEffect(() => {
    if (!canUseMap && viewMode === 'map') {
      setViewMode('list');
    }
  }, [canUseMap, viewMode]);

  const mapGroups = useMemo(
    () =>
      groupWorkerMapItemsByClinic(
        toWorkerMapItemsFromJobs(tabJobs, savedJobIds, appliedJobIds),
      ),
    [appliedJobIds, tabJobs, savedJobIds],
  );
  const unmappableJobCount = useMemo(() => countUnmappablePosts(tabJobs), [tabJobs]);
  const workerCoords =
    workerProfile?.latitude != null && workerProfile?.longitude != null
      ? { latitude: workerProfile.latitude, longitude: workerProfile.longitude }
      : null;
  const hasActiveFilters =
    searchQuery.trim().length > 0 ||
    roleTypeFilter !== DEFAULT_WORKER_ROLE_BROWSE_FILTERS.roleTypeFilter ||
    sort !== DEFAULT_WORKER_ROLE_BROWSE_FILTERS.sort ||
    distanceFilter !== DEFAULT_WORKER_ROLE_BROWSE_FILTERS.distanceFilter ||
    softwareFilter !== DEFAULT_WORKER_ROLE_BROWSE_FILTERS.softwareFilter ||
    payListedFilter !== DEFAULT_WORKER_ROLE_BROWSE_FILTERS.payListedFilter ||
    matchTierFilter !== DEFAULT_WORKER_ROLE_BROWSE_FILTERS.matchTierFilter;

  const hasMapResults =
    canUseMap &&
    !isLoading &&
    jobs.length > 0 &&
    viewMode === 'map' &&
    tabJobs.length > 0;

  const mapPanelHeight = useMemo(
    () => getWorkerMapPanelHeight(windowHeight, insets.top, tabDockInset, controlsHeight),
    [controlsHeight, insets.top, tabDockInset, windowHeight],
  );

  const handleControlsLayout = (event: LayoutChangeEvent) => {
    const { height } = event.nativeEvent.layout;
    if (height > 0) {
      setControlsHeight((current) => (current === height ? current : height));
    }
  };

  const styles = useThemedStyles(({ spacing }) => ({
    wrap: { gap: spacing.lg },
    panel: { gap: spacing.lg },
    controlsBlock: {
      width: '100%',
      flexShrink: 0,
      flexGrow: 0,
      gap: spacing.md,
    },
    controlRow: {
      width: '100%',
      flexShrink: 0,
    },
    cardList: { gap: dashboardSectionGap(spacing) },
    searchRow: {
      width: '100%',
      flexShrink: 0,
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
    },
    searchField: { flex: 1, minWidth: 0 },
    mapPanel: {
      width: '100%',
      overflow: 'hidden',
    },
  }));

  const showBrowseControls = !isLoading && jobs.length > 0;

  const browseControls = showBrowseControls ? (
    <View style={styles.controlsBlock} onLayout={handleControlsLayout}>
      <View style={styles.controlRow}>
        <PageTabBar
          options={ROLES_BROWSE_MODE_OPTIONS}
          selected={selectedMode}
          onChange={setSelectedMode}
          density="compact"
        />
      </View>
      <View style={styles.searchRow}>
        <View style={styles.searchField}>
          <WorkerBrowseSearchBar value={searchQuery} onChange={setSearchQuery} />
        </View>
        {profileComplete ? (
          <WorkerClinicsDirectoryIconButton
            onPress={() => router.push(getWorkerClinicsDirectoryRoute())}
          />
        ) : null}
        {canUseMap ? <WorkerBrowseViewToggle selected={viewMode} onChange={setViewMode} /> : null}
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
    </View>
  ) : null;

  const emptyTabState = (() => {
    switch (selectedMode) {
      case 'open':
        return {
          icon: 'briefcase-outline' as const,
          title: 'No open roles in this filter',
          message: hasActiveFilters
            ? 'Try a different search or filter, or check the Applied or Saved tab.'
            : 'Check back soon for new opportunities.',
        };
      case 'applied':
        return {
          icon: 'checkmark-circle-outline' as const,
          title: 'No applied roles in this filter',
          message: 'Roles you apply to will appear here while they are still posted.',
        };
      case 'saved':
        return {
          icon: 'bookmark-outline' as const,
          title: 'No saved roles',
          message: hasActiveFilters
            ? 'Try a different search or filter, or save roles from the Open tab.'
            : 'Save roles you are interested in to find them here.',
        };
    }
  })();

  const listContent =
    filteredJobs.length === 0 ? (
      <BrowseEmptyState
        icon="filter-outline"
        title="No roles match your search"
        body={
          hasActiveFilters
            ? 'Try a different search term or adjust your filters.'
            : 'Check back soon for new opportunities.'
        }
      />
    ) : tabJobs.length === 0 ? (
      <DashboardEmptyState
        icon={emptyTabState.icon}
        title={emptyTabState.title}
        message={emptyTabState.message}
      />
    ) : (
      <View style={styles.cardList}>
        {renderRoleListingCards(
          tabJobs,
          appliedJobIds,
          savedJobIds,
          workerProfile,
          handleToggleSavedJob,
        )}
      </View>
    );

  return (
    <Screen
      title="Roles"
      subtitle="Open roles in your province."
      scroll
      scrollEnabled={!hasMapResults}
    >
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
            {browseControls}
            <WorkerBrowseViewTransition
              mode={hasMapResults ? 'map' : 'list'}
              style={
                hasMapResults ? [styles.mapPanel, { height: mapPanelHeight }] : undefined
              }
            >
              {hasMapResults ? (
                <WorkerBrowseMap
                  groups={mapGroups}
                  workerCoords={workerCoords}
                  province={province}
                  unmappableCount={unmappableJobCount}
                  workerHasCoordinates={workerCoords != null}
                  onSelectItem={(item) => router.push(getWorkerJobDetailRoute(item.id))}
                />
              ) : (
                listContent
              )}
            </WorkerBrowseViewTransition>
          </View>
        )}
      </View>
    </Screen>
  );
}
