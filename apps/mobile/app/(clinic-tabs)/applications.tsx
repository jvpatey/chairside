import { listJobApplicationSummaries, type JobApplicationSummary } from '@chairside/api';
import { formatJobApplicationSummaryMeta } from '@chairside/config';
import { router } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { Screen } from '@/components/ui/Screen';
import { ClinicPostHeader } from '@/components/worker/ClinicPostHeader';
import { useAuth } from '@/contexts/AuthContext';
import { useClinicProfile } from '@/contexts/ClinicProfileContext';
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
  const { clinicProfile } = useClinicProfile();
  const clinicName = clinicProfile?.clinic_name?.trim() || 'Your clinic';
  const location = [clinicProfile?.city, clinicProfile?.province].filter(Boolean).join(', ');

  const styles = useThemedStyles(({ colors, spacing }) => ({
    card: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.separator,
      padding: spacing.md,
    },
    cardPressed: { opacity: 0.92 },
    statPill: {
      alignSelf: 'flex-start',
      backgroundColor: colors.primarySubtle,
      borderRadius: 999,
      paddingHorizontal: spacing.sm,
      paddingVertical: 4,
    },
    statText: {
      fontSize: 13,
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
      <ClinicPostHeader
        clinicName={clinicName}
        logoStoragePath={clinicProfile?.logo_storage_path}
        title={summary.post_title}
        location={location || null}
        detail={reviewMeta}
        avatarSize={44}
        textFooter={
          <View style={styles.statPill}>
            <Text style={styles.statText}>{applicantLabel}</Text>
          </View>
        }
      />
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
