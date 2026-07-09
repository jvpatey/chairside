import {
  getMissingClinicProfileFields,
  getShiftPostApplicationCount,
  getShiftPostPendingApplicationCountsMap,
  getUnreadConversationMap,
  listFillInCoverRequests,
  listShiftPosts,
  listUpcomingConfirmedFillIns,
  type ConfirmedFillInSummary,
  type FillInCoverRequest,
  type ShiftPost,
} from '@chairside/api';
import type { Href } from 'expo-router';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, View } from 'react-native';

import { FillInApplicantCard } from '@/components/clinic/FillInApplicantCard';
import { ListSearchFilterRow } from '@/components/ui/ListSearchFilterRow';
import { FillInPostingCard } from '@/components/clinic/FillInPostingCard';
import { ConfirmedFillInCard } from '@/components/clinic/ConfirmedFillInCard';
import { PlanUpgradeCallout } from '@/components/billing/PlanUpgradeCallout';
import { ShiftPostingFilters } from '@/components/clinic/PostingFilters';
import { HiringCelebrationModal } from '@/components/celebration/HiringCelebrationModal';
import { DashboardQuickActionsRow } from '@/components/dashboard/DashboardQuickActionsRow';
import { DashboardSectionHeader } from '@/components/dashboard/DashboardSectionHeader';
import { EmptyState } from '@/components/ui/EmptyState';
import { PageLoadingList } from '@/components/ui/PageLoadingState';
import { PageTabBar } from '@/components/ui/PageTabBar';
import { StaggeredList } from '@/components/ui/StaggeredList';
import { Screen } from '@/components/ui/Screen';
import { useAuth } from '@/contexts/AuthContext';
import { useClinicProfile } from '@/contexts/ClinicProfileContext';
import { useFillInPending } from '@/contexts/FillInPendingContext';
import { useClinicUpgradePrompt } from '@/hooks/useClinicUpgradePrompt';
import { useHiringCelebration } from '@/hooks/useHiringCelebration';
import { usePullToRefresh } from '@/hooks/usePullToRefresh';
import { useRefreshOnFocus } from '@/hooks/useRefreshOnFocus';
import {
  FILL_INS_LIST_MODE_OPTIONS,
  countActiveFillIns,
  filterShiftPostsForFillInsListMode,
  type FillInsListMode,
} from '@/lib/fillInFilters';
import { redirectEmbeddedCalendarDeepLink } from '@/lib/calendarNavigation';
import {
  HISTORY_SHIFT_STATUS_FILTER_OPTIONS,
  type RoleTypeFilter,
  type ShiftDateFilter,
  type ShiftStatusFilter,
} from '@/lib/postingFilters';
import {
  hasActiveListSearch,
  matchesClinicApplicationSearch,
  matchesShiftPostSearch,
} from '@/lib/clinicListSearch';
import {
  CLINIC_SETUP_BASICS,
  getFindAvailableWorkersRoute,
  getPostShiftRoute,
} from '@/lib/routing';
import {
  getClinicPostingLimitReachedMessage,
  getClinicPostingLimitTitle,
  isFillInPostingLimitReached,
} from '@/lib/clinicPlanPresentation';
import { useThemedStyles } from '@/theme';

function sectionTitleWithCount(title: string, count: number) {
  return count > 0 ? `${title} (${count})` : title;
}

export default function ClinicFillInsScreen() {
  const { user } = useAuth();
  const params = useLocalSearchParams<{ mode?: string; date?: string }>();
  const { clinicProfile, isProfileComplete } = useClinicProfile();
  const { refreshPending } = useFillInPending();
  const { billing, isBillingReady, refreshBilling, upgradePrompt, showPublishUpgrade } =
    useClinicUpgradePrompt();
  const [coverRequests, setCoverRequests] = useState<FillInCoverRequest[]>([]);
  const [shifts, setShifts] = useState<ShiftPost[]>([]);
  const [pendingCounts, setPendingCounts] = useState<Record<string, number>>({});
  const [applicationCounts, setApplicationCounts] = useState<Record<string, number>>({});
  const [confirmedRows, setConfirmedRows] = useState<ConfirmedFillInSummary[]>([]);
  const [expandedShiftId, setExpandedShiftId] = useState<string | null>(null);
  const [expandedConfirmedId, setExpandedConfirmedId] = useState<string | null>(null);
  const [fillInsListMode, setFillInsListMode] = useState<FillInsListMode>('active');
  const [shiftStatusFilter, setShiftStatusFilter] = useState<ShiftStatusFilter>('open');
  const [shiftRoleTypeFilter, setShiftRoleTypeFilter] = useState<RoleTypeFilter>('all');
  const [shiftDateFilter, setShiftDateFilter] = useState<ShiftDateFilter>('past');
  const [coverSearchQuery, setCoverSearchQuery] = useState('');
  const [shiftSearchQuery, setShiftSearchQuery] = useState('');
  const [unreadMap, setUnreadMap] = useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = useState(true);
  const hasLoadedOnce = useRef(false);
  const { celebrationVisible, celebrationPayload, showCelebration, closeCelebration } =
    useHiringCelebration();

  const styles = useThemedStyles(({ spacing }) => ({
    wrap: { gap: spacing.xl },
    list: { gap: spacing.md },
    section: { gap: spacing.sm },
    sectionBody: { gap: spacing.lg },
    filterToolbar: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    modeSwitch: {
      flex: 1,
    },
  }));

  const filteredShifts = useMemo(
    () =>
      filterShiftPostsForFillInsListMode(
        shifts,
        fillInsListMode,
        shiftStatusFilter,
        shiftRoleTypeFilter,
        shiftDateFilter,
      ).filter((shift) => matchesShiftPostSearch(shift, shiftSearchQuery)),
    [
      shifts,
      fillInsListMode,
      shiftStatusFilter,
      shiftRoleTypeFilter,
      shiftDateFilter,
      shiftSearchQuery,
    ],
  );

  const filteredCoverRequests = useMemo(
    () =>
      coverRequests.filter((request) => matchesClinicApplicationSearch(request, coverSearchQuery)),
    [coverRequests, coverSearchQuery],
  );

  const hasShiftSearch = hasActiveListSearch(shiftSearchQuery);
  const activeFillInCount = useMemo(() => countActiveFillIns(shifts), [shifts]);
  const hasShiftFilters =
    (fillInsListMode === 'history' &&
      (shiftStatusFilter !== 'all' ||
        shiftRoleTypeFilter !== 'all' ||
        shiftDateFilter !== 'past')) ||
    (fillInsListMode === 'active' &&
      (shiftStatusFilter !== 'open' || shiftRoleTypeFilter !== 'all' || shiftDateFilter !== 'all'));

  const handleFillInsListModeChange = (value: FillInsListMode) => {
    setFillInsListMode(value);
    setExpandedShiftId(null);
    if (value === 'active') {
      setShiftStatusFilter('open');
      setShiftDateFilter('all');
      return;
    }
    setShiftStatusFilter('all');
    setShiftDateFilter('past');
  };

  const load = useCallback(async () => {
    if (!user?.id) {
      setCoverRequests([]);
      setShifts([]);
      setIsLoading(false);
      return;
    }

    if (!hasLoadedOnce.current) {
      setIsLoading(true);
    }

    try {
      const [requests, shiftPosts, counts, confirmed, unread] = await Promise.all([
        listFillInCoverRequests(user.id),
        listShiftPosts(user.id),
        getShiftPostPendingApplicationCountsMap(user.id),
        listUpcomingConfirmedFillIns(user.id),
        getUnreadConversationMap(user.id, 'clinic'),
      ]);

      const applicationCountEntries = await Promise.all(
        shiftPosts.map(async (shift) => {
          const count = await getShiftPostApplicationCount(user.id, shift.id);
          return [shift.id, count] as const;
        }),
      );

      setCoverRequests(requests);
      setShifts(shiftPosts);
      setPendingCounts(counts);
      setApplicationCounts(Object.fromEntries(applicationCountEntries));
      setConfirmedRows(confirmed);
      setUnreadMap(unread);
      await refreshPending();
      await refreshBilling();
      hasLoadedOnce.current = true;
    } catch (error) {
      Alert.alert(
        'Could not load fill-ins',
        error instanceof Error ? error.message : 'Please try again.',
      );
    } finally {
      setIsLoading(false);
    }
  }, [refreshBilling, refreshPending, user?.id]);

  useEffect(() => {
    const redirect = redirectEmbeddedCalendarDeepLink(
      params.mode,
      typeof params.date === 'string' ? params.date : undefined,
      'clinic',
    );
    if (redirect) {
      router.replace(redirect);
    }
  }, [params.date, params.mode]);

  useRefreshOnFocus(load);
  const { refreshing, onRefresh } = usePullToRefresh(load);

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

  const fillInLimitReached = isBillingReady && isFillInPostingLimitReached(billing);

  const handlePostFillInPress = () => {
    if (fillInLimitReached) {
      showPublishUpgrade('fill-in');
      return;
    }
    guardPosting(getPostShiftRoute('fill-ins-tab'));
  };

  if (isLoading && !hasLoadedOnce.current) {
    return (
      <Screen
        title="Fill-ins"
        subtitle="Review cover requests and manage your fill-in shifts."
        refreshing={refreshing}
        onRefresh={onRefresh}
        refreshAccent="secondary">
        <PageLoadingList message="Loading fill-ins…" />
      </Screen>
    );
  }

  return (
    <>
      {upgradePrompt}
      <Screen
        title="Fill-ins"
        subtitle="Review cover requests and manage your fill-in shifts."
        refreshing={refreshing}
        onRefresh={onRefresh}
        refreshAccent="secondary">
        <View style={styles.wrap}>
          <DashboardQuickActionsRow
            actions={[
              {
                label: 'Post fill-in',
                description: 'Temp or urgent shift',
                icon: 'calendar-outline',
                variant: 'secondary',
                dimmed: fillInLimitReached,
                onPress: handlePostFillInPress,
              },
              {
                label: 'Find workers',
                description: 'Browse available staff',
                icon: 'people-outline',
                variant: 'primary',
                onPress: () => guardPosting(getFindAvailableWorkersRoute('fill-ins-tab')),
              },
            ]}
          />

          {fillInLimitReached && billing ? (
            <PlanUpgradeCallout
              title={getClinicPostingLimitTitle('fill-in')}
              message={getClinicPostingLimitReachedMessage(billing, 'fill-in')}
              accent="secondary"
              compact
            />
          ) : null}

          <View style={styles.section}>
            <DashboardSectionHeader
              title={sectionTitleWithCount('Needs response', coverRequests.length)}
            />
            {coverRequests.length === 0 ? (
              <EmptyState
                icon="checkmark-circle-outline"
                title="No pending cover requests"
                message="New requests from workers will appear here when they apply to cover a fill-in."
              />
            ) : (
              <View style={styles.list}>
                <ListSearchFilterRow
                  value={coverSearchQuery}
                  onChange={setCoverSearchQuery}
                  placeholder="Search applicant name"
                  accessibilityLabel="Search cover requests"
                />
                {filteredCoverRequests.length === 0 ? (
                  <EmptyState
                    icon="search-outline"
                    title="No matching cover requests"
                    message="Try a different search term."
                  />
                ) : (
                  <StaggeredList>
                    {filteredCoverRequests.map((request) => (
                      <FillInApplicantCard
                        key={request.id}
                        application={request}
                        clinicId={user?.id ?? ''}
                        returnTo="fill-ins-tab"
                        hasUnreadMessages={Boolean(unreadMap[request.id])}
                        onUpdated={() => void load()}
                        onConfirmed={(payload) => showCelebration(payload)}
                      />
                    ))}
                  </StaggeredList>
                )}
              </View>
            )}
          </View>

          {confirmedRows.length > 0 ? (
            <View style={styles.section}>
              <DashboardSectionHeader
                title={sectionTitleWithCount('Upcoming confirmed', confirmedRows.length)}
              />
              <View style={styles.list}>
                <StaggeredList>
                  {confirmedRows.map((row) => (
                    <ConfirmedFillInCard
                      key={row.applicationId}
                      clinicId={user?.id ?? ''}
                      workerName={row.workerName}
                      workerPhotoStoragePath={row.workerPhotoStoragePath}
                      shiftDate={row.shiftDate}
                      startTime={row.startTime}
                      endTime={row.endTime}
                      applicationId={row.applicationId}
                      shiftPostId={row.shiftPostId}
                      returnTo="fill-ins-tab"
                      expanded={expandedConfirmedId === row.applicationId}
                      onExpandChange={(next) =>
                        setExpandedConfirmedId(next ? row.applicationId : null)
                      }
                      onUpdated={() => void load()}
                    />
                  ))}
                </StaggeredList>
              </View>
            </View>
          ) : null}

          <View style={styles.section}>
            <DashboardSectionHeader
              title={sectionTitleWithCount('Your fill-ins', activeFillInCount)}
            />
            {shifts.length === 0 ? (
              <EmptyState
                icon="calendar-outline"
                title="No fill-ins yet"
                message="Post a fill-in shift when you need temporary or urgent coverage."
                ctaLabel={
                  isProfileComplete && !fillInLimitReached ? 'Post fill-in' : undefined
                }
                onCtaPress={
                  isProfileComplete && !fillInLimitReached ? handlePostFillInPress : undefined
                }
                ctaAccent="secondary"
              />
            ) : (
              <View style={styles.sectionBody}>
                <ListSearchFilterRow
                  value={shiftSearchQuery}
                  onChange={setShiftSearchQuery}
                  placeholder="Search date or role type"
                  accessibilityLabel="Search fill-ins"
                  filter={
                    <ShiftPostingFilters
                      statusOptions={
                        fillInsListMode === 'history'
                          ? HISTORY_SHIFT_STATUS_FILTER_OPTIONS
                          : undefined
                      }
                      includeStatusInSheet={fillInsListMode === 'history'}
                      includeDateInSheet={fillInsListMode === 'history'}
                      defaults={
                        fillInsListMode === 'history'
                          ? {
                              statusFilter: 'all',
                              roleTypeFilter: 'all',
                              shiftDateFilter: 'past',
                            }
                          : {
                              statusFilter: 'open',
                              roleTypeFilter: 'all',
                              shiftDateFilter: 'all',
                            }
                      }
                      statusFilter={shiftStatusFilter}
                      roleTypeFilter={shiftRoleTypeFilter}
                      shiftDateFilter={shiftDateFilter}
                      onStatusChange={setShiftStatusFilter}
                      onRoleTypeChange={setShiftRoleTypeFilter}
                      onShiftDateChange={setShiftDateFilter}
                    />
                  }
                />
                <View style={styles.filterToolbar}>
                  <View style={styles.modeSwitch}>
                    <PageTabBar
                      options={FILL_INS_LIST_MODE_OPTIONS}
                      selected={fillInsListMode}
                      onChange={handleFillInsListModeChange}
                      accent="secondary"
                    />
                  </View>
                </View>
                {filteredShifts.length === 0 ? (
                  <EmptyState
                    icon="filter-outline"
                    title={
                      hasShiftSearch || hasShiftFilters
                        ? 'No fill-ins match your search'
                        : fillInsListMode === 'history'
                          ? 'No past fill-ins'
                          : 'No active fill-ins'
                    }
                    message={
                      hasShiftSearch || hasShiftFilters
                        ? 'Try a different search or filter, or post a new fill-in shift.'
                        : fillInsListMode === 'history'
                          ? 'Past, filled, and closed fill-ins will appear here.'
                          : 'Try a different filter or post a new fill-in shift.'
                    }
                  />
                ) : (
                  <View style={styles.list}>
                    <StaggeredList>
                      {filteredShifts.map((shift) => (
                        <FillInPostingCard
                          key={shift.id}
                          shift={shift}
                          pendingRequestCount={pendingCounts[shift.id] ?? 0}
                          applicationCount={applicationCounts[shift.id] ?? 0}
                          clinicId={user?.id}
                          returnTo="fill-ins-tab"
                          expanded={expandedShiftId === shift.id}
                          onExpandChange={(next) => setExpandedShiftId(next ? shift.id : null)}
                          onShiftUpdated={(updated) => {
                            setShifts((current) =>
                              current.map((row) => (row.id === updated.id ? updated : row)),
                            );
                            void refreshBilling();
                          }}
                          onShiftDeleted={() => {
                            setShifts((current) => current.filter((row) => row.id !== shift.id));
                            setExpandedShiftId((current) =>
                              current === shift.id ? null : current,
                            );
                            void refreshBilling();
                          }}
                        />
                      ))}
                    </StaggeredList>
                  </View>
                )}
              </View>
            )}
          </View>
        </View>
      </Screen>
      <HiringCelebrationModal
        visible={celebrationVisible}
        payload={celebrationPayload}
        onClose={() => {
          void closeCelebration();
          void load();
        }}
      />
    </>
  );
}
