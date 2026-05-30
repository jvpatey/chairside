import { listWorkerJobApplications, getUnreadConversationMap } from '@chairside/api';
import { router } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, Text, View } from 'react-native';

import { HiringCelebrationModal } from '@/components/celebration/HiringCelebrationModal';
import { Screen } from '@/components/ui/Screen';
import { WorkerApplicationListCard } from '@/components/worker/WorkerApplicationListCard';
import { useAuth } from '@/contexts/AuthContext';
import { useHiringCelebration } from '@/hooks/useHiringCelebration';
import { useRefreshOnFocus } from '@/hooks/useRefreshOnFocus';
import { useWorkerHiringCelebration } from '@/hooks/useWorkerHiringCelebration';
import { toJobCelebrationCandidates } from '@/lib/hiringCelebrationCandidates';
import { getWorkerApplicationRoute } from '@/lib/routing';
import { useThemedStyles } from '@/theme';

export default function WorkerApplicationsScreen() {
  const { user } = useAuth();
  const [applications, setApplications] = useState<Awaited<
    ReturnType<typeof listWorkerJobApplications>
  >>([]);
  const [unreadMap, setUnreadMap] = useState<Record<string, boolean>>({});
  const {
    celebrationVisible,
    celebrationPayload,
    showCelebration,
    closeCelebration,
  } = useHiringCelebration();
  const { checkApplications } = useWorkerHiringCelebration(showCelebration);

  const styles = useThemedStyles(({ spacing, typography }) => ({
    list: { gap: spacing.md },
    empty: typography.subtitle,
  }));

  const load = useCallback(async () => {
    if (!user?.id) {
      setApplications([]);
      return;
    }

    try {
      const [rows, unread] = await Promise.all([
        listWorkerJobApplications(user.id),
        getUnreadConversationMap(user.id, 'worker'),
      ]);
      setApplications(rows);
      setUnreadMap(unread);
      await checkApplications(toJobCelebrationCandidates(rows));
    } catch (error) {
      setApplications([]);
      Alert.alert(
        'Could not load applications',
        error instanceof Error ? error.message : 'Please try again.',
      );
    }
  }, [checkApplications, user?.id]);

  useRefreshOnFocus(load);

  return (
    <>
      <Screen title="Applications" subtitle="Roles you've applied to — track status here.">
        {applications.length === 0 ? (
          <Text style={styles.empty}>No role applications yet. Browse open roles to get started.</Text>
        ) : (
          <View style={styles.list}>
            {applications.map((application) => (
              <WorkerApplicationListCard
                key={application.id}
                application={application}
                hasUnreadMessages={Boolean(unreadMap[application.id])}
                onPress={() =>
                  router.push(getWorkerApplicationRoute(application.id, 'applications-tab'))
                }
              />
            ))}
          </View>
        )}
      </Screen>
      <HiringCelebrationModal
        visible={celebrationVisible}
        payload={celebrationPayload}
        onClose={() => void closeCelebration()}
      />
    </>
  );
}
