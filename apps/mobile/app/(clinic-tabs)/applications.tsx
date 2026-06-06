import { listJobApplicationSummaries, type JobApplicationSummary } from '@chairside/api';
import { formatJobApplicationSummaryMeta } from '@chairside/config';
import { router } from 'expo-router';
import { useCallback, useState } from 'react';
import { Text, View } from 'react-native';

import { ClinicLogoAvatar } from '@/components/clinic/ClinicLogoAvatar';
import { BrowseListGroup } from '@/components/ui/BrowseListGroup';
import { BrowseListRow } from '@/components/ui/BrowseListRow';
import { ApplicationCardBadge } from '@/components/ui/ApplicationCardBadge';
import { Screen } from '@/components/ui/Screen';
import { useAuth } from '@/contexts/AuthContext';
import { useClinicProfile } from '@/contexts/ClinicProfileContext';
import { useClinicLogoUri } from '@/hooks/useClinicLogoUri';
import { useRefreshOnFocus } from '@/hooks/useRefreshOnFocus';
import { getClinicRoleApplicationsRoute } from '@/lib/routing';
import { useThemedStyles } from '@/theme';

function RoleApplicationSummaryRow({
  summary,
  onPress,
}: {
  summary: JobApplicationSummary;
  onPress: () => void;
}) {
  const { clinicProfile } = useClinicProfile();
  const logoUri = useClinicLogoUri(clinicProfile?.logo_storage_path);
  const clinicName = clinicProfile?.clinic_name?.trim() || 'Your clinic';
  const location = [clinicProfile?.city, clinicProfile?.province].filter(Boolean).join(', ');
  const applicantLabel =
    summary.applicant_count === 1 ? '1 applicant' : `${summary.applicant_count} applicants`;
  const reviewMeta = formatJobApplicationSummaryMeta(summary);
  const hasNewApplicants = summary.pending_count > 0;

  const styles = useThemedStyles(({ colors, spacing }) => ({
    statPill: {
      alignSelf: 'flex-start',
      backgroundColor: colors.primarySubtle,
      borderRadius: 999,
      paddingHorizontal: spacing.sm,
      paddingVertical: 4,
    },
    statPillNew: {
      backgroundColor: colors.primary,
    },
    statText: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.primary,
    },
    statTextNew: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.primaryOnPrimary,
    },
  }));

  return (
    <BrowseListRow
      avatar={<ClinicLogoAvatar clinicName={clinicName} logoUri={logoUri} size={40} />}
      eyebrow={clinicName}
      title={summary.post_title}
      meta={location || null}
      detail={reviewMeta}
      topTrailing={hasNewApplicants ? <ApplicationCardBadge /> : undefined}
      footer={
        <View style={[styles.statPill, hasNewApplicants && styles.statPillNew]}>
          <Text style={[styles.statText, hasNewApplicants && styles.statTextNew]}>
            {hasNewApplicants
              ? summary.pending_count === 1
                ? '1 new applicant'
                : `${summary.pending_count} new applicants`
              : applicantLabel}
          </Text>
        </View>
      }
      onPress={onPress}
    />
  );
}

export default function ClinicApplicationsScreen() {
  const { user } = useAuth();
  const [summaries, setSummaries] = useState<JobApplicationSummary[]>([]);

  const styles = useThemedStyles(({ typography }) => ({
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
        <BrowseListGroup>
          {summaries.map((summary) => (
            <RoleApplicationSummaryRow
              key={summary.job_post_id}
              summary={summary}
              onPress={() =>
                router.push(getClinicRoleApplicationsRoute(summary.job_post_id, 'applications-tab'))
              }
            />
          ))}
        </BrowseListGroup>
      )}
    </Screen>
  );
}
