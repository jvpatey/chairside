import {
  listLiveJobPosts,
  listWorkerJobApplicationStatuses,
  getWorkerSavedJobPostIds,
  saveJobPost,
  unsaveJobPost,
  type LiveJobPost,
} from '@chairside/api';
import { isActiveApplicationStatus } from '@chairside/config';
import { router } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, View } from 'react-native';

import { WorkerBrowseWebLayout } from '@/components/web/browse/WorkerBrowseWebLayout';

import { RoleListingCard } from '@/components/worker/RoleListingCard';
import { RolesStatusRow } from '@/components/worker/RolesStatusRow';
import { FeaturedListingsSectionHeader } from '@/components/worker/FeaturedListingsDivider';
import { WorkerBrowseMap } from '@/components/worker/WorkerBrowseMap';
import { WorkerBrowseViewToggle } from '@/components/worker/WorkerBrowseViewToggle';
import { WorkerBrowseViewTransition } from '@/components/worker/WorkerBrowseViewTransition';
import { WorkerRoleBrowseFilters } from '@/components/clinic/PostingFilters';
import { DashboardEmptyState } from '@/components/dashboard/DashboardEmptyState';
import { DashboardErrorBanner } from '@/components/dashboard/DashboardErrorBanner';
import { dashboardSectionGap } from '@/components/dashboard/dashboardLayout';
import { PageLoadingList } from '@/components/ui/PageLoadingState';
import { CoverageCardGrid } from '@/components/dashboard/CoverageCardGrid';
import { Screen } from '@/components/ui/Screen';
import { FileTabWell } from '@/components/dashboard/FileTabWell';
import { WorkerBrowseSearchBar } from '@/components/worker/WorkerBrowseSearchBar';
import { useAuth } from '@/contexts/AuthContext';
import { useWorkerProfile } from '@/contexts/WorkerProfileContext';
import { usePullToRefresh } from '@/hooks/usePullToRefresh';
import { useRefreshOnFocus } from '@/hooks/useRefreshOnFocus';
import { useMarkGetStartedBrowseVisit } from '@/hooks/useMarkGetStartedBrowseVisit';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';
import { IS_WEB } from '@/lib/webPressableStyles';
import { type RolesBrowseMode, type WorkerBrowseViewMode } from '@/lib/postingFilters';
import {
  DEFAULT_WORKER_ROLE_BROWSE_FILTERS,
  filterAndSortLiveJobs,
  type EnrichedLiveJobPost,
} from '@/lib/workerBrowseFilters';
import { partitionByPriorityListing } from '@/lib/listingPriority';
import { getWorkerJobDetailRoute } from '@/lib/routing';
import {
  countUnmappablePosts,
  groupWorkerMapItemsByClinic,
  toWorkerMapItemsFromJobs,
} from '@/lib/workerMapItems';
import { useThemedStyles } from '@/theme';

function renderRoleListingCard(
  job: EnrichedLiveJobPost,
  applicationStatuses: Record<string, string>,
  savedJobIds: Set<string>,
  onToggleSaved: (jobId: string, nextSaved: boolean) => void,
) {
  const status = applicationStatuses[job.id];
  return (
    <RoleListingCard
      key={job.id}
      job={job}
      applicationStatus={status && isActiveApplicationStatus(status) ? status : null}
      isSaved={savedJobIds.has(job.id)}
      onToggleSaved={() => onToggleSaved(job.id, !savedJobIds.has(job.id))}
      distanceLabel={job.distanceLabel}
      onPress={() => router.push(getWorkerJobDetailRoute(job.id, 'browse-tab'))}
    />
  );
}

function renderRoleListingCards(
  jobs: EnrichedLiveJobPost[],
  applicationStatuses: Record<string, string>,
  savedJobIds: Set<string>,
  onToggleSaved: (jobId: string, nextSaved: boolean) => void,
) {
  const { featured, standard } = partitionByPriorityListing(jobs);
  const showDivider = featured.length > 0 && standard.length > 0;

  return (
    <>
      {featured.length > 0 ? (
        <FeaturedListingsSectionHeader label="Featured" variant="featured" />
      ) : null}
      {featured.length > 0 ? (
        <CoverageCardGrid>
          {featured.map((job) =>
            renderRoleListingCard(job, applicationStatuses, savedJobIds, onToggleSaved),
          )}
        </CoverageCardGrid>
      ) : null}
      {showDivider ? (
        <FeaturedListingsSectionHeader label="More roles" variant="rest" />
      ) : null}
      {standard.length > 0 ? (
        <CoverageCardGrid>
          {standard.map((job) =>
            renderRoleListingCard(job, applicationStatuses, savedJobIds, onToggleSaved),
          )}
        </CoverageCardGrid>
      ) : null}
    </>
  );
}

export default function BrowseScreen() {
  useMarkGetStartedBrowseVisit('roles');
  const { user } = useAuth();
  const { workerProfile } = useWorkerProfile();
  const province = workerProfile?.province ?? 'NS';
  const [selectedMode, setSelectedMode] = useState<RolesBrowseMode>('open');
  const [viewMode, setViewMode] = useState<WorkerBrowseViewMode>('list');
  const [jobs, setJobs] = useState<LiveJobPost[]>([]);
  const [applicationStatuses, setApplicationStatuses] = useState<Record<string, string>>({});
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
  const [loadError, setLoadError] = useState(false);
  const { isWide } = useResponsiveLayout();

  const load = useCallback(async () => {
    setIsLoading(true);
    setLoadError(false);
    try {
      const [jobRows, statuses, savedIds] = await Promise.all([
        listLiveJobPosts(province),
        user?.id ? listWorkerJobApplicationStatuses(user.id) : Promise.resolve({}),
        user?.id ? getWorkerSavedJobPostIds(user.id) : Promise.resolve(new Set<string>()),
      ]);
      setJobs(jobRows);
      setApplicationStatuses(statuses);
      setSavedJobIds(savedIds);
    } catch {
      setJobs([]);
      setApplicationStatuses({});
      setSavedJobIds(new Set());
      setLoadError(true);
    } finally {
      setIsLoading(false);
    }
  }, [province, user?.id]);

  useRefreshOnFocus(load);
  const { refreshing, onRefresh } = usePullToRefresh(load);

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

  const appliedJobIds = useMemo(
    () => new Set(Object.keys(applicationStatuses)),
    [applicationStatuses],
  );

  const { openJobs, appliedJobs, savedJobs } = useMemo(() => {
    const open: EnrichedLiveJobPost[] = [];
    const applied: EnrichedLiveJobPost[] = [];
    const saved: EnrichedLiveJobPost[] = [];

    for (const job of filteredJobs) {
      if (savedJobIds.has(job.id)) {
        saved.push(job);
      }
      const status = applicationStatuses[job.id];
      if (status) {
        if (isActiveApplicationStatus(status)) {
          applied.push(job);
        }
      } else {
        open.push(job);
      }
    }

    return { openJobs: open, appliedJobs: applied, savedJobs: saved };
  }, [applicationStatuses, filteredJobs, savedJobIds]);

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
        toWorkerMapItemsFromJobs(openJobs, savedJobIds, appliedJobIds),
      ),
    [appliedJobIds, openJobs, savedJobIds],
  );
  const unmappableJobCount = useMemo(() => countUnmappablePosts(openJobs), [openJobs]);
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
    canUseMap && !isLoading && viewMode === 'map' && openJobs.length > 0;

  const mapElement = (
    <WorkerBrowseMap
      groups={mapGroups}
      workerCoords={workerCoords}
      province={province}
      unmappableCount={unmappableJobCount}
      workerHasCoordinates={workerCoords != null}
      onSelectItem={(item) => router.push(getWorkerJobDetailRoute(item.id, 'browse-tab'))}
    />
  );

  const useWebSplitMap = IS_WEB && isWide && canUseMap && viewMode === 'map' && openJobs.length > 0;
  const fillMapViewport = hasMapResults && !useWebSplitMap;

  const styles = useThemedStyles(({ spacing }) => ({
    content: { gap: spacing.lg },
    contentFill: { flex: 1, minHeight: 0 },
    panel: { gap: spacing.lg },
    panelFill: { flex: 1, minHeight: 0 },
    controlsBlock: {
      width: '100%',
      flexShrink: 0,
      flexGrow: 0,
      gap: spacing.md,
    },
    cardList: { gap: dashboardSectionGap(spacing) },
    browseControlsRow: {
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
      flex: 1,
      minHeight: 0,
    },
  }));

  const browseTabs = useMemo(
    () => [
      {
        value: 'open' as const,
        label: 'Open',
        count: openJobs.length,
        accent: 'primary' as const,
        icon: 'briefcase-outline' as const,
      },
      {
        value: 'applied' as const,
        label: 'Applied',
        count: appliedJobs.length,
        accent: 'primary' as const,
        icon: 'checkmark-circle-outline' as const,
      },
      {
        value: 'saved' as const,
        label: 'Saved',
        count: savedJobs.length,
        accent: 'primary' as const,
        icon: 'bookmark-outline' as const,
      },
    ],
    [appliedJobs.length, openJobs.length, savedJobs.length],
  );

  const openBrowseControls = (
    <View style={styles.controlsBlock}>
      <View style={styles.browseControlsRow}>
        <View style={styles.searchField}>
          <WorkerBrowseSearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search by clinic, city, or role"
            accessibilityLabel="Search permanent roles"
          />
        </View>
        <WorkerBrowseViewToggle selected={viewMode} onChange={setViewMode} />
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
  );

  const openListContent = isLoading ? (
    <PageLoadingList rowCount={4} />
  ) : openJobs.length === 0 ? (
    <DashboardEmptyState
      embedded
      accent="primary"
      icon="briefcase-outline"
      title={hasActiveFilters ? 'No roles match your filters' : 'No matching roles nearby yet'}
      message={
        hasActiveFilters
          ? 'Try another city, role, or distance — or check Applied and Saved.'
          : 'Permanent openings that match your role and area will show up here.'
      }
    />
  ) : (
    <View style={styles.cardList}>
      {renderRoleListingCards(
        openJobs,
        applicationStatuses,
        savedJobIds,
        handleToggleSavedJob,
      )}
    </View>
  );

  const openPanelBody = (
    <View style={[styles.panel, fillMapViewport ? styles.panelFill : null]}>
      {openBrowseControls}
      {useWebSplitMap ? (
        <WorkerBrowseWebLayout showMap list={openListContent} map={mapElement} />
      ) : (
        <WorkerBrowseViewTransition
          mode={hasMapResults ? 'map' : 'list'}
          style={hasMapResults ? styles.mapPanel : undefined}
        >
          {hasMapResults ? mapElement : openListContent}
        </WorkerBrowseViewTransition>
      )}
    </View>
  );

  const appliedPanelBody = isLoading ? (
    <PageLoadingList rowCount={3} />
  ) : appliedJobs.length === 0 ? (
    <DashboardEmptyState
      embedded
      accent="primary"
      icon="checkmark-circle-outline"
      title="No applications yet"
      message="Apply to a permanent role and it stays here until the clinic responds."
    />
  ) : (
    <View style={styles.cardList}>
      {renderRoleListingCards(
        appliedJobs,
        applicationStatuses,
        savedJobIds,
        handleToggleSavedJob,
      )}
    </View>
  );

  const savedPanelBody = isLoading ? (
    <PageLoadingList rowCount={3} />
  ) : savedJobs.length === 0 ? (
    <DashboardEmptyState
      embedded
      accent="primary"
      icon="bookmark-outline"
      title="No saved roles"
      message={
        hasActiveFilters
          ? 'Try another search or filter, or save roles from Open.'
          : 'Save openings you like so you can come back to them here.'
      }
    />
  ) : (
    <View style={styles.cardList}>
      {renderRoleListingCards(
        savedJobs,
        applicationStatuses,
        savedJobIds,
        handleToggleSavedJob,
      )}
    </View>
  );

  return (
    <Screen
      title="Roles"
      subtitle="Permanent openings matched to your role and area."
      softHeaderDivider
      fillsContainer={fillMapViewport}
      scroll={!fillMapViewport}
      scrollEnabled={!fillMapViewport}
      refreshing={fillMapViewport ? undefined : refreshing}
      onRefresh={fillMapViewport ? undefined : onRefresh}
      refreshAccent="primary"
    >
      <View style={[styles.content, fillMapViewport ? styles.contentFill : null]}>
        {loadError ? (
          <DashboardErrorBanner
            message="Could not load roles."
            onRetry={() => void load()}
          />
        ) : null}
        <RolesStatusRow />

        <View style={fillMapViewport ? styles.panelFill : undefined}>
          <FileTabWell
            tabs={browseTabs}
            selected={selectedMode}
            onSelect={setSelectedMode}
            fillHeight={fillMapViewport}
          >
            {selectedMode === 'open' ? openPanelBody : null}
            {selectedMode === 'applied' ? appliedPanelBody : null}
            {selectedMode === 'saved' ? savedPanelBody : null}
          </FileTabWell>
        </View>
      </View>
    </Screen>
  );
}
