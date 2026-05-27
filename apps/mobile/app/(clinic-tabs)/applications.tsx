import { listJobApplicationSummaries, type JobApplicationSummary } from '@chairside/api';
import { formatJobApplicationSummaryMeta } from '@chairside/config';
import { router } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { Screen } from '@/components/ui/Screen';
import { useAuth } from '@/contexts/AuthContext';
import { useRefreshOnFocus } from '@/hooks/useRefreshOnFocus';
import { getClinicRoleApplicationsRoute } from '@/lib/routing';
import { useThemedStyles } from '@/theme';

function RoleApplicationSummaryCard({
  summary,
  onPress,
}: {
  summary: JobApplicationSummary;
  onPress: () => void;
}) {
  const styles = useThemedStyles(({ colors, spacing, typography }) => ({
    card: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.separator,
      padding: spacing.lg,
      gap: spacing.xs,
    },
    cardPressed: { opacity: 0.92 },
    title: { ...typography.body, fontWeight: '600', fontSize: 16 },
    meta: typography.subtitle,
    stat: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.primary,
    },
  }));

  const applicantLabel =
    summary.applicant_count === 1 ? '1 applicant' : `${summary.applicant_count} applicants`;
  const reviewMeta = formatJobApplicationSummaryMeta(summary);

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}>
      <Text style={styles.title}>{summary.post_title}</Text>
      <Text style={styles.stat}>{applicantLabel}</Text>
      {reviewMeta ? <Text style={styles.meta}>{reviewMeta}</Text> : null}
    </Pressable>
  );
}

export default function ClinicApplicationsScreen() {
  const { user } = useAuth();
  const [summaries, setSummaries] = useState<JobApplicationSummary[]>([]);

  const styles = useThemedStyles(({ spacing, typography }) => ({
    list: { gap: spacing.md },
    empty: typography.subtitle,
  }));

  const load = useCallback(async () => {
    if (!user?.id) {
      setSummaries([]);
      return;
    }

    try {
      const rows = await listJobApplicationSummaries(user.id);
      setSummaries(rows);
    } catch {
      setSummaries([]);
    }
  }, [user?.id]);

  useRefreshOnFocus(load);

  return (
    <Screen title="Applications" subtitle="Open a role to review its applicants.">
      {summaries.length === 0 ? (
        <Text style={styles.empty}>
          No applications yet. They will appear here when workers apply to your roles.
        </Text>
      ) : (
        <View style={styles.list}>
          {summaries.map((summary) => (
            <RoleApplicationSummaryCard
              key={summary.job_post_id}
              summary={summary}
              onPress={() =>
                router.push(getClinicRoleApplicationsRoute(summary.job_post_id, 'applications-tab'))
              }
            />
          ))}
        </View>
      )}
    </Screen>
  );
}
