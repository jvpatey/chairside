import { getUnreadConversationMap, listWorkerJobApplications } from '@chairside/api';
import { useCallback, useMemo, useState } from 'react';
import { Alert, Platform, Text, View } from 'react-native';

import { HiringCelebrationModal } from '@/components/celebration/HiringCelebrationModal';
import { FormErrorBanner } from '@/components/ui/FormErrorBanner';
import { Screen } from '@/components/ui/Screen';
import { WorkerApplicationListCard } from '@/components/worker/WorkerApplicationListCard';
import { useAuth } from '@/contexts/AuthContext';
import { useHiringCelebration } from '@/hooks/useHiringCelebration';
import { useRefreshOnFocus } from '@/hooks/useRefreshOnFocus';
import { useWorkerHiringCelebration } from '@/hooks/useWorkerHiringCelebration';
import { toJobCelebrationCandidates } from '@/lib/hiringCelebrationCandidates';
import { partitionWorkerApplications } from '@/lib/workerApplicationHide';
import { useThemedStyles } from '@/theme';

function ApplicationSection({
  title,
  applications,
  unreadMap,
  expandedApplicationId,
  onExpandChange,
  onUpdated,
  onHide,
  linkToDetail = false,
}: {
  title: string;
  applications: Awaited<ReturnType<typeof listWorkerJobApplications>>;
  unreadMap: Record<string, boolean>;
  expandedApplicationId: string | null;
  onExpandChange: (applicationId: string | null) => void;
  onUpdated?: () => void;
  onHide?: () => void;
  linkToDetail?: boolean;
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
            returnTo="applications-tab"
            expanded={linkToDetail ? false : expandedApplicationId === application.id}
            onExpandChange={
              linkToDetail ? undefined : (next) => onExpandChange(next ? application.id : null)
            }
            linkToDetail={linkToDetail}
            onUpdated={onUpdated}
            onHidden={onHide}
          />
        ))}
      </View>
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
  const [applications, setApplications] = useState<Awaited<
    ReturnType<typeof listWorkerJobApplications>
  >>([]);
  const [archivedApplications, setArchivedApplications] = useState<Awaited<
    ReturnType<typeof listWorkerJobApplications>
  >>([]);
  const [unreadMap, setUnreadMap] = useState<Record<string, boolean>>({});
  const [expandedApplicationId, setExpandedApplicationId] = useState<string | null>(null);
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
      setFormError(null);
      await checkApplications(toJobCelebrationCandidates(rows));
    } catch (error) {
      setApplications([]);
      setArchivedApplications([]);
      const message = error instanceof Error ? error.message : 'Please try again.';
      setFormError(message);
      if (Platform.OS !== 'web') {
        Alert.alert('Could not load applications', message);
      }
    }
  }, [checkApplications, user?.id]);

  useRefreshOnFocus(load);

  const handleHidden = useCallback(() => {
    void load();
  }, [load]);

  const hasAnyApplications = applications.length > 0 || archivedApplications.length > 0;

  return (
    <>
      <Screen
        title={compact ? undefined : 'Applications'}
        subtitle={
          compact ? undefined : "Roles you've applied to — track status here."
        }
        showHeader={!compact}
        constrainWidth={!compact}>
        <FormErrorBanner message={formError} />
        {!hasAnyApplications ? (
          <Text style={styles.empty}>
            No role applications yet. Browse open roles to get started.
          </Text>
        ) : (
          <View style={styles.content}>
            <ApplicationSection
              title="Active"
              applications={active}
              unreadMap={unreadMap}
              expandedApplicationId={expandedApplicationId}
              onExpandChange={setExpandedApplicationId}
              onUpdated={() => void load()}
              linkToDetail={compact}
            />
            <ApplicationSection
              title="Past"
              applications={past}
              unreadMap={unreadMap}
              expandedApplicationId={expandedApplicationId}
              onExpandChange={setExpandedApplicationId}
              onUpdated={() => void load()}
              onHide={handleHidden}
              linkToDetail={compact}
            />
            <ApplicationSection
              title="Removed from list"
              applications={archivedApplications}
              unreadMap={unreadMap}
              expandedApplicationId={expandedApplicationId}
              onExpandChange={setExpandedApplicationId}
              onUpdated={() => void load()}
              linkToDetail={compact}
            />
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
