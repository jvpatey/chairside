import {
  listLiveShiftPosts,
  listWorkerShiftApplications,
  isPastWorkerFillInApplication,
  getWorkerSavedShiftPostIds,
  saveShiftPost,
  unsaveShiftPost,
  type LiveShiftPost,
  type WorkerApplication,
} from '@chairside/api';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  useWindowDimensions,
  View,
  type LayoutChangeEvent,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { HiringCelebrationModal } from '@/components/celebration/HiringCelebrationModal';
import { WorkerFillInBrowseFilters } from '@/components/clinic/PostingFilters';
import { useMobileTabDockInset } from '@/components/navigation/mobileTabDockInset';
import { DashboardEmptyState } from '@/components/dashboard/DashboardEmptyState';
import { DashboardErrorBanner } from '@/components/dashboard/DashboardErrorBanner';
import { dashboardSectionGap } from '@/components/dashboard/dashboardLayout';
import { DashboardSectionHeader } from '@/components/dashboard/DashboardSectionHeader';
import { FillInAvailabilitySummaryCard } from '@/components/worker/FillInAvailabilitySummaryCard';
import { FillInListingCard } from '@/components/worker/FillInListingCard';
import { WorkerBrowseWebLayout } from '@/components/web/browse/WorkerBrowseWebLayout';
import { WorkerBrowseMap } from '@/components/worker/WorkerBrowseMap';
import { WorkerBrowseViewToggle } from '@/components/worker/WorkerBrowseViewToggle';
import { WorkerBrowseViewTransition } from '@/components/worker/WorkerBrowseViewTransition';
import { WorkerBrowseSearchBar } from '@/components/worker/WorkerBrowseSearchBar';
import { PageLoadingList } from '@/components/ui/PageLoadingState';
import { FileTabWell } from '@/components/dashboard/FileTabWell';
import { StaggeredList } from '@/components/ui/StaggeredList';
import { WorkerApplicationListCard } from '@/components/worker/WorkerApplicationListCard';
import { Screen } from '@/components/ui/Screen';
import { useApplicationTabBadge } from '@/contexts/ApplicationTabBadgeContext';
import { useAuth } from '@/contexts/AuthContext';
import { useWorkerProfile } from '@/contexts/WorkerProfileContext';
import { useHiringCelebration } from '@/hooks/useHiringCelebration';
import { usePullToRefresh } from '@/hooks/usePullToRefresh';
import { useRefreshOnFocus } from '@/hooks/useRefreshOnFocus';
import { useMarkGetStartedBrowseVisit } from '@/hooks/useMarkGetStartedBrowseVisit';
import { useRefreshOnForeground } from '@/hooks/useRefreshOnForeground';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';
import { useWorkerHiringCelebration } from '@/hooks/useWorkerHiringCelebration';
import {
  partitionWorkerShiftApplications,
  type FillInsTabMode,
} from '@/lib/fillInFilters';
import { FILL_IN_ICON } from '@/lib/fillInIcons';
import { redirectEmbeddedCalendarDeepLink } from '@/lib/calendarNavigation';
import type { WorkerBrowseViewMode } from '@/lib/postingFilters';
import { toShiftCelebrationCandidates } from '@/lib/hiringCelebrationCandidates';
import {
  DEFAULT_WORKER_FILLIN_BROWSE_FILTERS,
  filterAndSortLiveShifts,
} from '@/lib/workerBrowseFilters';
import { getWorkerShiftDetailRoute } from '@/lib/routing';
import {
  countUnmappablePosts,
  groupWorkerMapItemsByClinic,
  toWorkerMapItemsFromShifts,
} from '@/lib/workerMapItems';
import { getWorkerMapPanelHeight } from '@/lib/workerMapRegion';
import { IS_WEB } from '@/lib/webPressableStyles';
import { useThemedStyles } from '@/theme';

export default function FillInsScreen() {
  useMarkGetStartedBrowseVisit('fillIns');
  const { user } = useAuth();
  const params = useLocalSearchParams<{ mode?: string; date?: string; tab?: string }>();
  const { workerProfile, availabilityBlocks } = useWorkerProfile();
  const province = workerProfile?.province ?? 'NS';
  const [selectedMode, setSelectedMode] = useState<FillInsTabMode>('open');
  const [viewMode, setViewMode] = useState<WorkerBrowseViewMode>('list');
  const [searchQuery, setSearchQuery] = useState(DEFAULT_WORKER_FILLIN_BROWSE_FILTERS.searchQuery);
  const [roleTypeFilter, setRoleTypeFilter] = useState(
    DEFAULT_WORKER_FILLIN_BROWSE_FILTERS.roleTypeFilter,
  );
  const [sort, setSort] = useState(DEFAULT_WORKER_FILLIN_BROWSE_FILTERS.sort);
  const [distanceFilter, setDistanceFilter] = useState(
    DEFAULT_WORKER_FILLIN_BROWSE_FILTERS.distanceFilter,
  );
  const [softwareFilter, setSoftwareFilter] = useState(
    DEFAULT_WORKER_FILLIN_BROWSE_FILTERS.softwareFilter,
  );
  const [payListedFilter, setPayListedFilter] = useState(
    DEFAULT_WORKER_FILLIN_BROWSE_FILTERS.payListedFilter,
  );
  const [availabilityFilter, setAvailabilityFilter] = useState(
    DEFAULT_WORKER_FILLIN_BROWSE_FILTERS.availabilityFilter,
  );
  const [savedOnlyFilter, setSavedOnlyFilter] = useState(
    DEFAULT_WORKER_FILLIN_BROWSE_FILTERS.savedOnlyFilter,
  );
  const [savedShiftIds, setSavedShiftIds] = useState<Set<string>>(new Set());
  const [shifts, setShifts] = useState<LiveShiftPost[]>([]);
  const [applications, setApplications] = useState<WorkerApplication[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [controlsHeight, setControlsHeight] = useState(132);
  const { height: windowHeight } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const tabDockInset = useMobileTabDockInset();
  const { isWide } = useResponsiveLayout();
  const { celebrationVisible, celebrationPayload, showCelebration, closeCelebration } =
    useHiringCelebration();
  const { checkApplications } = useWorkerHiringCelebration(showCelebration);
  const { markShiftPostsSeen, markApplicationsSeen } = useApplicationTabBadge();

  const load = useCallback(async () => {
    setIsLoading(true);
    setLoadError(false);
    try {
      const [shiftRows, applicationRows, savedIds] = await Promise.all([
        listLiveShiftPosts(province),
        user?.id ? listWorkerShiftApplications(user.id) : Promise.resolve([]),
        user?.id ? getWorkerSavedShiftPostIds(user.id) : Promise.resolve(new Set<string>()),
      ]);
      setShifts(shiftRows);
      setApplications(applicationRows);
      setSavedShiftIds(savedIds);
      await markShiftPostsSeen(shiftRows.map((shift) => shift.id));

      const pastShiftApplications = applicationRows.filter(isPastWorkerFillInApplication);
      if (pastShiftApplications.length > 0) {
        await markApplicationsSeen(pastShiftApplications.map((application) => application.id));
      }

      await checkApplications(toShiftCelebrationCandidates(applicationRows));
    } catch {
      setShifts([]);
      setApplications([]);
      setSavedShiftIds(new Set());
      setLoadError(true);
    } finally {
      setIsLoading(false);
    }
  }, [checkApplications, markApplicationsSeen, markShiftPostsSeen, province, user?.id]);

  useRefreshOnFocus(load);
  const { refreshing, onRefresh } = usePullToRefresh(load);
  useRefreshOnForeground(load);

  useEffect(() => {
    const redirect = redirectEmbeddedCalendarDeepLink(
      params.mode,
      typeof params.date === 'string' ? params.date : undefined,
      'worker',
    );
    if (redirect) {
      router.replace(redirect);
    }
  }, [params.date, params.mode]);

  useEffect(() => {
    const tab = params.tab;
    if (tab === 'open' || tab === 'confirmed' || tab === 'history') {
      setSelectedMode(tab);
      return;
    }
    if (tab === 'availability') {
      setSelectedMode('open');
    }
  }, [params.tab]);

  const filteredShifts = useMemo(
    () =>
      filterAndSortLiveShifts(shifts, workerProfile, availabilityBlocks, {
        searchQuery,
        roleTypeFilter,
        sort,
        distanceFilter,
        softwareFilter,
        payListedFilter,
        availabilityFilter,
        savedOnlyFilter,
      }).filter((shift) => savedOnlyFilter !== 'saved_only' || savedShiftIds.has(shift.id)),
    [
      availabilityBlocks,
      availabilityFilter,
      distanceFilter,
      payListedFilter,
      roleTypeFilter,
      savedOnlyFilter,
      savedShiftIds,
      searchQuery,
      shifts,
      softwareFilter,
      sort,
      workerProfile,
    ],
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

  const hasActiveFillInFilters =
    searchQuery.trim().length > 0 ||
    roleTypeFilter !== DEFAULT_WORKER_FILLIN_BROWSE_FILTERS.roleTypeFilter ||
    sort !== DEFAULT_WORKER_FILLIN_BROWSE_FILTERS.sort ||
    distanceFilter !== DEFAULT_WORKER_FILLIN_BROWSE_FILTERS.distanceFilter ||
    softwareFilter !== DEFAULT_WORKER_FILLIN_BROWSE_FILTERS.softwareFilter ||
    payListedFilter !== DEFAULT_WORKER_FILLIN_BROWSE_FILTERS.payListedFilter ||
    availabilityFilter !== DEFAULT_WORKER_FILLIN_BROWSE_FILTERS.availabilityFilter ||
    savedOnlyFilter !== DEFAULT_WORKER_FILLIN_BROWSE_FILTERS.savedOnlyFilter;

  const {
    upcomingConfirmed,
    pastConfirmed,
    pastInProgress,
    upcomingInProgress,
    cancelledApplications,
    declinedApplications,
  } = useMemo(() => partitionWorkerShiftApplications(applications), [applications]);
  const activeFillInCount = upcomingConfirmed.length + upcomingInProgress.length;
  const historyFillInCount =
    cancelledApplications.length +
    declinedApplications.length +
    pastConfirmed.length +
    pastInProgress.length;
  const mapGroups = useMemo(
    () => groupWorkerMapItemsByClinic(toWorkerMapItemsFromShifts(filteredShifts, savedShiftIds)),
    [filteredShifts, savedShiftIds],
  );
  const unmappableShiftCount = useMemo(
    () => countUnmappablePosts(filteredShifts),
    [filteredShifts],
  );
  const workerCoords =
    workerProfile?.latitude != null && workerProfile?.longitude != null
      ? { latitude: workerProfile.latitude, longitude: workerProfile.longitude }
      : null;
  const canUseMap = selectedMode === 'open';
  const useMapLayout = canUseMap && viewMode === 'map';
  const showOpenMap = useMapLayout && !isLoading && filteredShifts.length > 0;
  const useWebSplitMap =
    IS_WEB && isWide && useMapLayout && !isLoading && filteredShifts.length > 0;

  useEffect(() => {
    if (!canUseMap && viewMode === 'map') {
      setViewMode('list');
    }
  }, [canUseMap, viewMode]);

  const mapPanelHeight = useMemo(
    () => getWorkerMapPanelHeight(windowHeight, insets.top, tabDockInset, controlsHeight),
    [controlsHeight, insets.top, tabDockInset, windowHeight],
  );

  const mapElement = (
    <WorkerBrowseMap
      groups={mapGroups}
      workerCoords={workerCoords}
      province={province}
      unmappableCount={unmappableShiftCount}
      workerHasCoordinates={workerCoords != null}
      onSelectItem={(item) => router.push(getWorkerShiftDetailRoute(item.id, 'fill-ins-tab'))}
    />
  );

  const handleControlsLayout = (event: LayoutChangeEvent) => {
    const { height } = event.nativeEvent.layout;
    if (height > 0) {
      setControlsHeight((current) => (current === height ? current : height));
    }
  };

  const styles = useThemedStyles(({ spacing }) => ({
    content: { gap: spacing.lg },
    panel: { gap: spacing.lg },
    cardList: { gap: dashboardSectionGap(spacing) },
    browseControlsRow: {
      width: '100%',
      flexShrink: 0,
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
    },
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
    searchField: { flex: 1, minWidth: 0 },
    mapPanel: {
      width: '100%',
      overflow: 'hidden',
    },
    applicationGroup: { gap: spacing.sm },
  }));

  const fillInTabs = useMemo(
    () => [
      {
        value: 'open' as const,
        label: 'Open',
        count: filteredShifts.length,
        accent: 'secondary' as const,
        icon: FILL_IN_ICON.outline,
      },
      {
        value: 'confirmed' as const,
        label: 'Confirmed',
        count: activeFillInCount,
        accent: 'secondary' as const,
        icon: 'checkmark-circle-outline' as const,
      },
      {
        value: 'history' as const,
        label: 'History',
        count: historyFillInCount,
        accent: 'secondary' as const,
        icon: 'time-outline' as const,
      },
    ],
    [activeFillInCount, filteredShifts.length, historyFillInCount],
  );

  const openListContent = isLoading ? (
    <PageLoadingList rowCount={4} />
  ) : filteredShifts.length === 0 ? (
    <DashboardEmptyState
      embedded
      icon={FILL_IN_ICON.outline}
      title={hasActiveFillInFilters ? 'No fill-ins match your search' : 'No open fill-ins'}
      message={
        hasActiveFillInFilters
          ? 'Try a different search term or adjust your filters.'
          : 'New temp shifts in your province will appear here.'
      }
    />
  ) : (
    <View style={styles.cardList}>
      <StaggeredList>
        {filteredShifts.map((shift) => (
          <FillInListingCard
            key={shift.id}
            shift={shift}
            distanceLabel={shift.distanceLabel}
            isSaved={savedShiftIds.has(shift.id)}
            onToggleSaved={() =>
              void handleToggleSavedShift(shift.id, !savedShiftIds.has(shift.id))
            }
            onPress={() => router.push(getWorkerShiftDetailRoute(shift.id, 'fill-ins-tab'))}
          />
        ))}
      </StaggeredList>
    </View>
  );

  return (
    <>
      <Screen
        title="Fill-ins"
        subtitle="Temp shifts and your availability."
        scroll
        scrollEnabled={!showOpenMap}
        refreshing={refreshing}
        onRefresh={onRefresh}
        refreshAccent="secondary"
      >
        <View style={styles.content}>
          {loadError ? (
            <DashboardErrorBanner
              message="Could not load fill-ins."
              onRetry={() => void load()}
            />
          ) : null}
          <FillInAvailabilitySummaryCard />
          {selectedMode === 'open' && !isLoading && shifts.length > 0 ? (
            <View style={styles.controlsBlock} onLayout={handleControlsLayout}>
              <View style={styles.browseControlsRow}>
                <View style={styles.searchField}>
                  <WorkerBrowseSearchBar value={searchQuery} onChange={setSearchQuery} />
                </View>
                <WorkerBrowseViewToggle selected={viewMode} onChange={setViewMode} />
                <WorkerFillInBrowseFilters
                  roleTypeFilter={roleTypeFilter}
                  sort={sort}
                  distanceFilter={distanceFilter}
                  softwareFilter={softwareFilter}
                  payListedFilter={payListedFilter}
                  availabilityFilter={availabilityFilter}
                  savedOnlyFilter={savedOnlyFilter}
                  onRoleTypeChange={setRoleTypeFilter}
                  onSortChange={setSort}
                  onDistanceFilterChange={setDistanceFilter}
                  onSoftwareFilterChange={setSoftwareFilter}
                  onPayListedFilterChange={setPayListedFilter}
                  onAvailabilityFilterChange={setAvailabilityFilter}
                  onSavedOnlyFilterChange={setSavedOnlyFilter}
                />
              </View>
            </View>
          ) : null}

          <FileTabWell tabs={fillInTabs} selected={selectedMode} onSelect={setSelectedMode}>
            {selectedMode === 'open' ? (
              useWebSplitMap ? (
                <WorkerBrowseWebLayout showMap list={openListContent} map={mapElement} />
              ) : (
                <WorkerBrowseViewTransition
                  mode={showOpenMap ? 'map' : 'list'}
                  style={showOpenMap ? [styles.mapPanel, { height: mapPanelHeight }] : undefined}
                >
                  {showOpenMap ? mapElement : openListContent}
                </WorkerBrowseViewTransition>
              )
            ) : null}

            {selectedMode === 'confirmed' ? (
              isLoading ? (
                <PageLoadingList rowCount={3} />
              ) : activeFillInCount === 0 ? (
                <DashboardEmptyState
                  embedded
                  icon="document-text-outline"
                  title="No fill-in shifts yet"
                  message="Request to cover an open shift and track confirmed and in-progress fill-ins here."
                />
              ) : (
                <>
                  {upcomingConfirmed.length > 0 ? (
                    <View style={styles.applicationGroup}>
                      <DashboardSectionHeader title="Upcoming confirmed" compact />
                      <StaggeredList>
                        {upcomingConfirmed.map((application) => (
                          <WorkerApplicationListCard
                            key={application.id}
                            application={application}
                            returnTo="fill-ins-tab"
                          />
                        ))}
                      </StaggeredList>
                    </View>
                  ) : null}
                  {upcomingInProgress.length > 0 ? (
                    <View style={styles.applicationGroup}>
                      <DashboardSectionHeader title="In progress" compact />
                      <StaggeredList>
                        {upcomingInProgress.map((application) => (
                          <WorkerApplicationListCard
                            key={application.id}
                            application={application}
                            returnTo="fill-ins-tab"
                          />
                        ))}
                      </StaggeredList>
                    </View>
                  ) : null}
                </>
              )
            ) : null}

            {selectedMode === 'history' ? (
              isLoading ? (
                <PageLoadingList rowCount={3} />
              ) : historyFillInCount === 0 ? (
                <DashboardEmptyState
                  embedded
                  icon="time-outline"
                  title="No fill-in history yet"
                  message="Declined requests, cancelled shifts, and past fill-ins will appear here."
                />
              ) : (
                <>
                  {cancelledApplications.length > 0 ? (
                    <View style={styles.applicationGroup}>
                      <DashboardSectionHeader title="Cancelled" compact />
                      <StaggeredList>
                        {cancelledApplications.map((application) => (
                          <WorkerApplicationListCard
                            key={application.id}
                            application={application}
                            returnTo="fill-ins-tab"
                          />
                        ))}
                      </StaggeredList>
                    </View>
                  ) : null}
                  {declinedApplications.length > 0 ? (
                    <View style={styles.applicationGroup}>
                      <DashboardSectionHeader title="Declined" compact />
                      <StaggeredList>
                        {declinedApplications.map((application) => (
                          <WorkerApplicationListCard
                            key={application.id}
                            application={application}
                            returnTo="fill-ins-tab"
                          />
                        ))}
                      </StaggeredList>
                    </View>
                  ) : null}
                  {pastConfirmed.length > 0 ? (
                    <View style={styles.applicationGroup}>
                      <DashboardSectionHeader title="Past confirmed" compact />
                      <StaggeredList>
                        {pastConfirmed.map((application) => (
                          <WorkerApplicationListCard
                            key={application.id}
                            application={application}
                            returnTo="fill-ins-tab"
                          />
                        ))}
                      </StaggeredList>
                    </View>
                  ) : null}
                  {pastInProgress.length > 0 ? (
                    <View style={styles.applicationGroup}>
                      <DashboardSectionHeader title="Expired requests" compact />
                      <StaggeredList>
                        {pastInProgress.map((application) => (
                          <WorkerApplicationListCard
                            key={application.id}
                            application={application}
                            returnTo="fill-ins-tab"
                          />
                        ))}
                      </StaggeredList>
                    </View>
                  ) : null}
                </>
              )
            ) : null}
          </FileTabWell>
        </View>
      </Screen>
      <HiringCelebrationModal
        visible={celebrationVisible}
        payload={celebrationPayload}
        onClose={() => void closeCelebration()}
      />
    </>
  );
}
