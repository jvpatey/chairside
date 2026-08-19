import {
  listClinicDiscoverJobPosts,
  listClinicDiscoverShiftPosts,
  type LiveJobPost,
  type LiveShiftPost,
} from '@chairside/api';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Text, View } from 'react-native';

import { ClinicDiscoverFilters } from '@/components/clinic/PostingFilters';
import { DashboardErrorBanner } from '@/components/dashboard/DashboardErrorBanner';
import { dashboardSectionGap } from '@/components/dashboard/dashboardLayout';
import { EmptyState } from '@/components/ui/EmptyState';
import { PageLoadingList } from '@/components/ui/PageLoadingState';
import { FileTabWell } from '@/components/dashboard/FileTabWell';
import { ResponsiveGrid } from '@/components/ui/ResponsiveLayout';
import { Screen } from '@/components/ui/Screen';
import { WorkerBrowseMap } from '@/components/worker/WorkerBrowseMap';
import { WorkerBrowseSearchBar } from '@/components/worker/WorkerBrowseSearchBar';
import { WorkerBrowseViewToggle } from '@/components/worker/WorkerBrowseViewToggle';
import { WorkerBrowseViewTransition } from '@/components/worker/WorkerBrowseViewTransition';
import { WorkerBrowseWebLayout } from '@/components/web/browse/WorkerBrowseWebLayout';
import { FillInListingCard } from '@/components/worker/FillInListingCard';
import { RoleListingCard } from '@/components/worker/RoleListingCard';
import { useAuth } from '@/contexts/AuthContext';
import { useClinicProfile } from '@/contexts/ClinicProfileContext';
import { useClinicUpgradePrompt } from '@/hooks/useClinicUpgradePrompt';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';
import { usePullToRefresh } from '@/hooks/usePullToRefresh';
import { useRefreshOnFocus } from '@/hooks/useRefreshOnFocus';
import {
  countClinicDiscoverFilterChanges,
  DEFAULT_CLINIC_DISCOVER_FILTERS,
  filterClinicDiscoverJobs,
  filterClinicDiscoverShifts,
  getClinicDiscoverSortLabel,
  getDefaultClinicDiscoverSort,
  type ClinicDiscoverSort,
} from '@/lib/clinicDiscoverFilters';
import {
  groupDiscoverMapItemsByClinic,
  toDiscoverMapItemsFromJobs,
  toDiscoverMapItemsFromShifts,
} from '@/lib/clinicDiscoverMapItems';
import { hasActiveListSearch } from '@/lib/clinicListSearch';
import { FILL_IN_ICON } from '@/lib/fillInIcons';
import {
  type ClinicDiscoverTab,
  type RoleTypeFilter,
  type WorkerBrowseViewMode,
  type WorkerDistanceFilter,
} from '@/lib/postingFilters';
import {
  CLINIC_PROFILE_PRACTICE,
  getClinicDiscoverJobDetailRoute,
  getClinicDiscoverShiftDetailRoute,
  navigateAfterClinicDiscover,
  type ClinicDiscoverReturnTarget,
} from '@/lib/routing';
import { countUnmappablePosts } from '@/lib/workerMapItems';
import { IS_WEB } from '@/lib/webPressableStyles';
import { fontRegular, useThemedStyles } from '@/theme';

export default function ClinicDiscoverScreen() {
  const { user } = useAuth();
  const { clinicProfile } = useClinicProfile();
  const { billing, upgradePrompt, showDiscoverUpgrade } = useClinicUpgradePrompt();
  const { isTablet, isWide } = useResponsiveLayout();
  const { tab, returnTo } = useLocalSearchParams<{ tab?: string; returnTo?: string }>();
  const province = clinicProfile?.province?.trim() || null;
  const hasProvince = Boolean(province);
  const discoverLocked = billing != null && !billing.canUseClinicDiscover;
  const [selectedTab, setSelectedTab] = useState<ClinicDiscoverTab>('roles');
  const [viewMode, setViewMode] = useState<WorkerBrowseViewMode>('list');
  const [jobs, setJobs] = useState<LiveJobPost[]>([]);
  const [shifts, setShifts] = useState<LiveShiftPost[]>([]);
  const [searchQuery, setSearchQuery] = useState(DEFAULT_CLINIC_DISCOVER_FILTERS.searchQuery);
  const [roleTypeFilter, setRoleTypeFilter] = useState<RoleTypeFilter>(
    DEFAULT_CLINIC_DISCOVER_FILTERS.roleTypeFilter,
  );
  const [sort, setSort] = useState<ClinicDiscoverSort>(() =>
    getDefaultClinicDiscoverSort(clinicProfile),
  );
  const [distanceFilter, setDistanceFilter] = useState<WorkerDistanceFilter>(
    DEFAULT_CLINIC_DISCOVER_FILTERS.distanceFilter,
  );
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const hasCachedData = jobs.length > 0 || shifts.length > 0;

  useEffect(() => {
    if (tab === 'roles' || tab === 'fill-ins') {
      setSelectedTab(tab);
    }
  }, [tab]);

  useEffect(() => {
    setSort(getDefaultClinicDiscoverSort(clinicProfile));
  }, [clinicProfile?.latitude, clinicProfile?.longitude]);

  const handleSelectTab = useCallback((next: ClinicDiscoverTab) => {
    setSelectedTab(next);
    router.setParams({ tab: next });
  }, []);

  const filtersState = useMemo(
    () => ({
      searchQuery,
      roleTypeFilter,
      sort,
      distanceFilter,
    }),
    [distanceFilter, roleTypeFilter, searchQuery, sort],
  );

  const styles = useThemedStyles(({ colors, spacing }) => ({
    wrap: {
      gap: spacing.lg,
    },
    wrapFill: {
      flex: 1,
      minHeight: 0,
    },
    panelFill: {
      flex: 1,
      minHeight: 0,
    },
    controlsBlock: {
      width: '100%',
      flexShrink: 0,
      gap: spacing.md,
    },
    searchRow: {
      width: '100%',
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    searchField: {
      flex: 1,
      minWidth: 0,
    },
    cardList: {
      gap: dashboardSectionGap(spacing),
    },
    resultsMeta: {
      fontSize: 13,
      lineHeight: 18,
      fontFamily: fontRegular,
      color: colors.labelTertiary,
    },
    mapPanel: {
      width: '100%',
      overflow: 'hidden',
      flex: 1,
      minHeight: 0,
    },
  }));

  const load = useCallback(async () => {
    if (!user?.id || discoverLocked || !province) {
      setJobs([]);
      setShifts([]);
      setIsLoading(false);
      return;
    }

    const showFullLoading = !hasCachedData;
    if (showFullLoading) setIsLoading(true);
    setLoadError(false);

    try {
      const [jobRows, shiftRows] = await Promise.all([
        listClinicDiscoverJobPosts(province, user.id),
        listClinicDiscoverShiftPosts(province, user.id),
      ]);
      setJobs(jobRows);
      setShifts(shiftRows);
    } catch (error) {
      setLoadError(true);
      if (!hasCachedData) {
        setJobs([]);
        setShifts([]);
      }
      Alert.alert(
        'Could not load discover',
        error instanceof Error ? error.message : 'Please try again.',
      );
    } finally {
      setIsLoading(false);
    }
  }, [discoverLocked, hasCachedData, province, user?.id]);

  useRefreshOnFocus(load);
  const { refreshing, onRefresh } = usePullToRefresh(load);

  const filteredJobs = useMemo(
    () => filterClinicDiscoverJobs(jobs, clinicProfile, filtersState),
    [clinicProfile, filtersState, jobs],
  );

  const filteredShifts = useMemo(
    () => filterClinicDiscoverShifts(shifts, clinicProfile, filtersState),
    [clinicProfile, filtersState, shifts],
  );

  const hasSearch = hasActiveListSearch(searchQuery);
  const filterChangeCount = countClinicDiscoverFilterChanges(filtersState);
  const hasActiveFilters = filterChangeCount > 0;
  const activeList = selectedTab === 'roles' ? filteredJobs : filteredShifts;
  const sourceCount = selectedTab === 'roles' ? jobs.length : shifts.length;
  const filtersDisabled = isLoading || !hasProvince || sourceCount === 0;

  const clearFilters = useCallback(() => {
    setSearchQuery(DEFAULT_CLINIC_DISCOVER_FILTERS.searchQuery);
    setRoleTypeFilter(DEFAULT_CLINIC_DISCOVER_FILTERS.roleTypeFilter);
    setSort(getDefaultClinicDiscoverSort(clinicProfile));
    setDistanceFilter(DEFAULT_CLINIC_DISCOVER_FILTERS.distanceFilter);
  }, [clinicProfile]);

  const discoverReturnTo: ClinicDiscoverReturnTarget =
    returnTo === 'fill-ins-tab' || returnTo === 'postings-tab'
      ? returnTo
      : tab === 'fill-ins'
        ? 'fill-ins-tab'
        : 'postings-tab';
  const discoverBackLabel = discoverReturnTo === 'fill-ins-tab' ? 'Fill-ins' : 'Roles';

  const discoverTabs = useMemo(
    () => [
      {
        value: 'roles' as const,
        label: 'Roles',
        count: jobs.length,
        accent: 'primary' as const,
        icon: 'briefcase-outline' as const,
      },
      {
        value: 'fill-ins' as const,
        label: 'Fill-ins',
        count: shifts.length,
        accent: 'secondary' as const,
        icon: FILL_IN_ICON.outline,
      },
    ],
    [jobs.length, shifts.length],
  );

  const viewerCoords =
    clinicProfile?.latitude != null && clinicProfile?.longitude != null
      ? { latitude: clinicProfile.latitude, longitude: clinicProfile.longitude }
      : null;

  const mapItems = useMemo(
    () =>
      selectedTab === 'roles'
        ? toDiscoverMapItemsFromJobs(filteredJobs)
        : toDiscoverMapItemsFromShifts(filteredShifts),
    [filteredJobs, filteredShifts, selectedTab],
  );
  const mapGroups = useMemo(() => groupDiscoverMapItemsByClinic(mapItems), [mapItems]);
  const unmappableCount = useMemo(
    () => countUnmappablePosts(selectedTab === 'roles' ? filteredJobs : filteredShifts),
    [filteredJobs, filteredShifts, selectedTab],
  );

  // Match Roles/Fill-ins: enter map mode whenever there are listings (map still renders
  // when clinics lack coordinates — pins may be empty with an unmappable notice).
  const hasMapResults = !isLoading && activeList.length > 0 && viewMode === 'map';
  const useWebSplitMap = IS_WEB && isWide && viewMode === 'map' && activeList.length > 0;
  const fillMapViewport = hasMapResults && !useWebSplitMap;

  const resultsMeta =
    !isLoading && sourceCount > 0 && activeList.length > 0
      ? `${activeList.length} ${selectedTab === 'roles' ? (activeList.length === 1 ? 'role' : 'roles') : activeList.length === 1 ? 'fill-in' : 'fill-ins'} · ${getClinicDiscoverSortLabel(sort)}`
      : null;

  const mapElement =
    province != null ? (
      <WorkerBrowseMap
        groups={mapGroups}
        workerCoords={viewerCoords}
        province={province}
        unmappableCount={unmappableCount}
        workerHasCoordinates={viewerCoords != null}
        onSelectItem={(item) =>
          router.push(
            item.kind === 'job'
              ? getClinicDiscoverJobDetailRoute(item.id)
              : getClinicDiscoverShiftDetailRoute(item.id),
          )
        }
      />
    ) : null;

  const listContent =
    selectedTab === 'roles' ? (
      <View style={styles.cardList}>
        <ResponsiveGrid maxColumns={useWebSplitMap ? 1 : 2}>
          {filteredJobs.map((job) => (
            <RoleListingCard
              key={job.id}
              job={job}
              distanceLabel={job.distanceLabel}
              onPress={() => router.push(getClinicDiscoverJobDetailRoute(job.id))}
            />
          ))}
        </ResponsiveGrid>
      </View>
    ) : (
      <View style={styles.cardList}>
        <ResponsiveGrid maxColumns={useWebSplitMap ? 1 : 2}>
          {filteredShifts.map((shift) => (
            <FillInListingCard
              key={shift.id}
              shift={shift}
              distanceLabel={shift.distanceLabel}
              onPress={() => router.push(getClinicDiscoverShiftDetailRoute(shift.id))}
            />
          ))}
        </ResponsiveGrid>
      </View>
    );

  const discoverPanelContent = !hasProvince ? (
    <EmptyState
      embedded
      icon="location-outline"
      title="Add your clinic province"
      message="Discover shows live roles and fill-ins from other clinics in your province."
      ctaLabel="Update practice profile"
      onCtaPress={() => router.push(CLINIC_PROFILE_PRACTICE)}
    />
  ) : isLoading && !hasCachedData ? (
    <PageLoadingList message="Loading discover…" />
  ) : sourceCount === 0 ? (
    <EmptyState
      embedded
      icon={selectedTab === 'roles' ? 'briefcase-outline' : FILL_IN_ICON.outline}
      title={
        selectedTab === 'roles' ? 'No other clinic roles yet' : 'No other clinic fill-ins yet'
      }
      message="When other clinics in your province post live opportunities, they will appear here."
    />
  ) : activeList.length === 0 ? (
    <EmptyState
      embedded
      icon="filter-outline"
      title={
        hasSearch || hasActiveFilters ? 'No listings match your search' : 'No listings in this view'
      }
      message="Try a different search or filter."
      ctaLabel={hasActiveFilters ? 'Clear filters' : undefined}
      onCtaPress={hasActiveFilters ? clearFilters : undefined}
    />
  ) : useWebSplitMap && mapElement ? (
    <WorkerBrowseWebLayout showMap list={listContent} map={mapElement} />
  ) : (
    <WorkerBrowseViewTransition
      mode={hasMapResults ? 'map' : 'list'}
      style={hasMapResults ? styles.mapPanel : undefined}>
      {hasMapResults && mapElement ? mapElement : listContent}
    </WorkerBrowseViewTransition>
  );

  return (
    <>
      {upgradePrompt}
      <Screen
        title="Discover"
        subtitle="Live roles and fill-ins posted by other clinics in your province."
        fillsContainer={fillMapViewport}
        scroll={!fillMapViewport}
        scrollEnabled={!fillMapViewport}
        refreshing={
          fillMapViewport || discoverLocked || !hasProvince ? undefined : refreshing
        }
        onRefresh={
          fillMapViewport || discoverLocked || !hasProvince ? undefined : onRefresh
        }
        onBack={
          isTablet
            ? undefined
            : () => navigateAfterClinicDiscover(router, discoverReturnTo, selectedTab)
        }
        backLabel={discoverBackLabel}>
        {discoverLocked ? (
          <EmptyState
            icon="lock-closed-outline"
            title="Discover is on Starter and Pro"
            message="Browse live roles and fill-ins from other clinics in your province after you upgrade."
            ctaLabel="View plans"
            onCtaPress={showDiscoverUpgrade}
          />
        ) : (
          <View style={[styles.wrap, fillMapViewport ? styles.wrapFill : null]}>
            {loadError ? <DashboardErrorBanner onRetry={() => void load()} /> : null}

            <View style={styles.controlsBlock}>
              <View style={styles.searchRow}>
                <View style={styles.searchField}>
                  <WorkerBrowseSearchBar
                    value={searchQuery}
                    onChange={setSearchQuery}
                    placeholder={
                      selectedTab === 'roles'
                        ? 'Search roles or clinics'
                        : 'Search fill-ins or clinics'
                    }
                    accessibilityLabel="Search discover"
                    disabled={filtersDisabled}
                  />
                </View>
                {hasProvince && sourceCount > 0 ? (
                  <WorkerBrowseViewToggle selected={viewMode} onChange={setViewMode} />
                ) : null}
                <ClinicDiscoverFilters
                  roleTypeFilter={roleTypeFilter}
                  sort={sort}
                  distanceFilter={distanceFilter}
                  onRoleTypeChange={setRoleTypeFilter}
                  onSortChange={setSort}
                  onDistanceFilterChange={setDistanceFilter}
                  accessibilityLabel="Filter discover"
                  sheetTitle="Filter discover"
                  disabled={filtersDisabled}
                />
              </View>
              {resultsMeta ? <Text style={styles.resultsMeta}>{resultsMeta}</Text> : null}
            </View>

            <View style={fillMapViewport ? styles.panelFill : undefined}>
              <FileTabWell
                tabs={discoverTabs}
                selected={selectedTab}
                onSelect={handleSelectTab}
                fillHeight={fillMapViewport}
              >
                {discoverPanelContent}
              </FileTabWell>
            </View>
          </View>
        )}
      </Screen>
    </>
  );
}
