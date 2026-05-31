import { listWorkerJobApplications, getUnreadConversationMap } from '@chairside/api';
import { router } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
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
import {
  confirmHideWorkerApplication,
  partitionWorkerApplications,
} from '@/lib/workerApplicationHide';
import { useThemedStyles } from '@/theme';

function ApplicationSection({
  title,
  applications,
  unreadMap,
  onHide,
}: {
  title: string;
  applications: Awaited<ReturnType<typeof listWorkerJobApplications>>;
  unreadMap: Record<string, boolean>;
  onHide?: () => void;
}) {
  const styles = useThemedStyles(({ spacing, typography }) => ({
    section: { gap: spacing.sm },
    title: {
      ...typography.body,
      fontSize: 13,
      fontWeight: '600',
      letterSpacing: 0.4,
      textTransform: 'uppercase',
      color: typography.subtitle.color,
    },
    list: { gap: spacing.md },
  }));

  if (applications.length === 0) return null;

  return (
    <View style={styles.section}>
      <Text style={styles.title}>{title}</Text>
      <View style={styles.list}>
        {applications.map((application) => (
          <WorkerApplicationListCard
            key={application.id}
            application={application}
            hasUnreadMessages={Boolean(unreadMap[application.id])}
            onPress={() =>
              router.push(getWorkerApplicationRoute(application.id, 'applications-tab'))
            }
            onRemove={
              onHide
                ? () => confirmHideWorkerApplication(application, onHide)
                : undefined
            }
          />
        ))}
      </View>
    </View>
  );
}

export default function WorkerApplicationsScreen() {
  const { user } = useAuth();
  const [applications, setApplications] = useState<Awaited<
    ReturnType<typeof listWorkerJobApplications>
  >>([]);
  const [archivedApplications, setArchivedApplications] = useState<Awaited<
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

  const { active, past } = useMemo(
    () => partitionWorkerApplications(applications),
    [applications],
  );

  const styles = useThemedStyles(({ spacing, typography }) => ({
    content: { gap: spacing.lg },
    empty: typography.subtitle,
  }));

  const load = useCallback(async () => {
    if (!user?.id) {
      setApplications([]);
      setArchivedApplications([]);
      return;
    }

    try {
      const [rows, archived, unread] = await Promise.all([
        listWorkerJobApplications(user.id, 'active'),
        listWorkerJobApplications(user.id, 'archived'),
        getUnreadConversationMap(user.id, 'worker'),
      ]);
      setApplications(rows);
      setArchivedApplications(archived);
      setUnreadMap(unread);
      await checkApplications(toJobCelebrationCandidates(rows));
    } catch (error) {
      setApplications([]);
      setArchivedApplications([]);
      Alert.alert(
        'Could not load applications',
        error instanceof Error ? error.message : 'Please try again.',
      );
    }
  }, [checkApplications, user?.id]);

  useRefreshOnFocus(load);

  const handleHidden = useCallback(() => {
    void load();
  }, [load]);

  const hasAnyApplications = applications.length > 0 || archivedApplications.length > 0;

  return (
    <>
      <Screen title="Applications" subtitle="Roles you've applied to — track status here.">
        {!hasAnyApplications ? (
          <Text style={styles.empty}>No role applications yet. Browse open roles to get started.</Text>
        ) : (
          <View style={styles.content}>
            <ApplicationSection
              title="Active"
              applications={active}
              unreadMap={unreadMap}
            />
            <ApplicationSection
              title="Past"
              applications={past}
              unreadMap={unreadMap}
              onHide={handleHidden}
            />
            <ApplicationSection
              title="Removed from list"
              applications={archivedApplications}
              unreadMap={unreadMap}
            />
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
