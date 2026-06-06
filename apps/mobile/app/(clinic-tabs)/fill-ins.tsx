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
import { Ionicons } from '@expo/vector-icons';
import type { Href } from 'expo-router';
import { router } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Alert, Text, View } from 'react-native';

import { FillInApplicantCard } from '@/components/clinic/FillInApplicantCard';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { FillInPostingCard } from '@/components/clinic/FillInPostingCard';
import { ConfirmedFillInCard } from '@/components/clinic/ConfirmedFillInCard';
import { ShiftPostingFilters } from '@/components/clinic/PostingFilters';
import { HiringCelebrationModal } from '@/components/celebration/HiringCelebrationModal';
import { OnboardingButton } from '@/components/onboarding/OnboardingButton';
import { Screen } from '@/components/ui/Screen';
import { useAuth } from '@/contexts/AuthContext';
import { useClinicProfile } from '@/contexts/ClinicProfileContext';
import { useFillInPending } from '@/contexts/FillInPendingContext';
import { useHiringCelebration } from '@/hooks/useHiringCelebration';
import { useRefreshOnFocus } from '@/hooks/useRefreshOnFocus';
import {
  FILL_INS_LIST_MODE_OPTIONS,
  filterShiftPostsForFillInsListMode,
  type FillInsListMode,
} from '@/lib/fillInFilters';
import {
  HISTORY_SHIFT_STATUS_FILTER_OPTIONS,
  type RoleTypeFilter,
  type ShiftDateFilter,
  type ShiftStatusFilter,
} from '@/lib/postingFilters';
import {
  CLINIC_SETUP_BASICS,
  getPostShiftRoute,
} from '@/lib/routing';
import { useTheme, useThemedStyles } from '@/theme';

function SectionHeader({ title }: { title: string }) {
  const styles = useThemedStyles(({ spacing, typography }) => ({
    header: { marginBottom: spacing.sm },
    title: {
      ...typography.body,
      fontSize: 13,
      fontWeight: '600',
      letterSpacing: 0.4,
      textTransform: 'uppercase',
      color: typography.subtitle.color,
    },
  }));

  return (
    <View style={styles.header}>
      <Text style={styles.title}>{title}</Text>
    </View>
  );
}

function EmptyCard({ icon, title, body }: { icon: keyof typeof Ionicons.glyphMap; title: string; body: string }) {
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

export default function ClinicFillInsScreen() {
  const { user } = useAuth();
  const { clinicProfile, isProfileComplete } = useClinicProfile();
  const { refreshPending } = useFillInPending();
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
  const [unreadMap, setUnreadMap] = useState<Record<string, boolean>>({});
  const {
    celebrationVisible,
    celebrationPayload,
    showCelebration,
    closeCelebration,
  } = useHiringCelebration();

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
      ),
    [shifts, fillInsListMode, shiftStatusFilter, shiftRoleTypeFilter, shiftDateFilter],
  );

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
      return;
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
    } catch (error) {
      Alert.alert(
        'Could not load fill-ins',
        error instanceof Error ? error.message : 'Please try again.',
      );
    }
  }, [refreshPending, user?.id]);

  useRefreshOnFocus(load);

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

  return (
    <>
      <Screen title="Fill-ins" subtitle="Review cover requests and manage your fill-in shifts.">
        <View style={styles.wrap}>
          <OnboardingButton
            label="Post fill-in"
            disabled={!isProfileComplete}
            onPress={() => guardPosting(getPostShiftRoute('fill-ins-tab'))}
          />

          <View style={styles.section}>
            <SectionHeader title="Needs response" />
            {coverRequests.length === 0 ? (
              <EmptyCard
                icon="checkmark-circle-outline"
                title="No pending cover requests"
                body="New requests from workers will appear here when they apply to cover a fill-in."
              />
            ) : (
              <View style={styles.list}>
                {coverRequests.map((request) => (
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
              </View>
            )}
          </View>

          {confirmedRows.length > 0 ? (
            <View style={styles.section}>
              <SectionHeader title="Upcoming confirmed" />
              <View style={styles.list}>
                {confirmedRows.map((row) => (
                  <ConfirmedFillInCard
                    key={row.applicationId}
                    workerName={row.workerName}
                    workerPhotoStoragePath={row.workerPhotoStoragePath}
                    shiftDate={row.shiftDate}
                    startTime={row.startTime}
                    endTime={row.endTime}
                    applicationId={row.applicationId}
                    returnTo="fill-ins-tab"
                    expanded={expandedConfirmedId === row.applicationId}
                    onExpandChange={(next) =>
                      setExpandedConfirmedId(next ? row.applicationId : null)
                    }
                  />
                ))}
              </View>
            </View>
          ) : null}

          <View style={styles.section}>
            <SectionHeader title="Your fill-ins" />
            {shifts.length === 0 ? (
              <EmptyCard
                icon="calendar-outline"
                title="No fill-ins yet"
                body="Post a fill-in shift when you need temporary or urgent coverage."
              />
            ) : (
              <View style={styles.sectionBody}>
                <View style={styles.filterToolbar}>
                  <View style={styles.modeSwitch}>
                    <SegmentedControl
                      options={FILL_INS_LIST_MODE_OPTIONS}
                      selected={fillInsListMode}
                      onChange={handleFillInsListModeChange}
                    />
                  </View>
                  <ShiftPostingFilters
                    variant="sheet"
                    statusOptions={
                      fillInsListMode === 'history' ? HISTORY_SHIFT_STATUS_FILTER_OPTIONS : undefined
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
                </View>
                {filteredShifts.length === 0 ? (
                  <EmptyCard
                    icon="filter-outline"
                    title={fillInsListMode === 'history' ? 'No past fill-ins' : 'No active fill-ins'}
                    body={
                      fillInsListMode === 'history'
                        ? 'Past, filled, and closed fill-ins will appear here.'
                        : 'Try a different filter or post a new fill-in shift.'
                    }
                  />
                ) : (
                  <View style={styles.list}>
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
                        onShiftUpdated={(updated) =>
                          setShifts((current) =>
                            current.map((row) => (row.id === updated.id ? updated : row)),
                          )
                        }
                        onShiftDeleted={() => {
                          setShifts((current) => current.filter((row) => row.id !== shift.id));
                          setExpandedShiftId((current) => (current === shift.id ? null : current));
                        }}
                      />
                    ))}
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
