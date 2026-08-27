import { listWorkerShiftApplications, type WorkerApplication } from '@chairside/api';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Platform, View } from 'react-native';

import { DashboardEmptyState } from '@/components/dashboard/DashboardEmptyState';
import { DashboardSectionHeader } from '@/components/dashboard/DashboardSectionHeader';
import { FormErrorBanner } from '@/components/ui/FormErrorBanner';
import { PageLoadingList } from '@/components/ui/PageLoadingState';
import { FileTabWell } from '@/components/dashboard/FileTabWell';
import { Screen } from '@/components/ui/Screen';
import { StaggeredList } from '@/components/ui/StaggeredList';
import { WorkerApplicationListCard } from '@/components/worker/WorkerApplicationListCard';
import { useAuth } from '@/contexts/AuthContext';
import { FILL_IN_ICON } from '@/lib/fillInIcons';
import { usePullToRefresh } from '@/hooks/usePullToRefresh';
import { useRefreshOnFocus } from '@/hooks/useRefreshOnFocus';
import {
  partitionWorkerShiftApplications,
  type FillInsTabMode,
} from '@/lib/fillInFilters';
import { useThemedStyles } from '@/theme';

type WorkerFillInsInboxPanelProps = {
  compact?: boolean;
  /** Keep this tab selected when the panel remounts (e.g. master/detail). */
  initialMode?: FillInsTabMode;
};

export function WorkerFillInsInboxPanel({
  compact = false,
  initialMode,
}: WorkerFillInsInboxPanelProps) {
  const { user } = useAuth();
  const defaultMode: FillInsTabMode = compact ? 'pending' : 'open';
  const resolvedInitialMode =
    initialMode && !(compact && initialMode === 'open') ? initialMode : defaultMode;
  const [selectedMode, setSelectedMode] = useState<FillInsTabMode>(resolvedInitialMode);
  const [applications, setApplications] = useState<WorkerApplication[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (!initialMode) return;
    if (compact && initialMode === 'open') return;
    setSelectedMode(initialMode);
  }, [compact, initialMode]);

  const {
    upcomingConfirmed,
    pastConfirmed,
    pastInProgress,
    upcomingInProgress,
    cancelledApplications,
    declinedApplications,
  } = useMemo(() => partitionWorkerShiftApplications(applications), [applications]);

  const pendingFillInCount = upcomingInProgress.length;
  const confirmedFillInCount = upcomingConfirmed.length;
  const historyFillInCount =
    cancelledApplications.length +
    declinedApplications.length +
    pastConfirmed.length +
    pastInProgress.length;

  const styles = useThemedStyles(({ spacing }) => ({
    content: { gap: spacing.lg },
    panel: { gap: spacing.lg },
    applicationGroup: { gap: spacing.sm },
  }));

  const fillInTabs = useMemo(() => {
    const tabs = [
      ...(!compact
        ? [
            {
              value: 'open' as const,
              label: 'Open',
              accent: 'secondary' as const,
              icon: FILL_IN_ICON.outline,
            },
          ]
        : []),
      {
        value: 'pending' as const,
        label: 'Pending',
        count: pendingFillInCount,
        accent: 'secondary' as const,
        icon: 'hourglass-outline' as const,
      },
      {
        value: 'confirmed' as const,
        label: 'Confirmed',
        count: confirmedFillInCount,
        accent: 'secondary' as const,
        icon: 'checkmark-circle-outline' as const,
      },
      {
        value: 'history' as const,
        label: 'History',
        count: historyFillInCount,
        accent: 'secondary' as const,
        icon: 'time-outline' as const,
      },
    ];
    return compact ? tabs.filter((tab) => tab.value !== 'open') : tabs;
  }, [compact, confirmedFillInCount, historyFillInCount, pendingFillInCount]);

  const load = useCallback(async () => {
    if (!user?.id) {
      setApplications([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const rows = await listWorkerShiftApplications(user.id);
      setApplications(rows);
      setFormError(null);
    } catch (error) {
      setApplications([]);
      const message = error instanceof Error ? error.message : 'Please try again.';
      setFormError(message);
      if (Platform.OS !== 'web') {
        Alert.alert('Could not load fill-ins', message);
      }
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  useRefreshOnFocus(load);
  const { refreshing, onRefresh } = usePullToRefresh(load);

  const renderApplicationGroup = (title: string, items: WorkerApplication[]) =>
    items.length > 0 ? (
      <View style={styles.applicationGroup}>
        <DashboardSectionHeader title={title} compact />
        <StaggeredList>
          {items.map((application) => (
            <WorkerApplicationListCard
              key={application.id}
              application={application}
              returnTo="fill-ins-tab"
              compact={compact}
            />
          ))}
        </StaggeredList>
      </View>
    ) : null;

  return (
    <Screen
      title="Fill-ins"
      subtitle={compact ? undefined : 'Temp shifts and your availability.'}
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
      refreshAccent="secondary"
    >
      <FormErrorBanner message={formError} />
      {isLoading ? (
        <PageLoadingList rowCount={3} message="Loading fill-ins…" />
      ) : (
        <View style={styles.content}>
          <FileTabWell tabs={fillInTabs} selected={selectedMode} onSelect={setSelectedMode}>
            {selectedMode === 'pending' ? (
              pendingFillInCount === 0 ? (
                <DashboardEmptyState
                  embedded
                  icon="hourglass-outline"
                  title="No pending cover requests"
                  message="When you request to cover a fill-in, it stays here until the clinic confirms or declines."
                />
              ) : (
                renderApplicationGroup('Pending requests', upcomingInProgress)
              )
            ) : null}

            {selectedMode === 'confirmed' ? (
              confirmedFillInCount === 0 ? (
                <DashboardEmptyState
                  embedded
                  icon="checkmark-circle-outline"
                  title="No confirmed fill-ins yet"
                  message="When a clinic confirms your cover request, the shift will appear here."
                />
              ) : (
                renderApplicationGroup('Upcoming confirmed', upcomingConfirmed)
              )
            ) : null}

            {selectedMode === 'history' ? (
              historyFillInCount === 0 ? (
                <DashboardEmptyState
                  embedded
                  icon="time-outline"
                  title="No fill-in history yet"
                  message="Declined requests, cancelled shifts, and past fill-ins will appear here."
                />
              ) : (
                <>
                  {renderApplicationGroup('Cancelled', cancelledApplications)}
                  {renderApplicationGroup('Declined', declinedApplications)}
                  {renderApplicationGroup('Filled in', pastConfirmed)}
                  {renderApplicationGroup('Expired requests', pastInProgress)}
                </>
              )
            ) : null}
          </FileTabWell>
        </View>
      )}
    </Screen>
  );
}
