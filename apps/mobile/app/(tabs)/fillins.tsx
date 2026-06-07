import {
  listLiveShiftPosts,
  listWorkerShiftApplications,
  isPastWorkerFillInApplication,
  type LiveShiftPost,
  type WorkerApplication,
} from '@chairside/api';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Alert, Pressable, Text, View } from 'react-native';

import { HiringCelebrationModal } from '@/components/celebration/HiringCelebrationModal';
import { RowDivider } from '@/components/clinic/DetailCard';
import { AvailabilityScheduleSummary } from '@/components/worker/AvailabilityScheduleSummary';
import { FillInModePanel } from '@/components/worker/FillInModePanel';
import { FillInListingCard } from '@/components/worker/FillInListingCard';
import { BrowseListGroup } from '@/components/ui/BrowseListGroup';
import { PageLoadingList } from '@/components/ui/PageLoadingState';
import { WorkerApplicationListCard } from '@/components/worker/WorkerApplicationListCard';
import { WorkerSectionHeader } from '@/components/worker/WorkerCards';
import { Screen } from '@/components/ui/Screen';
import { ScreenSection } from '@/components/ui/ScreenSection';
import { useApplicationTabBadge } from '@/contexts/ApplicationTabBadgeContext';
import { useAuth } from '@/contexts/AuthContext';
import { useWorkerProfile } from '@/contexts/WorkerProfileContext';
import { useHiringCelebration } from '@/hooks/useHiringCelebration';
import { useRefreshOnFocus } from '@/hooks/useRefreshOnFocus';
import { useRefreshOnForeground } from '@/hooks/useRefreshOnForeground';
import { useWorkerHiringCelebration } from '@/hooks/useWorkerHiringCelebration';
import {
  getFillInAvailabilityCollapsedSummary,
  isFillInAvailabilityConfigured,
} from '@/lib/fillInAvailabilitySummary';
import { partitionWorkerShiftApplications } from '@/lib/fillInFilters';
import { toShiftCelebrationCandidates } from '@/lib/hiringCelebrationCandidates';
import {
  getWorkerShiftDetailRoute,
  WORKER_OPEN_FILLINS,
  WORKER_PAST_FILLINS,
  WORKER_SETUP_AVAILABILITY_SCHEDULE,
} from '@/lib/routing';
import { useTheme, useThemedStyles } from '@/theme';

function navigateToEditSchedule() {
  router.push(WORKER_SETUP_AVAILABILITY_SCHEDULE);
}

const OPEN_SHIFTS_PREVIEW_LIMIT = 3;

function FillInsEmptyState({
  icon,
  title,
  body,
  embedded = false,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  body: string;
  embedded?: boolean;
}) {
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
    embedded: {
      paddingVertical: spacing.lg,
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
    <View style={embedded ? styles.embedded : styles.card}>
      <View style={styles.iconWrap}>
        <Ionicons name={icon} size={24} color={colors.labelSecondary} />
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.body}>{body}</Text>
    </View>
  );
}

export default function FillInsScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const { workerProfile, availabilityBlocks } = useWorkerProfile();
  const province = workerProfile?.province ?? 'NS';
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
        await markApplicationsSeen(
          pastShiftApplications.map((application) => ({
            id: application.id,
            updated_at: application.updated_at,
          })),
        );
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

  const previewShifts = useMemo(() => shifts.slice(0, OPEN_SHIFTS_PREVIEW_LIMIT), [shifts]);
  const hasMoreShifts = shifts.length > OPEN_SHIFTS_PREVIEW_LIMIT;

  const { upcomingConfirmed, pastConfirmed, pastInProgress, upcomingInProgress } = useMemo(
    () => partitionWorkerShiftApplications(applications),
    [applications],
  );
  const pastFillInCount = pastConfirmed.length + pastInProgress.length;

  const availabilityConfigured = isFillInAvailabilityConfigured(workerProfile, availabilityBlocks);
  const availabilityCollapsedSummary = getFillInAvailabilityCollapsedSummary(
    workerProfile,
    availabilityBlocks,
  );
  const fillInsAvailable = workerProfile?.short_notice_available ?? false;

  const styles = useThemedStyles(({ spacing, colors, typography }) => ({
    content: { gap: spacing.lg },
    sectionBody: { gap: spacing.md },
    list: { gap: spacing.md },
    viewAllRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: spacing.sm,
      paddingVertical: spacing.sm,
    },
    viewAllLabel: {
      ...typography.body,
      fontSize: 15,
      fontWeight: '600',
      color: colors.primary,
    },
    applicationGroup: { gap: spacing.sm },
    scheduleSection: {
      paddingHorizontal: spacing.md,
      paddingTop: spacing.md,
      paddingBottom: spacing.md,
      gap: spacing.sm,
    },
    scheduleSectionMuted: {
      opacity: 0.55,
    },
    scheduleHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: spacing.md,
    },
    scheduleLabel: {
      fontSize: 13,
      fontWeight: '600',
      letterSpacing: 0.4,
      textTransform: 'uppercase',
      color: colors.labelSecondary,
      flex: 1,
    },
    scheduleEdit: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 2,
    },
    scheduleEditLabel: {
      fontSize: 15,
      fontWeight: '600',
      color: colors.primary,
    },
    scheduleHint: {
      ...typography.subtitle,
      fontSize: 13,
      lineHeight: 18,
      color: colors.labelTertiary,
    },
    availabilityCardBody: {
      gap: 0,
      padding: 0,
      paddingBottom: spacing.md,
    },
  }));

  return (
    <>
      <Screen title="Fill-ins" subtitle="Temporary shifts, your availability, and applications.">
        <View style={styles.content}>
          <ScreenSection
            sectionLabel="Your availability"
            description="Let clinics know when you're available to cover fill-in shifts."
            collapsible
            subtitle="Manage fill-in alerts, SMS, and your weekly schedule."
            collapsedSummary={availabilityCollapsedSummary}
            defaultExpanded={!availabilityConfigured}
            collapsedActionLabel="Edit schedule"
            onCollapsedActionPress={navigateToEditSchedule}
            contentStyle={styles.availabilityCardBody}
          >
            <FillInModePanel variant="grouped" />
            <RowDivider />
            <View
              style={[styles.scheduleSection, !fillInsAvailable && styles.scheduleSectionMuted]}
            >
              <View style={styles.scheduleHeader}>
                <Text style={styles.scheduleLabel}>Weekly schedule</Text>
                <Pressable
                  accessibilityRole="button"
                  hitSlop={8}
                  style={styles.scheduleEdit}
                  onPress={navigateToEditSchedule}
                >
                  <Text style={styles.scheduleEditLabel}>Edit schedule</Text>
                  <Ionicons name="chevron-forward" size={16} color={colors.primary} />
                </Pressable>
              </View>
              {!fillInsAvailable ? (
                <Text style={styles.scheduleHint}>
                  Turn on fill-ins above to use your schedule for day-matched alerts.
                </Text>
              ) : null}
              <AvailabilityScheduleSummary blocks={availabilityBlocks} variant="grouped" />
            </View>
          </ScreenSection>

          <ScreenSection
            sectionLabel="Open shifts"
            description="Open temp shifts in your province — request to cover the ones that fit your schedule."
          >
            <View style={styles.sectionBody}>
              {isLoading ? (
                <PageLoadingList rowCount={3} />
              ) : shifts.length === 0 ? (
                <FillInsEmptyState
                  embedded
                  icon="calendar-outline"
                  title="No open fill-ins"
                  body="Check back soon — new fill-in shifts are posted throughout the week."
                />
              ) : (
                <>
                  <BrowseListGroup>
                    {previewShifts.map((shift) => (
                      <FillInListingCard
                        key={shift.id}
                        shift={shift}
                        layout="list"
                        onPress={() => router.push(getWorkerShiftDetailRoute(shift.id, 'fill-ins-tab'))}
                      />
                    ))}
                  </BrowseListGroup>
                  {shifts.length > 0 ? (
                    <Pressable
                      accessibilityRole="button"
                      style={styles.viewAllRow}
                      onPress={() => router.push(WORKER_OPEN_FILLINS)}
                    >
                      <Text style={styles.viewAllLabel}>
                        {hasMoreShifts
                          ? `View all ${shifts.length} open fill-ins`
                          : 'Browse open fill-ins'}
                      </Text>
                      <Ionicons name="chevron-forward" size={16} color={colors.primary} />
                    </Pressable>
                  ) : null}
                </>
              )}
            </View>
          </ScreenSection>

          <ScreenSection
            sectionLabel="Your fill-in shifts"
            description="Shifts you've requested to cover or been confirmed for."
          >
            {upcomingInProgress.length === 0 && upcomingConfirmed.length === 0 ? (
              <FillInsEmptyState
                embedded
                icon="document-text-outline"
                title="No fill-in shifts yet"
                body="Request to cover an open shift above and track it here."
              />
            ) : (
              <View style={styles.sectionBody}>
                {upcomingConfirmed.length > 0 ? (
                  <View style={styles.applicationGroup}>
                    <WorkerSectionHeader title="Upcoming confirmed" />
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
                    <WorkerSectionHeader title="In progress" />
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
                {pastFillInCount > 0 ? (
                  <Pressable
                    accessibilityRole="button"
                    style={styles.viewAllRow}
                    onPress={() => router.push(WORKER_PAST_FILLINS)}
                  >
                    <Text style={styles.viewAllLabel}>
                      View {pastFillInCount} past fill-in{pastFillInCount === 1 ? '' : 's'}
                    </Text>
                    <Ionicons name="chevron-forward" size={16} color={colors.primary} />
                  </Pressable>
                ) : null}
              </View>
            )}
          </ScreenSection>
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
