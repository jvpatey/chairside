import { getUnreadConversationMap, listWorkerJobApplications } from '@chairside/api';
import { canWorkerHideApplication } from '@chairside/config';
import { router, useLocalSearchParams, usePathname } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Platform, Pressable, ScrollView, Text, View } from 'react-native';

import { HiringCelebrationModal } from '@/components/celebration/HiringCelebrationModal';
import { DashboardEmptyState } from '@/components/dashboard/DashboardEmptyState';
import { DashboardSectionHeader } from '@/components/dashboard/DashboardSectionHeader';
import { EmptyState } from '@/components/ui/EmptyState';
import { FormErrorBanner } from '@/components/ui/FormErrorBanner';
import { PageLoadingList } from '@/components/ui/PageLoadingState';
import { Screen } from '@/components/ui/Screen';
import { FileTabWell } from '@/components/dashboard/FileTabWell';
import { StaggeredList } from '@/components/ui/StaggeredList';
import { WorkerApplicationListCard } from '@/components/worker/WorkerApplicationListCard';
import { useAuth } from '@/contexts/AuthContext';
import { useHiringCelebration } from '@/hooks/useHiringCelebration';
import { usePullToRefresh } from '@/hooks/usePullToRefresh';
import { useRefreshOnFocus } from '@/hooks/useRefreshOnFocus';
import { useWorkerHiringCelebration } from '@/hooks/useWorkerHiringCelebration';
import { toJobCelebrationCandidates } from '@/lib/hiringCelebrationCandidates';
import { getWorkerCalendarRoute, redirectEmbeddedCalendarDeepLink } from '@/lib/calendarNavigation';
import { WORKER_BROWSE } from '@/lib/routing';
import {
  confirmClearPastWorkerApplications,
  partitionWorkerApplications,
  type ApplicationsTabMode,
} from '@/lib/workerApplicationHide';
import { webScrollbarStyles } from '@/lib/webScrollbarStyles';
import {
  webHover,
  webPointer,
  webTextLinkHoverStyles,
} from '@/lib/webPressableStyles';
import { useThemedStyles } from '@/theme';

type ApplicationRow = Awaited<ReturnType<typeof listWorkerJobApplications>>[number];

function ApplicationList({
  applications,
  unreadMap,
  compact = false,
  selectedApplicationId,
  onApplicationSelect,
}: {
  applications: ApplicationRow[];
  unreadMap: Record<string, boolean>;
  compact?: boolean;
  selectedApplicationId?: string | null;
  onApplicationSelect?: (applicationId: string) => void;
}) {
  const styles = useThemedStyles(({ spacing }) => ({
    list: { gap: spacing.lg },
  }));

  return (
    <View style={styles.list}>
      <StaggeredList>
        {applications.map((application) => (
          <WorkerApplicationListCard
            key={application.id}
            application={application}
            hasUnreadMessages={Boolean(unreadMap[application.id])}
            returnTo="applications-tab"
            compact={compact}
            selected={selectedApplicationId === application.id}
            onSelect={onApplicationSelect}
          />
        ))}
      </StaggeredList>
    </View>
  );
}

type WorkerApplicationsInboxPanelProps = {
  compact?: boolean;
  selectedApplicationId?: string | null;
  onApplicationSelect?: (applicationId: string) => void;
};

export function WorkerApplicationsInboxPanel({
  compact = false,
  selectedApplicationId = null,
  onApplicationSelect,
}: WorkerApplicationsInboxPanelProps) {
  const { user } = useAuth();
  const params = useLocalSearchParams<{ mode?: string; date?: string }>();
  const [selectedMode, setSelectedMode] = useState<ApplicationsTabMode>('active');
  const [applications, setApplications] = useState<ApplicationRow[]>([]);
  const [unreadMap, setUnreadMap] = useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [formError, setFormError] = useState<string | null>(null);
  const {
    celebrationVisible,
    celebrationPayload,
    showCelebration,
    closeCelebration,
  } = useHiringCelebration();
  const { checkApplications } = useWorkerHiringCelebration(showCelebration);

  const { active, past } = useMemo(
    () => partitionWorkerApplications(applications),
    [applications],
  );

  const hideablePastCount = useMemo(
    () => past.filter(canWorkerHideApplication).length,
    [past],
  );

  const upcomingInterviews = useMemo(
    () =>
      active
        .filter(
          (application) =>
            application.status === 'interview_scheduled' && Boolean(application.interview_at),
        )
        .sort((a, b) => (a.interview_at ?? '').localeCompare(b.interview_at ?? '')),
    [active],
  );

  const styles = useThemedStyles(({ spacing, colors, typography }) => ({
    content: {
      gap: spacing.lg,
      flex: compact ? 1 : undefined,
      minHeight: compact ? 0 : undefined,
    },
    chrome: {
      gap: spacing.md,
    },
    listScroll: {
      flex: 1,
      minHeight: 0,
    },
    scrollContent: {
      gap: spacing.lg,
      paddingBottom: spacing.lg,
      ...(compact
        ? {
            paddingHorizontal: spacing.xs,
            paddingTop: spacing.xs,
          }
        : null),
    },
    panel: { gap: spacing.md },
    interviewSection: { gap: spacing.sm },
    clearAllRow: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
    },
    clearAllPressable: {
      paddingVertical: spacing.xs,
      paddingHorizontal: spacing.xs,
      borderRadius: 8,
      ...webPointer(),
    },
    clearAllLabel: {
      ...typography.body,
      fontSize: 15,
      fontWeight: '600',
      color: colors.destructive,
    },
    clearAllHovered: webTextLinkHoverStyles(colors),
  }));

  const load = useCallback(async () => {
    if (!user?.id) {
      setApplications([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const [rows, unread] = await Promise.all([
        listWorkerJobApplications(user.id, 'active'),
        getUnreadConversationMap(user.id, 'worker'),
      ]);
      setApplications(rows);
      setUnreadMap(unread);
      setFormError(null);
      await checkApplications(toJobCelebrationCandidates(rows));
    } catch (error) {
      setApplications([]);
      const message = error instanceof Error ? error.message : 'Please try again.';
      setFormError(message);
      if (Platform.OS !== 'web') {
        Alert.alert('Could not load applications', message);
      }
    } finally {
      setIsLoading(false);
    }
  }, [checkApplications, user?.id]);

  useRefreshOnFocus(load);
  const { refreshing, onRefresh } = usePullToRefresh(load);

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

  const pathname = usePathname();
  const wasOnApplicationDetailRef = useRef(false);

  useEffect(() => {
    const onApplicationDetail = pathname.includes('/application/');
    if (wasOnApplicationDetailRef.current && !onApplicationDetail) {
      void load();
    }
    wasOnApplicationDetailRef.current = onApplicationDetail;
  }, [load, pathname]);

  const applicationTabs = useMemo(
    () => [
      {
        value: 'active' as const,
        label: 'Active',
        count: active.length,
        accent: 'tertiary' as const,
        icon: 'document-text-outline' as const,
      },
      {
        value: 'past' as const,
        label: 'Past',
        count: past.length,
        accent: 'tertiary' as const,
        icon: 'time-outline' as const,
      },
    ],
    [active.length, past.length],
  );

  const hasAnyApplications = applications.length > 0;
  const listProps = {
    unreadMap,
    compact,
    selectedApplicationId,
    onApplicationSelect,
  };

  const activeBody = !hasAnyApplications ? (
    <EmptyState
      embedded
      icon="document-text-outline"
      title="No applications yet"
      message="Browse open roles and apply to track your progress here."
      ctaLabel="Browse roles"
      onCtaPress={() => router.push(WORKER_BROWSE)}
    />
  ) : (
    <>
      {upcomingInterviews.length > 0 ? (
        <View style={styles.interviewSection}>
          <DashboardSectionHeader
            title={`Upcoming interviews (${upcomingInterviews.length})`}
            actionLabel="View calendar"
            onActionPress={() => {
              router.push(
                getWorkerCalendarRoute(upcomingInterviews[0]?.interview_at?.slice(0, 10)),
              );
            }}
            compact
          />
          <ApplicationList applications={upcomingInterviews} {...listProps} />
        </View>
      ) : null}
      {active.length === 0 ? (
        <DashboardEmptyState
          embedded
          icon="document-text-outline"
          title="No active applications"
          message="Applications in progress will appear here."
        />
      ) : active.filter((application) => application.status !== 'interview_scheduled').length >
        0 ? (
        <ApplicationList
          applications={active.filter(
            (application) => application.status !== 'interview_scheduled',
          )}
          {...listProps}
        />
      ) : null}
    </>
  );

  const pastBody = !hasAnyApplications ? (
    <EmptyState
      embedded
      icon="time-outline"
      title="No past applications"
      message="Filled, closed, or decided roles will appear here."
    />
  ) : (
    <>
      {hideablePastCount > 0 ? (
        <View style={styles.clearAllRow}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Clear all past applications"
            style={({ pressed, hovered }) => [
              styles.clearAllPressable,
              webHover(hovered, pressed, styles.clearAllHovered),
              pressed && { opacity: 0.75 },
            ]}
            onPress={() => confirmClearPastWorkerApplications(past, () => void load())}
          >
            <Text style={styles.clearAllLabel}>Clear all</Text>
          </Pressable>
        </View>
      ) : null}
      {past.length === 0 ? (
        <DashboardEmptyState
          embedded
          icon="time-outline"
          title="No past applications"
          message="Filled, closed, or decided roles will appear here."
        />
      ) : (
        <ApplicationList applications={past} {...listProps} />
      )}
    </>
  );

  const listBody = selectedMode === 'active' ? activeBody : pastBody;

  return (
    <>
      <Screen
        title="Applications"
        subtitle={compact ? undefined : 'Track your role applications.'}
        showHeader
        headerVariant={compact ? 'tabletSection' : undefined}
        constrainWidth={!compact}
        scroll={!compact}
        fillsContainer={compact}
        animateEntry={!compact}
        hideAtmosphere={compact}
        transparentBackground={compact}
        refreshing={refreshing}
        onRefresh={onRefresh}
        refreshAccent="tertiary"
      >
        <FormErrorBanner message={formError} />
        {isLoading ? (
          <PageLoadingList rowCount={3} message="Loading applications…" />
        ) : compact ? (
          <View style={styles.content}>
            <View style={styles.chrome}>
              <FileTabWell
                tabs={applicationTabs}
                selected={selectedMode}
                onSelect={setSelectedMode}
                tabsOnly
                fillHeight={false}
              />
            </View>
            <ScrollView
              style={[styles.listScroll, webScrollbarStyles()]}
              contentContainerStyle={styles.scrollContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator
            >
              {listBody}
            </ScrollView>
          </View>
        ) : (
          <View style={styles.content}>
            <FileTabWell
              tabs={applicationTabs}
              selected={selectedMode}
              onSelect={setSelectedMode}
            >
              {listBody}
            </FileTabWell>
          </View>
        )}
      </Screen>
      {!compact || celebrationVisible ? (
        <HiringCelebrationModal
          visible={celebrationVisible}
          payload={celebrationPayload}
          onClose={() => void closeCelebration()}
        />
      ) : null}
    </>
  );
}
