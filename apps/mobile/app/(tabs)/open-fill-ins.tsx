import { listLiveShiftPosts, type LiveShiftPost } from '@chairside/api';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Alert, Text, View } from 'react-native';

import { WorkerFillInBrowseFilters } from '@/components/clinic/PostingFilters';
import { AuthScreenHeader } from '@/components/onboarding/AuthScreenHeader';
import { OnboardingShell } from '@/components/onboarding/OnboardingShell';
import { FillInListingCard } from '@/components/worker/FillInListingCard';
import { WorkerBrowseSearchBar } from '@/components/worker/WorkerBrowseSearchBar';
import { BrowseListGroup } from '@/components/ui/BrowseListGroup';
import { PageLoadingList } from '@/components/ui/PageLoadingState';
import { useWorkerProfile } from '@/contexts/WorkerProfileContext';
import { useRefreshOnFocus } from '@/hooks/useRefreshOnFocus';
import { useMarkGetStartedBrowseVisit } from '@/hooks/useMarkGetStartedBrowseVisit';
import { type RoleTypeFilter } from '@/lib/postingFilters';
import {
  DEFAULT_WORKER_FILLIN_BROWSE_FILTERS,
  filterAndSortLiveShifts,
} from '@/lib/workerBrowseFilters';
import { getWorkerShiftDetailRoute, WORKER_FILLINS } from '@/lib/routing';
import { useTheme, useThemedStyles } from '@/theme';

function OpenFillInsEmptyState({ hasActiveFilters }: { hasActiveFilters: boolean }) {
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
        <Ionicons name="calendar-outline" size={24} color={colors.labelSecondary} />
      </View>
      <Text style={styles.title}>
        {hasActiveFilters ? 'No fill-ins match your search' : 'No open fill-ins'}
      </Text>
      <Text style={styles.body}>
        {hasActiveFilters
          ? 'Try a different search term or adjust your filters.'
          : 'Check back soon — new fill-in shifts are posted throughout the week.'}
      </Text>
    </View>
  );
}

export default function OpenFillInsScreen() {
  useMarkGetStartedBrowseVisit('fillIns');
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
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const shiftRows = await listLiveShiftPosts(province);
      setShifts(shiftRows);
    } catch {
      setShifts([]);
      Alert.alert('Could not load fill-ins', 'Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [province]);

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
      }),
    [
      availabilityBlocks,
      availabilityFilter,
      distanceFilter,
      payListedFilter,
      roleTypeFilter,
      searchQuery,
      shifts,
      softwareFilter,
      sort,
      workerProfile,
    ],
  );

  const hasActiveFilters =
    searchQuery.trim().length > 0 ||
    roleTypeFilter !== DEFAULT_WORKER_FILLIN_BROWSE_FILTERS.roleTypeFilter ||
    sort !== DEFAULT_WORKER_FILLIN_BROWSE_FILTERS.sort ||
    distanceFilter !== DEFAULT_WORKER_FILLIN_BROWSE_FILTERS.distanceFilter ||
    softwareFilter !== DEFAULT_WORKER_FILLIN_BROWSE_FILTERS.softwareFilter ||
    payListedFilter !== DEFAULT_WORKER_FILLIN_BROWSE_FILTERS.payListedFilter ||
    availabilityFilter !== DEFAULT_WORKER_FILLIN_BROWSE_FILTERS.availabilityFilter;

  const styles = useThemedStyles(({ spacing }) => ({
    content: { gap: spacing.lg },
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
              onRoleTypeChange={setRoleTypeFilter}
              onSortChange={setSort}
              onDistanceFilterChange={setDistanceFilter}
              onSoftwareFilterChange={setSoftwareFilter}
              onPayListedFilterChange={setPayListedFilter}
              onAvailabilityFilterChange={setAvailabilityFilter}
            />
          ) : undefined
        }
      />
      <View style={styles.content}>
        {!isLoading && shifts.length > 0 ? (
          <View style={styles.browseSection}>
            <View style={styles.browseControlsRow}>
              <View style={styles.searchField}>
                <WorkerBrowseSearchBar
                  value={searchQuery}
                  onChange={setSearchQuery}
                  placeholder="Search fill-ins, clinics, cities, or pay"
                  accessibilityLabel="Search fill-ins"
                />
              </View>
            </View>
          </View>
        ) : null}

        {isLoading ? (
          <PageLoadingList />
        ) : filteredShifts.length === 0 ? (
          <OpenFillInsEmptyState hasActiveFilters={hasActiveFilters} />
        ) : (
          <BrowseListGroup>
            {filteredShifts.map((shift) => (
              <FillInListingCard
                key={shift.id}
                shift={shift}
                layout="list"
                distanceLabel={shift.distanceLabel}
                onPress={() => router.push(getWorkerShiftDetailRoute(shift.id, 'open-fill-ins'))}
              />
            ))}
          </BrowseListGroup>
        )}
      </View>
    </OnboardingShell>
  );
}
