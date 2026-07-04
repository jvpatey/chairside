import {
  getWorkerSavedShiftPostIds,
  listLiveShiftPosts,
  saveShiftPost,
  unsaveShiftPost,
  type LiveShiftPost,
} from '@chairside/api';
import { router } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Alert, View } from 'react-native';

import { WorkerFillInBrowseFilters } from '@/components/clinic/PostingFilters';
import { AuthScreenHeader } from '@/components/onboarding/AuthScreenHeader';
import { OnboardingShell } from '@/components/onboarding/OnboardingShell';
import { dashboardSectionGap } from '@/components/dashboard/dashboardLayout';
import { FillInListingCard } from '@/components/worker/FillInListingCard';
import { WorkerBrowseSearchBar } from '@/components/worker/WorkerBrowseSearchBar';
import { EmptyState } from '@/components/ui/EmptyState';
import { PageLoadingList } from '@/components/ui/PageLoadingState';
import { useAuth } from '@/contexts/AuthContext';
import { useWorkerProfile } from '@/contexts/WorkerProfileContext';
import { useRefreshOnFocus } from '@/hooks/useRefreshOnFocus';
import { useMarkGetStartedBrowseVisit } from '@/hooks/useMarkGetStartedBrowseVisit';
import { type RoleTypeFilter } from '@/lib/postingFilters';
import {
  DEFAULT_WORKER_FILLIN_BROWSE_FILTERS,
  filterAndSortLiveShifts,
} from '@/lib/workerBrowseFilters';
import { getWorkerShiftDetailRoute, WORKER_FILLINS } from '@/lib/routing';
import { useThemedStyles } from '@/theme';

export default function OpenFillInsScreen() {
  useMarkGetStartedBrowseVisit('fillIns');
  const { user } = useAuth();
  const { workerProfile, availabilityBlocks } = useWorkerProfile();
  const province = workerProfile?.province ?? 'NS';
  const [shifts, setShifts] = useState<LiveShiftPost[]>([]);
  const [searchQuery, setSearchQuery] = useState(DEFAULT_WORKER_FILLIN_BROWSE_FILTERS.searchQuery);
  const [roleTypeFilter, setRoleTypeFilter] = useState<RoleTypeFilter>(
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
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const [shiftRows, savedIds] = await Promise.all([
        listLiveShiftPosts(province),
        user?.id ? getWorkerSavedShiftPostIds(user.id) : Promise.resolve(new Set<string>()),
      ]);
      setShifts(shiftRows);
      setSavedShiftIds(savedIds);
    } catch {
      setShifts([]);
      setSavedShiftIds(new Set());
      Alert.alert('Could not load fill-ins', 'Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [province, user?.id]);

  useRefreshOnFocus(load);

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

  const hasActiveFilters =
    searchQuery.trim().length > 0 ||
    roleTypeFilter !== DEFAULT_WORKER_FILLIN_BROWSE_FILTERS.roleTypeFilter ||
    sort !== DEFAULT_WORKER_FILLIN_BROWSE_FILTERS.sort ||
    distanceFilter !== DEFAULT_WORKER_FILLIN_BROWSE_FILTERS.distanceFilter ||
    softwareFilter !== DEFAULT_WORKER_FILLIN_BROWSE_FILTERS.softwareFilter ||
    payListedFilter !== DEFAULT_WORKER_FILLIN_BROWSE_FILTERS.payListedFilter ||
    availabilityFilter !== DEFAULT_WORKER_FILLIN_BROWSE_FILTERS.availabilityFilter ||
    savedOnlyFilter !== DEFAULT_WORKER_FILLIN_BROWSE_FILTERS.savedOnlyFilter;

  const styles = useThemedStyles(({ spacing }) => ({
    content: { gap: spacing.lg },
    cardList: { gap: dashboardSectionGap(spacing) },
    browseSection: {
      gap: spacing.md,
    },
    browseControlsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
    },
    searchField: { flex: 1, minWidth: 0 },
  }));

  return (
    <OnboardingShell>
      <AuthScreenHeader
        title="Open fill-ins"
        onBack={() => router.replace(WORKER_FILLINS)}
        accessory={
          !isLoading && shifts.length > 0 ? (
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
          ) : undefined
        }
      />
      <View style={styles.content}>
        {!isLoading && shifts.length > 0 ? (
          <View style={styles.browseSection}>
            <View style={styles.browseControlsRow}>
              <View style={styles.searchField}>
                <WorkerBrowseSearchBar value={searchQuery} onChange={setSearchQuery} />
              </View>
            </View>
          </View>
        ) : null}

        {isLoading ? (
          <PageLoadingList />
        ) : filteredShifts.length === 0 ? (
          <EmptyState
            icon="calendar-outline"
            title={hasActiveFilters ? 'No fill-ins match your search' : 'No open fill-ins'}
            message={
              hasActiveFilters
                ? 'Try a different search term or adjust your filters.'
                : 'Check back soon — new fill-in shifts are posted throughout the week.'
            }
            accent="secondary"
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
                onPress={() => router.push(getWorkerShiftDetailRoute(shift.id, 'open-fill-ins'))}
              />
            ))}
          </View>
        )}
      </View>
    </OnboardingShell>
  );
}
