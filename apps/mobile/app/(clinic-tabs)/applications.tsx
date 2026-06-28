import { listJobApplicationSummaries, type JobApplicationSummary } from '@chairside/api';
import { formatJobApplicationSummaryMeta } from '@chairside/config';
import { router } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Text, View } from 'react-native';

import { ClinicApplicationSummaryFilters } from '@/components/clinic/ClinicApplicationSummaryFilters';

import { ClinicLogoAvatar } from '@/components/clinic/ClinicLogoAvatar';
import {
  formatViewApplicantsLabel,
  PostingCardActionButton,
} from '@/components/clinic/PostingCardActionButton';
import { BrowseListGroup } from '@/components/ui/BrowseListGroup';
import { BrowseListRow } from '@/components/ui/BrowseListRow';
import { ApplicationCardBadge } from '@/components/ui/ApplicationCardBadge';
import { ListSearchFilterRow } from '@/components/ui/ListSearchFilterRow';
import { Screen } from '@/components/ui/Screen';
import { useAuth } from '@/contexts/AuthContext';
import { useClinicProfile } from '@/contexts/ClinicProfileContext';
import { useClinicLogoUri } from '@/hooks/useClinicLogoUri';
import { useRefreshOnFocus } from '@/hooks/useRefreshOnFocus';
import { formatPostedDateLabel } from '@/lib/dates';
import {
  hasActiveListSearch,
  matchesClinicApplicationSummaryFilter,
  matchesJobApplicationSummarySearch,
  type ClinicApplicationSummaryFilter,
} from '@/lib/clinicListSearch';
import { getClinicRoleApplicationsRoute } from '@/lib/routing';
import { useThemedStyles } from '@/theme';

function RoleApplicationSummaryRow({
  summary,
  onViewPress,
}: {
  summary: JobApplicationSummary;
  onViewPress: () => void;
}) {
  const { clinicProfile } = useClinicProfile();
  const logoUri = useClinicLogoUri(clinicProfile?.logo_storage_path);
  const clinicName = clinicProfile?.clinic_name?.trim() || 'Your clinic';
  const location = [clinicProfile?.city, clinicProfile?.province].filter(Boolean).join(', ');
  const pipelineMeta = formatJobApplicationSummaryMeta(summary);
  const hasNewApplicants = summary.unseen_count > 0;
  const postedLabel = formatPostedDateLabel(summary.post_created_at);
  const viewLabel = formatViewApplicantsLabel(summary.applicant_count);

  return (
    <BrowseListRow
      avatar={<ClinicLogoAvatar clinicName={clinicName} logoUri={logoUri} size={40} />}
      eyebrow={clinicName}
      title={summary.post_title}
      meta={location || null}
      postedLabel={postedLabel || null}
      postedLabelPlacement="header"
      detail={pipelineMeta}
      topTrailing={hasNewApplicants ? <ApplicationCardBadge /> : undefined}
      showChevron={false}
      action={
        <PostingCardActionButton
          label={viewLabel}
          variant="primary"
          highlighted={hasNewApplicants}
          fullWidth
          onPress={onViewPress}
        />
      }
    />
  );
}

export default function ClinicApplicationsScreen() {
  const { user } = useAuth();
  const [summaries, setSummaries] = useState<JobApplicationSummary[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [summaryFilter, setSummaryFilter] = useState<ClinicApplicationSummaryFilter>('all');

  const styles = useThemedStyles(({ typography, spacing }) => ({
    empty: typography.subtitle,
    content: { gap: spacing.md },
  }));

  const filteredSummaries = useMemo(
    () =>
      summaries.filter(
        (summary) =>
          matchesClinicApplicationSummaryFilter(summary, summaryFilter) &&
          matchesJobApplicationSummarySearch(summary, searchQuery),
      ),
    [summaries, summaryFilter, searchQuery],
  );

  const hasSearch = hasActiveListSearch(searchQuery);
  const hasActiveFilters = summaryFilter !== 'all';

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
        <View style={styles.content}>
          <ListSearchFilterRow
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search role title"
            accessibilityLabel="Search applications"
            filter={
              <ClinicApplicationSummaryFilters
                selected={summaryFilter}
                onChange={setSummaryFilter}
              />
            }
          />
          {filteredSummaries.length === 0 ? (
            <Text style={styles.empty}>
              {hasSearch || hasActiveFilters
                ? 'No roles match your search or filter.'
                : 'No applications yet. They will appear here when workers apply to your roles.'}
            </Text>
          ) : (
            <BrowseListGroup>
              {filteredSummaries.map((summary) => (
                <RoleApplicationSummaryRow
                  key={summary.job_post_id}
                  summary={summary}
                  onViewPress={() =>
                    router.push(getClinicRoleApplicationsRoute(summary.job_post_id, 'applications-tab'))
                  }
                />
              ))}
            </BrowseListGroup>
          )}
        </View>
      )}
    </Screen>
  );
}
