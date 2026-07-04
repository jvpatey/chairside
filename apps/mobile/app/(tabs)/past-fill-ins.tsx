import { listWorkerShiftApplications, type WorkerApplication } from '@chairside/api';
import { canWorkerHideApplication } from '@chairside/config';
import { router } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Alert, Pressable, Text, View } from 'react-native';

import { AuthScreenHeader } from '@/components/onboarding/AuthScreenHeader';
import { OnboardingShell } from '@/components/onboarding/OnboardingShell';
import { EmptyState } from '@/components/ui/EmptyState';
import { PageLoadingList } from '@/components/ui/PageLoadingState';
import { WorkerApplicationListCard } from '@/components/worker/WorkerApplicationListCard';
import { WorkerSectionHeader } from '@/components/worker/WorkerCards';
import { useAuth } from '@/contexts/AuthContext';
import { useRefreshOnFocus } from '@/hooks/useRefreshOnFocus';
import { partitionWorkerShiftApplications } from '@/lib/fillInFilters';
import { WORKER_FILLINS } from '@/lib/routing';
import { confirmClearPastWorkerFillIns } from '@/lib/workerApplicationHide';
import {
  webHover,
  webPointer,
  webTextLinkHoverStyles,
} from '@/lib/webPressableStyles';
import { useThemedStyles } from '@/theme';

export default function PastFillInsScreen() {
  const { user } = useAuth();
  const [applications, setApplications] = useState<WorkerApplication[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const applicationRows = user?.id
        ? await listWorkerShiftApplications(user.id)
        : [];
      setApplications(applicationRows);
    } catch {
      setApplications([]);
      Alert.alert('Could not load past fill-ins', 'Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  useRefreshOnFocus(load);

  const { pastConfirmed, pastInProgress } = useMemo(
    () => partitionWorkerShiftApplications(applications),
    [applications],
  );

  const allPast = useMemo(
    () => [...pastConfirmed, ...pastInProgress],
    [pastConfirmed, pastInProgress],
  );
  const hideablePastCount = useMemo(
    () => allPast.filter(canWorkerHideApplication).length,
    [allPast],
  );

  const totalPast = allPast.length;

  const styles = useThemedStyles(({ spacing, colors, typography }) => ({
    content: { gap: spacing.lg },
    group: { gap: spacing.sm },
    clearAllPressable: {
      paddingVertical: spacing.xs,
      paddingHorizontal: spacing.xs,
      marginTop: spacing.xs,
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

  return (
    <OnboardingShell>
      <AuthScreenHeader
        title="Past fill-ins"
        subtitle={
          isLoading
            ? undefined
            : totalPast === 0
              ? 'No past fill-ins yet'
              : `${totalPast} past fill-in${totalPast === 1 ? '' : 's'}`
        }
        onBack={() => router.replace(WORKER_FILLINS)}
        accessory={
          !isLoading && hideablePastCount > 0 ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Clear all past fill-ins"
              style={({ pressed, hovered }) => [
                styles.clearAllPressable,
                webHover(hovered, pressed, styles.clearAllHovered),
                pressed && { opacity: 0.75 },
              ]}
              onPress={() => confirmClearPastWorkerFillIns(allPast, () => void load())}
            >
              <Text style={styles.clearAllLabel}>Clear all</Text>
            </Pressable>
          ) : undefined
        }
      />
      <View style={styles.content}>
        {isLoading ? (
          <PageLoadingList />
        ) : totalPast === 0 ? (
          <EmptyState
            icon="time-outline"
            title="No past fill-ins"
            message="Completed and expired fill-in shifts will appear here after their date has passed."
            accent="secondary"
          />
        ) : (
          <>
            {pastConfirmed.length > 0 ? (
              <View style={styles.group}>
                <WorkerSectionHeader title="Confirmed" />
                {pastConfirmed.map((application) => (
                  <WorkerApplicationListCard
                    key={application.id}
                    application={application}
                    returnTo="past-fill-ins"
                  />
                ))}
              </View>
            ) : null}
            {pastInProgress.length > 0 ? (
              <View style={styles.group}>
                <WorkerSectionHeader title="Expired requests" />
                {pastInProgress.map((application) => (
                  <WorkerApplicationListCard
                    key={application.id}
                    application={application}
                    returnTo="past-fill-ins"
                  />
                ))}
              </View>
            ) : null}
          </>
        )}
      </View>
    </OnboardingShell>
  );
}
