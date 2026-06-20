import { getUnreadConversationMap, listWorkerJobApplications } from '@chairside/api';
import { canWorkerHideApplication } from '@chairside/config';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Platform, Pressable, Text, View } from 'react-native';
import { usePathname } from 'expo-router';

import { HiringCelebrationModal } from '@/components/celebration/HiringCelebrationModal';
import { DashboardEmptyState } from '@/components/dashboard/DashboardEmptyState';
import { FormErrorBanner } from '@/components/ui/FormErrorBanner';
import { Screen } from '@/components/ui/Screen';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { WorkerApplicationListCard } from '@/components/worker/WorkerApplicationListCard';
import { useAuth } from '@/contexts/AuthContext';
import { useHiringCelebration } from '@/hooks/useHiringCelebration';
import { useRefreshOnFocus } from '@/hooks/useRefreshOnFocus';
import { useWorkerHiringCelebration } from '@/hooks/useWorkerHiringCelebration';
import { toJobCelebrationCandidates } from '@/lib/hiringCelebrationCandidates';
import {
  APPLICATIONS_TAB_MODE_OPTIONS,
  confirmClearPastWorkerApplications,
  partitionWorkerApplications,
  type ApplicationsTabMode,
} from '@/lib/workerApplicationHide';
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
}: {
  applications: ApplicationRow[];
  unreadMap: Record<string, boolean>;
}) {
  const styles = useThemedStyles(({ spacing }) => ({
    list: { gap: spacing.md },
  }));

  return (
    <View style={styles.list}>
      {applications.map((application) => (
        <WorkerApplicationListCard
          key={application.id}
          application={application}
          hasUnreadMessages={Boolean(unreadMap[application.id])}
          returnTo="applications-tab"
        />
      ))}
    </View>
  );
}

type WorkerApplicationsInboxPanelProps = {
  compact?: boolean;
};

export function WorkerApplicationsInboxPanel({
  compact = false,
}: WorkerApplicationsInboxPanelProps) {
  const { user } = useAuth();
  const [selectedMode, setSelectedMode] = useState<ApplicationsTabMode>('active');
  const [applications, setApplications] = useState<ApplicationRow[]>([]);
  const [unreadMap, setUnreadMap] = useState<Record<string, boolean>>({});
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

  const styles = useThemedStyles(({ spacing, colors, typography }) => ({
    content: { gap: spacing.lg },
    panel: { gap: spacing.md },
    empty: typography.subtitle,
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
      return;
    }

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
    }
  }, [checkApplications, user?.id]);

  useRefreshOnFocus(load);

  const pathname = usePathname();
  const wasOnApplicationDetailRef = useRef(false);

  useEffect(() => {
    const onApplicationDetail = pathname.includes('/application/');
    if (wasOnApplicationDetailRef.current && !onApplicationDetail) {
      void load();
    }
    wasOnApplicationDetailRef.current = onApplicationDetail;
  }, [load, pathname]);

  const hasAnyApplications = applications.length > 0;
  const listProps = { unreadMap };

  return (
    <>
      <Screen
        title={compact ? undefined : 'Applications'}
        subtitle={compact ? undefined : 'Track your role applications.'}
        showHeader={!compact}
        constrainWidth={!compact}>
        <FormErrorBanner message={formError} />
        {!hasAnyApplications ? (
          <Text style={styles.empty}>
            No role applications yet. Browse open roles to get started.
          </Text>
        ) : (
          <View style={styles.content}>
            <SegmentedControl
              options={APPLICATIONS_TAB_MODE_OPTIONS}
              selected={selectedMode}
              onChange={setSelectedMode}
              density="compact"
            />

            {selectedMode === 'active' ? (
              <View style={styles.panel}>
                {active.length === 0 ? (
                  <DashboardEmptyState
                    icon="document-text-outline"
                    title="No active applications"
                    message="Applications in progress will appear here."
                  />
                ) : (
                  <ApplicationList applications={active} {...listProps} />
                )}
              </View>
            ) : null}

            {selectedMode === 'past' ? (
              <View style={styles.panel}>
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
                      onPress={() =>
                        confirmClearPastWorkerApplications(past, () => void load())
                      }>
                      <Text style={styles.clearAllLabel}>Clear all</Text>
                    </Pressable>
                  </View>
                ) : null}
                {past.length === 0 ? (
                  <DashboardEmptyState
                    icon="time-outline"
                    title="No past applications"
                    message="Filled, closed, or decided roles will appear here."
                  />
                ) : (
                  <ApplicationList applications={past} {...listProps} />
                )}
              </View>
            ) : null}
          </View>
        )}
      </Screen>
      {!compact ? (
        <HiringCelebrationModal
          visible={celebrationVisible}
          payload={celebrationPayload}
          onClose={() => void closeCelebration()}
        />
      ) : null}
    </>
  );
}
