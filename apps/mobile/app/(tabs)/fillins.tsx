import {
  listLiveShiftPosts,
  listWorkerShiftApplications,
  isPastWorkerFillInApplication,
  type LiveShiftPost,
  type WorkerApplication,
} from '@chairside/api';
import { getProvinceLabel } from '@chairside/config';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Alert, Pressable, Text, View } from 'react-native';

import { HiringCelebrationModal } from '@/components/celebration/HiringCelebrationModal';
import { ChipSelector } from '@/components/clinic/ChipSelector';
import { DashboardEmptyState } from '@/components/dashboard/DashboardEmptyState';
import { DashboardSectionHeader } from '@/components/dashboard/DashboardSectionHeader';
import { AvailabilityScheduleSummary } from '@/components/worker/AvailabilityScheduleSummary';
import { FillInModePanel } from '@/components/worker/FillInModePanel';
import { FillInListingCard } from '@/components/worker/FillInListingCard';
import { BrowseListGroup } from '@/components/ui/BrowseListGroup';
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
import { useRefreshOnForeground } from '@/hooks/useRefreshOnForeground';
import { useWorkerHiringCelebration } from '@/hooks/useWorkerHiringCelebration';
import {
  FILL_INS_TAB_MODE_OPTIONS,
  partitionWorkerShiftApplications,
  type FillInsTabMode,
} from '@/lib/fillInFilters';
import { toShiftCelebrationCandidates } from '@/lib/hiringCelebrationCandidates';
import { COMPACT_ROLE_TYPE_FILTER_OPTIONS, type RoleTypeFilter } from '@/lib/postingFilters';
import {
  getWorkerShiftDetailRoute,
  WORKER_PAST_FILLINS,
  WORKER_SETUP_AVAILABILITY_SCHEDULE,
} from '@/lib/routing';
import { webHover, webPointer, webTextLinkHoverStyles } from '@/lib/webPressableStyles';
import { useTheme, useThemedStyles } from '@/theme';

function navigateToEditSchedule() {
  router.push(WORKER_SETUP_AVAILABILITY_SCHEDULE);
}

export default function FillInsScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const { workerProfile, availabilityBlocks } = useWorkerProfile();
  const province = workerProfile?.province ?? 'NS';
  const [selectedMode, setSelectedMode] = useState<FillInsTabMode>('open');
  const [roleTypeFilter, setRoleTypeFilter] = useState<RoleTypeFilter>('all');
  const [shifts, setShifts] = useState<LiveShiftPost[]>([]);
  const [applications, setApplications] = useState<WorkerApplication[]>([]);
  const [expandedApplicationId, setExpandedApplicationId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { celebrationVisible, celebrationPayload, showCelebration, closeCelebration } =
    useHiringCelebration();
  const { checkApplications } = useWorkerHiringCelebration(showCelebration);
  const { markShiftPostsSeen, markApplicationsSeen } = useApplicationTabBadge();

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const [shiftRows, applicationRows] = await Promise.all([
        listLiveShiftPosts(province),
        user?.id ? listWorkerShiftApplications(user.id) : Promise.resolve([]),
      ]);
      setShifts(shiftRows);
      setApplications(applicationRows);
      await markShiftPostsSeen(shiftRows.map((shift) => shift.id));

      const pastShiftApplications = applicationRows.filter(isPastWorkerFillInApplication);
      if (pastShiftApplications.length > 0) {
        await markApplicationsSeen(pastShiftApplications.map((application) => application.id));
      }

      await checkApplications(toShiftCelebrationCandidates(applicationRows));
    } catch {
      setShifts([]);
      setApplications([]);
      Alert.alert('Could not load fill-ins', 'Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [checkApplications, markApplicationsSeen, markShiftPostsSeen, province, user?.id]);

  useRefreshOnFocus(load);
  useRefreshOnForeground(load);

  const filteredShifts = useMemo(() => {
    if (roleTypeFilter === 'all') return shifts;
    return shifts.filter((shift) => shift.role_type === roleTypeFilter);
  }, [shifts, roleTypeFilter]);

  const { upcomingConfirmed, pastConfirmed, pastInProgress, upcomingInProgress } = useMemo(
    () => partitionWorkerShiftApplications(applications),
    [applications],
  );
  const pastFillInCount = pastConfirmed.length + pastInProgress.length;
  const activeFillInCount = upcomingConfirmed.length + upcomingInProgress.length;

  const fillInsAvailable = workerProfile?.short_notice_available ?? false;

  const styles = useThemedStyles(({ spacing, colors, typography }) => ({
    content: { gap: spacing.lg },
    panel: { gap: spacing.md },
    panelMeta: {
      ...typography.subtitle,
      fontSize: 14,
      lineHeight: 20,
      color: colors.labelSecondary,
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
      <Screen title="Fill-ins" subtitle="Temp shifts and your availability.">
        <View style={styles.content}>
          <SegmentedControl
            options={FILL_INS_TAB_MODE_OPTIONS}
            selected={selectedMode}
            onChange={setSelectedMode}
            density="compact"
          />

          {selectedMode === 'open' ? (
            <View style={styles.panel}>
              {!isLoading ? (
                <Text style={styles.panelMeta}>
                  {shifts.length === 0
                    ? `No open shifts in ${getProvinceLabel(province)}`
                    : `${shifts.length} open in ${getProvinceLabel(province)}`}
                </Text>
              ) : null}
              <ChipSelector
                options={COMPACT_ROLE_TYPE_FILTER_OPTIONS}
                selected={roleTypeFilter}
                onChange={(value) => setRoleTypeFilter(value as RoleTypeFilter)}
                horizontal
                compact
                accent="secondary"
              />
              {isLoading ? (
                <PageLoadingList rowCount={4} />
              ) : filteredShifts.length === 0 ? (
                <DashboardEmptyState
                  icon="calendar-outline"
                  title="No open fill-ins"
                  message="New temp shifts in your province will appear here."
                />
              ) : (
                <BrowseListGroup>
                  {filteredShifts.map((shift) => (
                    <FillInListingCard
                      key={shift.id}
                      shift={shift}
                      layout="list"
                      onPress={() =>
                        router.push(getWorkerShiftDetailRoute(shift.id, 'fill-ins-tab'))
                      }
                    />
                  ))}
                </BrowseListGroup>
              )}
            </View>
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
                          expanded={expandedApplicationId === application.id}
                          onExpandChange={(next) =>
                            setExpandedApplicationId(next ? application.id : null)
                          }
                          onUpdated={() => void load()}
                          onHidden={() => void load()}
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
                          expanded={expandedApplicationId === application.id}
                          onExpandChange={(next) =>
                            setExpandedApplicationId(next ? application.id : null)
                          }
                          onUpdated={() => void load()}
                          onHidden={() => void load()}
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
