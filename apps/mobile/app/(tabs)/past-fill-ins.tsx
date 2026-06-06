import { listWorkerShiftApplications, type WorkerApplication } from '@chairside/api';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Alert, Text, View } from 'react-native';

import { AuthScreenHeader } from '@/components/onboarding/AuthScreenHeader';
import { OnboardingShell } from '@/components/onboarding/OnboardingShell';
import { WorkerApplicationListCard } from '@/components/worker/WorkerApplicationListCard';
import { WorkerSectionHeader } from '@/components/worker/WorkerCards';
import { useAuth } from '@/contexts/AuthContext';
import { useRefreshOnFocus } from '@/hooks/useRefreshOnFocus';
import { partitionWorkerShiftApplications } from '@/lib/fillInFilters';
import { WORKER_FILLINS } from '@/lib/routing';
import { useTheme, useThemedStyles } from '@/theme';

function PastFillInsEmptyState() {
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
      marginBottom: spacing.xs,
    },
    title: { ...typography.body, fontWeight: '600', textAlign: 'center' },
    body: { ...typography.subtitle, fontSize: 14, lineHeight: 20, textAlign: 'center' },
  }));

  return (
    <View style={styles.card}>
      <View style={styles.iconWrap}>
        <Ionicons name="time-outline" size={24} color={colors.labelSecondary} />
      </View>
      <Text style={styles.title}>No past fill-ins</Text>
      <Text style={styles.body}>
        Completed and expired fill-in shifts will appear here after their date has passed.
      </Text>
    </View>
  );
}

export default function PastFillInsScreen() {
  const { user } = useAuth();
  const [applications, setApplications] = useState<WorkerApplication[]>([]);
  const [expandedApplicationId, setExpandedApplicationId] = useState<string | null>(null);
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

  const totalPast = pastConfirmed.length + pastInProgress.length;

  const styles = useThemedStyles(({ spacing }) => ({
    content: { gap: spacing.lg },
    group: { gap: spacing.sm },
  }));

  return (
    <OnboardingShell>
      <AuthScreenHeader
        title="Past fill-ins"
        subtitle={
          isLoading
            ? 'Loading…'
            : totalPast === 0
              ? 'No past fill-ins yet'
              : `${totalPast} past fill-in${totalPast === 1 ? '' : 's'}`
        }
        onBack={() => router.replace(WORKER_FILLINS)}
      />
      <View style={styles.content}>
        {totalPast === 0 && !isLoading ? (
          <PastFillInsEmptyState />
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
            {pastInProgress.length > 0 ? (
              <View style={styles.group}>
                <WorkerSectionHeader title="Expired requests" />
                {pastInProgress.map((application) => (
                  <WorkerApplicationListCard
                    key={application.id}
                    application={application}
                    returnTo="past-fill-ins"
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
      </View>
    </OnboardingShell>
  );
}
