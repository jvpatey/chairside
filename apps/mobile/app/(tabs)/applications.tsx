import { listWorkerJobApplications, type WorkerApplication } from '@chairside/api';
import { formatApplicationStatus } from '@chairside/config';
import { useCallback, useState } from 'react';
import { Alert, Text, View } from 'react-native';

import { Screen } from '@/components/ui/Screen';
import { useAuth } from '@/contexts/AuthContext';
import { useRefreshOnFocus } from '@/hooks/useRefreshOnFocus';
import { useThemedStyles } from '@/theme';

function WorkerApplicationCard({ application }: { application: WorkerApplication }) {
  const styles = useThemedStyles(({ colors, spacing, typography }) => ({
    card: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.separator,
      padding: spacing.lg,
      gap: spacing.sm,
    },
    title: { ...typography.body, fontWeight: '600' },
    meta: typography.subtitle,
    status: { fontSize: 14, fontWeight: '600', color: colors.primary },
  }));

  return (
    <View style={styles.card}>
      <Text style={styles.title}>{application.post_title}</Text>
      <Text style={styles.meta}>
        {application.clinic_name}
        {application.clinic_city ? ` · ${application.clinic_city}` : ''}
      </Text>
      <Text style={styles.status}>{formatApplicationStatus(application.status)}</Text>
      {application.match_score != null ? (
        <Text style={styles.meta}>Match score: {application.match_score}%</Text>
      ) : null}
    </View>
  );
}

export default function WorkerApplicationsScreen() {
  const { user } = useAuth();
  const [applications, setApplications] = useState<WorkerApplication[]>([]);

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
      const rows = await listWorkerJobApplications(user.id);
      setApplications(rows);
    } catch (error) {
      setApplications([]);
      Alert.alert(
        'Could not load applications',
        error instanceof Error ? error.message : 'Please try again.',
      );
    }
  }, [user?.id]);

  useRefreshOnFocus(load);

  return (
    <Screen title="Applications" subtitle="Roles you've applied to — track status here.">
      {applications.length === 0 ? (
        <Text style={styles.empty}>No role applications yet. Browse open roles to get started.</Text>
      ) : (
        <View style={styles.list}>
          {applications.map((application) => (
            <WorkerApplicationCard key={application.id} application={application} />
          ))}
        </View>
      )}
    </Screen>
  );
}
