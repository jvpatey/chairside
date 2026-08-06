import {
  listClinicDiscoverJobPosts,
  listClinicDiscoverShiftPosts,
  type LiveJobPost,
  type LiveShiftPost,
} from '@chairside/api';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, View } from 'react-native';

import { RoleTypeFilters } from '@/components/clinic/PostingFilters';
import { DashboardErrorBanner } from '@/components/dashboard/DashboardErrorBanner';
import { dashboardSectionGap } from '@/components/dashboard/dashboardLayout';
import { EmptyState } from '@/components/ui/EmptyState';
import { ListSearchFilterRow } from '@/components/ui/ListSearchFilterRow';
import { PageLoadingList } from '@/components/ui/PageLoadingState';
import { FileTabWell } from '@/components/dashboard/FileTabWell';
import { ResponsiveGrid } from '@/components/ui/ResponsiveLayout';
import { Screen } from '@/components/ui/Screen';
import { FillInListingCard } from '@/components/worker/FillInListingCard';
import { RoleListingCard } from '@/components/worker/RoleListingCard';
import { useAuth } from '@/contexts/AuthContext';
import { useClinicProfile } from '@/contexts/ClinicProfileContext';
import { useClinicUpgradePrompt } from '@/hooks/useClinicUpgradePrompt';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';
import { usePullToRefresh } from '@/hooks/usePullToRefresh';
import { useRefreshOnFocus } from '@/hooks/useRefreshOnFocus';
import {
  DEFAULT_CLINIC_DISCOVER_FILTERS,
  filterClinicDiscoverJobs,
  filterClinicDiscoverShifts,
} from '@/lib/clinicDiscoverFilters';
import { hasActiveListSearch } from '@/lib/clinicListSearch';
import { type ClinicDiscoverTab, type RoleTypeFilter } from '@/lib/postingFilters';
import {
  getClinicDiscoverJobDetailRoute,
  getClinicDiscoverShiftDetailRoute,
  navigateAfterClinicDiscover,
  type ClinicDiscoverReturnTarget,
} from '@/lib/routing';
import { useThemedStyles } from '@/theme';

export default function ClinicDiscoverScreen() {
  const { user } = useAuth();
  const { clinicProfile } = useClinicProfile();
  const { billing, upgradePrompt, showDiscoverUpgrade } = useClinicUpgradePrompt();
  const { isTablet } = useResponsiveLayout();
  const { tab, returnTo } = useLocalSearchParams<{ tab?: string; returnTo?: string }>();
  const province = clinicProfile?.province ?? 'NS';
  const discoverLocked = billing != null && !billing.canUseClinicDiscover;
  const [selectedTab, setSelectedTab] = useState<ClinicDiscoverTab>('roles');
  const [jobs, setJobs] = useState<LiveJobPost[]>([]);
  const [shifts, setShifts] = useState<LiveShiftPost[]>([]);
  const [searchQuery, setSearchQuery] = useState(DEFAULT_CLINIC_DISCOVER_FILTERS.searchQuery);
  const [roleTypeFilter, setRoleTypeFilter] = useState<RoleTypeFilter>(
    DEFAULT_CLINIC_DISCOVER_FILTERS.roleTypeFilter,
  );
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    if (tab === 'roles' || tab === 'fill-ins') {
      setSelectedTab(tab);
    }
  }, [tab]);

  const styles = useThemedStyles(({ spacing }) => ({
    wrap: {
      gap: spacing.lg,
    },
    cardList: {
      gap: dashboardSectionGap(spacing),
    },
  }));

  const load = useCallback(async () => {
    if (!user?.id || discoverLocked) {
      setJobs([]);
      setShifts([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
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
      setJobs([]);
      setShifts([]);
      Alert.alert(
        'Could not load discover',
        error instanceof Error ? error.message : 'Please try again.',
      );
    } finally {
      setIsLoading(false);
    }
  }, [discoverLocked, province, user?.id]);

  useRefreshOnFocus(load);
  const { refreshing, onRefresh } = usePullToRefresh(load);

  const filteredJobs = useMemo(
    () =>
      filterClinicDiscoverJobs(jobs, clinicProfile, {
        searchQuery,
        roleTypeFilter,
      }),
    [clinicProfile, jobs, roleTypeFilter, searchQuery],
  );

  const filteredShifts = useMemo(
    () =>
      filterClinicDiscoverShifts(shifts, clinicProfile, {
        searchQuery,
        roleTypeFilter,
      }),
    [clinicProfile, roleTypeFilter, searchQuery, shifts],
  );

  const hasSearch = hasActiveListSearch(searchQuery);
  const hasActiveFilters = roleTypeFilter !== 'all';
  const activeList = selectedTab === 'roles' ? filteredJobs : filteredShifts;
  const sourceCount = selectedTab === 'roles' ? jobs.length : shifts.length;

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
        icon: 'calendar-outline' as const,
      },
    ],
    [jobs.length, shifts.length],
  );

  const discoverPanelContent = isLoading ? (
    <PageLoadingList message="Loading discover…" />
  ) : sourceCount === 0 ? (
    <EmptyState
      embedded
      icon={selectedTab === 'roles' ? 'briefcase-outline' : 'calendar-outline'}
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
    />
  ) : selectedTab === 'roles' ? (
    <View style={styles.cardList}>
      <ResponsiveGrid>
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
      <ResponsiveGrid>
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

  return (
    <>
      {upgradePrompt}
      <Screen
        title="Discover"
        subtitle="Live roles and fill-ins posted by other clinics in your province."
        refreshing={discoverLocked ? undefined : refreshing}
        onRefresh={discoverLocked ? undefined : onRefresh}
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
          <View style={styles.wrap}>
            {loadError ? <DashboardErrorBanner onRetry={() => void load()} /> : null}

            {!isLoading && sourceCount > 0 ? (
              <ListSearchFilterRow
                value={searchQuery}
                onChange={setSearchQuery}
                placeholder={
                  selectedTab === 'roles' ? 'Search roles or clinics' : 'Search fill-ins or clinics'
                }
                accessibilityLabel="Search discover"
                filter={
                  <RoleTypeFilters
                    roleTypeFilter={roleTypeFilter}
                    onRoleTypeChange={setRoleTypeFilter}
                    accessibilityLabel="Filter discover"
                    sheetTitle="Filter discover"
                  />
                }
              />
            ) : null}

            <FileTabWell tabs={discoverTabs} selected={selectedTab} onSelect={setSelectedTab}>
              {discoverPanelContent}
            </FileTabWell>
          </View>
        )}
      </Screen>
    </>
  );
}
