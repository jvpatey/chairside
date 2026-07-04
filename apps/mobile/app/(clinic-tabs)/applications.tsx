import { listJobApplicationSummaries, type JobApplicationSummary } from '@chairside/api';
import { formatJobApplicationSummaryMeta } from '@chairside/config';
import { router } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { View } from 'react-native';

import { ClinicApplicationSummaryFilters } from '@/components/clinic/ClinicApplicationSummaryFilters';

import { ClinicLogoAvatar } from '@/components/clinic/ClinicLogoAvatar';
import {
  formatViewApplicantsLabel,
  PostingCardActionButton,
} from '@/components/clinic/PostingCardActionButton';
import { FadeInSection } from '@/components/dashboard/FadeInSection';
import { BrowseListGroup } from '@/components/ui/BrowseListGroup';
import { BrowseListRow } from '@/components/ui/BrowseListRow';
import { ApplicationCardBadge } from '@/components/ui/ApplicationCardBadge';
import { EmptyState } from '@/components/ui/EmptyState';
import { ListSearchFilterRow } from '@/components/ui/ListSearchFilterRow';
import { PageLoadingList } from '@/components/ui/PageLoadingState';
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
import { CLINIC_POST_JOB, getClinicRoleApplicationsRoute } from '@/lib/routing';
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

  const row = (
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

  return hasNewApplicants ? <FadeInSection>{row}</FadeInSection> : row;
}

export default function ClinicApplicationsScreen() {
  const { user } = useAuth();
  const { isProfileComplete } = useClinicProfile();
  const [summaries, setSummaries] = useState<JobApplicationSummary[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [summaryFilter, setSummaryFilter] = useState<ClinicApplicationSummaryFilter>('all');
  const [isLoading, setIsLoading] = useState(true);

  const styles = useThemedStyles(({ spacing }) => ({
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
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const rows = await listJobApplicationSummaries(user.id);
      setSummaries(rows);
    } catch {
      setSummaries([]);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  useRefreshOnFocus(load);

  const postRoleCta = isProfileComplete
    ? {
        ctaLabel: 'Post role' as const,
        onCtaPress: () => router.push(CLINIC_POST_JOB),
      }
    : {};

  return (
    <Screen title="Applications" subtitle="Open a role to review its applicants.">
      {isLoading ? (
        <PageLoadingList message="Loading applications…" />
      ) : summaries.length === 0 ? (
        <EmptyState
          icon="document-text-outline"
          title="No applications yet"
          message="They will appear here when workers apply to your roles."
          {...postRoleCta}
        />
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
            <EmptyState
              icon={hasSearch || hasActiveFilters ? 'search-outline' : 'document-text-outline'}
              title={
                hasSearch || hasActiveFilters ? 'No roles match your search' : 'No applications yet'
              }
              message={
                hasSearch || hasActiveFilters
                  ? 'Try a different search or filter.'
                  : 'They will appear here when workers apply to your roles.'
              }
              {...(hasSearch || hasActiveFilters ? {} : postRoleCta)}
            />
          ) : (
            <BrowseListGroup>
              {filteredSummaries.map((summary) => (
                <RoleApplicationSummaryRow
                  key={summary.job_post_id}
                  summary={summary}
                  onViewPress={() =>
                    router.push(
                      getClinicRoleApplicationsRoute(summary.job_post_id, 'applications-tab'),
                    )
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
