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
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Alert, Pressable, Text, useWindowDimensions, View, type LayoutChangeEvent } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { HiringCelebrationModal } from '@/components/celebration/HiringCelebrationModal';
import { WorkerFillInBrowseFilters } from '@/components/clinic/PostingFilters';
import { useMobileTabDockInset } from '@/components/navigation/mobileTabDockInset';
import { DashboardEmptyState } from '@/components/dashboard/DashboardEmptyState';
import { dashboardSectionGap } from '@/components/dashboard/dashboardLayout';
import { DashboardSectionHeader } from '@/components/dashboard/DashboardSectionHeader';
import { AvailabilityScheduleSummary } from '@/components/worker/AvailabilityScheduleSummary';
import { FillInModePanel } from '@/components/worker/FillInModePanel';
import { FillInListingCard } from '@/components/worker/FillInListingCard';
import { WorkerBrowseMap } from '@/components/worker/WorkerBrowseMap';
import { WorkerBrowseViewToggle } from '@/components/worker/WorkerBrowseViewToggle';
import { WorkerBrowseViewTransition } from '@/components/worker/WorkerBrowseViewTransition';
import { WorkerBrowseSearchBar } from '@/components/worker/WorkerBrowseSearchBar';
import { EditPillButton } from '@/components/ui/EditPillButton';
import { PageLoadingList } from '@/components/ui/PageLoadingState';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { SurfaceCard } from '@/components/ui/SurfaceCard';
import { WorkerApplicationListCard } from '@/components/worker/WorkerApplicationListCard';
import { Screen } from '@/components/ui/Screen';
import { useApplicationTabBadge } from '@/contexts/ApplicationTabBadgeContext';
import { useAuth } from '@/contexts/AuthContext';
import { useWorkerProfile } from '@/contexts/WorkerProfileContext';
import { useHiringCelebration } from '@/hooks/useHiringCelebration';
import { useRefreshOnFocus } from '@/hooks/useRefreshOnFocus';
import { useMarkGetStartedBrowseVisit } from '@/hooks/useMarkGetStartedBrowseVisit';
import { useRefreshOnForeground } from '@/hooks/useRefreshOnForeground';
import { useWorkerHiringCelebration } from '@/hooks/useWorkerHiringCelebration';
import {
  FILL_INS_TAB_MODE_OPTIONS,
  partitionWorkerShiftApplications,
  type FillInsTabMode,
} from '@/lib/fillInFilters';
import type { WorkerBrowseViewMode } from '@/lib/postingFilters';
import { toShiftCelebrationCandidates } from '@/lib/hiringCelebrationCandidates';
import {
  DEFAULT_WORKER_FILLIN_BROWSE_FILTERS,
  filterAndSortLiveShifts,
} from '@/lib/workerBrowseFilters';
import {
  getWorkerShiftDetailRoute,
  WORKER_PAST_FILLINS,
  WORKER_SETUP_AVAILABILITY_SCHEDULE,
} from '@/lib/routing';
import {
  countUnmappablePosts,
  groupWorkerMapItemsByClinic,
  toWorkerMapItemsFromShifts,
} from '@/lib/workerMapItems';
import { getWorkerMapPanelHeight } from '@/lib/workerMapRegion';
import { webHover, webPointer, webTextLinkHoverStyles } from '@/lib/webPressableStyles';
import { useTheme, useThemedStyles } from '@/theme';

function navigateToEditSchedule() {
  router.push(WORKER_SETUP_AVAILABILITY_SCHEDULE);
}

export default function FillInsScreen() {
  useMarkGetStartedBrowseVisit('fillIns');
  const { colors } = useTheme();
  const { user } = useAuth();
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
  const [controlsHeight, setControlsHeight] = useState(132);
  const { height: windowHeight } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const tabDockInset = useMobileTabDockInset();
  const { celebrationVisible, celebrationPayload, showCelebration, closeCelebration } =
    useHiringCelebration();
  const { checkApplications } = useWorkerHiringCelebration(showCelebration);
  const { markShiftPostsSeen, markApplicationsSeen } = useApplicationTabBadge();

  const load = useCallback(async () => {
    setIsLoading(true);
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
      Alert.alert('Could not load fill-ins', 'Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [checkApplications, markApplicationsSeen, markShiftPostsSeen, province, user?.id]);

  useRefreshOnFocus(load);
  useRefreshOnForeground(load);

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

  const { upcomingConfirmed, pastConfirmed, pastInProgress, upcomingInProgress } = useMemo(
    () => partitionWorkerShiftApplications(applications),
    [applications],
  );
  const pastFillInCount = pastConfirmed.length + pastInProgress.length;
  const activeFillInCount = upcomingConfirmed.length + upcomingInProgress.length;
  const mapGroups = useMemo(
    () =>
      groupWorkerMapItemsByClinic(toWorkerMapItemsFromShifts(filteredShifts, savedShiftIds)),
    [filteredShifts, savedShiftIds],
  );
  const unmappableShiftCount = useMemo(() => countUnmappablePosts(filteredShifts), [filteredShifts]);
  const workerCoords =
    workerProfile?.latitude != null && workerProfile?.longitude != null
      ? { latitude: workerProfile.latitude, longitude: workerProfile.longitude }
      : null;
  const useMapLayout = selectedMode === 'open' && viewMode === 'map';
  const showOpenMap =
    useMapLayout && !isLoading && filteredShifts.length > 0;

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

  const fillInsAvailable = workerProfile?.short_notice_available ?? false;

  const styles = useThemedStyles(({ spacing, typography, colors }) => ({
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
    viewAllRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: spacing.sm,
      paddingVertical: spacing.sm,
      borderRadius: 10,
      ...webPointer(),
    },
    viewAllRowHovered: webTextLinkHoverStyles(colors),
    viewAllLabel: {
      ...typography.body,
      fontSize: 15,
      fontWeight: '600',
      color: colors.primary,
    },
    daysCardMuted: {
      opacity: 0.55,
    },
    scheduleHeader: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      gap: spacing.md,
    },
    scheduleHeaderText: {
      flex: 1,
      gap: spacing.xs,
    },
    scheduleTitle: {
      fontSize: 17,
      fontWeight: '600',
      letterSpacing: -0.2,
      color: colors.labelPrimary,
    },
    scheduleSubtitle: {
      ...typography.subtitle,
      fontSize: 14,
      lineHeight: 20,
      color: colors.labelSecondary,
    },
  }));

  return (
    <>
      <Screen
        title="Fill-ins"
        subtitle="Temp shifts and your availability."
        scroll
        scrollEnabled={!showOpenMap}
      >
        <View style={styles.content}>
          <View style={styles.controlsBlock} onLayout={handleControlsLayout}>
            <View style={styles.controlRow}>
              <SegmentedControl
                options={FILL_INS_TAB_MODE_OPTIONS}
                selected={selectedMode}
                onChange={setSelectedMode}
                density="compact"
              />
            </View>
            {selectedMode === 'open' && !isLoading && shifts.length > 0 ? (
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
            ) : null}
          </View>

          {selectedMode === 'open' ? (
            <WorkerBrowseViewTransition
              mode={showOpenMap ? 'map' : 'list'}
              style={showOpenMap ? [styles.mapPanel, { height: mapPanelHeight }] : undefined}
            >
              {showOpenMap ? (
                <WorkerBrowseMap
                  groups={mapGroups}
                  workerCoords={workerCoords}
                  province={province}
                  unmappableCount={unmappableShiftCount}
                  workerHasCoordinates={workerCoords != null}
                  onSelectItem={(item) =>
                    router.push(getWorkerShiftDetailRoute(item.id, 'fill-ins-tab'))
                  }
                />
              ) : (
                <View style={styles.panel}>
                  {isLoading ? (
                    <PageLoadingList rowCount={4} />
                  ) : filteredShifts.length === 0 ? (
                    <DashboardEmptyState
                      icon="calendar-outline"
                      title={
                        hasActiveFillInFilters ? 'No fill-ins match your search' : 'No open fill-ins'
                      }
                      message={
                        hasActiveFillInFilters
                          ? 'Try a different search term or adjust your filters.'
                          : 'New temp shifts in your province will appear here.'
                      }
                    />
                  ) : (
                    <View style={styles.cardList}>
                      {filteredShifts.map((shift) => (
                        <FillInListingCard
                          key={shift.id}
                          shift={shift}
                          distanceLabel={shift.distanceLabel}
                          isSaved={savedShiftIds.has(shift.id)}
                          onToggleSaved={() =>
                            void handleToggleSavedShift(shift.id, !savedShiftIds.has(shift.id))
                          }
                          onPress={() =>
                            router.push(getWorkerShiftDetailRoute(shift.id, 'fill-ins-tab'))
                          }
                        />
                      ))}
                    </View>
                  )}
                </View>
              )}
            </WorkerBrowseViewTransition>
          ) : null}

          {selectedMode === 'confirmed' ? (
            <View style={styles.panel}>
              {isLoading ? (
                <PageLoadingList rowCount={3} />
              ) : activeFillInCount === 0 ? (
                <DashboardEmptyState
                  icon="document-text-outline"
                  title="No fill-in shifts yet"
                  message="Request to cover an open shift and track it here."
                />
              ) : (
                <>
                  {upcomingConfirmed.length > 0 ? (
                    <View style={styles.applicationGroup}>
                      <DashboardSectionHeader title="Upcoming confirmed" compact />
                      {upcomingConfirmed.map((application) => (
                        <WorkerApplicationListCard
                          key={application.id}
                          application={application}
                          returnTo="fill-ins-tab"
                        />
                      ))}
                    </View>
                  ) : null}
                  {upcomingInProgress.length > 0 ? (
                    <View style={styles.applicationGroup}>
                      <DashboardSectionHeader title="In progress" compact />
                      {upcomingInProgress.map((application) => (
                        <WorkerApplicationListCard
                          key={application.id}
                          application={application}
                          returnTo="fill-ins-tab"
                        />
                      ))}
                    </View>
                  ) : null}
                </>
              )}
              {!isLoading && pastFillInCount > 0 ? (
                <Pressable
                  accessibilityRole="button"
                  style={({ pressed, hovered }) => [
                    styles.viewAllRow,
                    webHover(hovered, pressed, styles.viewAllRowHovered),
                    pressed && { opacity: 0.75 },
                  ]}
                  onPress={() => router.push(WORKER_PAST_FILLINS)}
                >
                  <Text style={styles.viewAllLabel}>
                    View {pastFillInCount} past fill-in{pastFillInCount === 1 ? '' : 's'}
                  </Text>
                  <Ionicons name="chevron-forward" size={16} color={colors.primary} />
                </Pressable>
              ) : null}
            </View>
          ) : null}

          {selectedMode === 'availability' ? (
            <View style={styles.panel}>
              <SurfaceCard padding="none">
                <FillInModePanel variant="grouped" />
              </SurfaceCard>
              <SurfaceCard
                padding="md"
                gap
                style={!fillInsAvailable ? styles.daysCardMuted : undefined}
              >
                <View style={styles.scheduleHeader}>
                  <View style={styles.scheduleHeaderText}>
                    <Text style={styles.scheduleTitle}>Available days</Text>
                    <Text style={styles.scheduleSubtitle}>
                      {fillInsAvailable
                        ? 'The days and hours you can cover fill-in shifts. Used to filter alerts when you choose matching days only.'
                        : 'Turn on fill-ins above, then choose which days and hours you can cover temp shifts.'}
                    </Text>
                  </View>
                  <EditPillButton label="Edit days" onPress={navigateToEditSchedule} />
                </View>
                <AvailabilityScheduleSummary blocks={availabilityBlocks} variant="grouped" />
              </SurfaceCard>
            </View>
          ) : null}
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
