import { listWorkerShiftApplications, type WorkerApplication } from '@chairside/api';
import { useCallback, useMemo, useState } from 'react';
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
};

export function WorkerFillInsInboxPanel({ compact = false }: WorkerFillInsInboxPanelProps) {
  const { user } = useAuth();
  const [selectedMode, setSelectedMode] = useState<FillInsTabMode>(compact ? 'confirmed' : 'open');
  const [applications, setApplications] = useState<WorkerApplication[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [formError, setFormError] = useState<string | null>(null);

  const {
    upcomingConfirmed,
    pastConfirmed,
    pastInProgress,
    upcomingInProgress,
    cancelledApplications,
    declinedApplications,
  } = useMemo(() => partitionWorkerShiftApplications(applications), [applications]);

  const activeFillInCount = upcomingConfirmed.length + upcomingInProgress.length;
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
        value: 'confirmed' as const,
        label: 'Confirmed',
        count: activeFillInCount,
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
  }, [activeFillInCount, compact, historyFillInCount]);

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
      title={compact ? undefined : 'Fill-ins'}
      subtitle={compact ? undefined : 'Temp shifts and your availability.'}
      showHeader={!compact}
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
            {selectedMode === 'confirmed' ? (
              activeFillInCount === 0 ? (
                <DashboardEmptyState
                  embedded
                  icon="document-text-outline"
                  title="No fill-in shifts yet"
                  message="Request to cover an open shift and track confirmed and in-progress fill-ins here."
                />
              ) : (
                <>
                  {renderApplicationGroup('Upcoming confirmed', upcomingConfirmed)}
                  {renderApplicationGroup('In progress', upcomingInProgress)}
                </>
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
                  {renderApplicationGroup('Past confirmed', pastConfirmed)}
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
