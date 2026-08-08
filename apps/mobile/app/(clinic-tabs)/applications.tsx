import { listJobApplicationSummaries, type JobApplicationSummary } from '@chairside/api';
import { formatJobApplicationSummaryMeta } from '@chairside/config';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { View } from 'react-native';

import { FileTabWell } from '@/components/dashboard/FileTabWell';
import { ClinicLogoAvatar } from '@/components/clinic/ClinicLogoAvatar';
import { ClinicRoleApplicantsPanel } from '@/components/clinic/ClinicRoleApplicantsPanel';
import { DashboardErrorBanner } from '@/components/dashboard/DashboardErrorBanner';
import { FadeInSection } from '@/components/dashboard/FadeInSection';
import { BrowseListRow } from '@/components/ui/BrowseListRow';
import { ApplicationCardBadge } from '@/components/ui/ApplicationCardBadge';
import { formatApplicantCountLabelWithNew } from '@/components/ui/CountBadge';
import { EmptyState } from '@/components/ui/EmptyState';
import { ListSearchFilterRow } from '@/components/ui/ListSearchFilterRow';
import { MasterDetailLayout } from '@/components/ui/MasterDetailLayout';
import { PageLoadingList } from '@/components/ui/PageLoadingState';
import { Screen } from '@/components/ui/Screen';
import { StaggeredList } from '@/components/ui/StaggeredList';
import { SurfaceCard } from '@/components/ui/SurfaceCard';

import { useClinicProfile } from '@/contexts/ClinicProfileContext';
import { useClinicLogoUri } from '@/hooks/useClinicLogoUri';
import { useResolvedClinicLogoPath } from '@/hooks/useResolvedClinicLogoPath';
import { useClinicActingContext } from '@/hooks/useClinicActingContext';
import { usePullToRefresh } from '@/hooks/usePullToRefresh';
import { useRefreshOnFocus } from '@/hooks/useRefreshOnFocus';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';
import { formatPostedDateLabel } from '@/lib/dates';
import { redirectEmbeddedCalendarDeepLink } from '@/lib/calendarNavigation';
import {
  hasActiveListSearch,
  matchesClinicApplicationSummaryFilter,
  matchesJobApplicationSummarySearch,
  type ClinicApplicationSummaryFilter,
} from '@/lib/clinicListSearch';
import { CLINIC_POST_JOB, getClinicRoleApplicationsRoute } from '@/lib/routing';
import { useTheme, useThemedStyles } from '@/theme';

function RoleSummaryAvatar() {
  const { clinicProfile } = useClinicProfile();
  const logoStoragePath = useResolvedClinicLogoPath();
  const logoUri = useClinicLogoUri(logoStoragePath);
  const clinicName = clinicProfile?.clinic_name?.trim() || 'Your clinic';

  return <ClinicLogoAvatar clinicName={clinicName} logoUri={logoUri} size={44} />;
}

function RoleApplicationSummaryRow({
  summary,
  selected,
  onViewPress,
}: {
  summary: JobApplicationSummary;
  selected?: boolean;
  onViewPress: () => void;
}) {
  const { colors } = useTheme();
  const pipelineMeta = formatJobApplicationSummaryMeta(summary);
  const hasNewApplicants = summary.unseen_count > 0;
  const postedLabel = formatPostedDateLabel(summary.post_created_at);
  const metaLine = [
    summary.applicant_count > 0
      ? formatApplicantCountLabelWithNew(summary.applicant_count, summary.unseen_count)
      : null,
    pipelineMeta,
  ]
    .filter(Boolean)
    .join(' · ');

  const row = (
    <SurfaceCard
      padding="none"
      onPress={onViewPress}
      style={
        selected
          ? {
              borderColor: colors.primary,
              borderWidth: 1.5,
            }
          : undefined
      }>
      <BrowseListRow
        avatar={<RoleSummaryAvatar />}
        title={summary.post_title}
        meta={metaLine || null}
        postedLabel={postedLabel || null}
        postedLabelPlacement="header"
        topTrailing={hasNewApplicants ? <ApplicationCardBadge /> : undefined}
        showChevron={Boolean(onViewPress) && !selected}
      />
    </SurfaceCard>
  );

  return hasNewApplicants ? <FadeInSection>{row}</FadeInSection> : row;
}

export default function ClinicApplicationsScreen() {
  const params = useLocalSearchParams<{ mode?: string; date?: string }>();
  const { isProfileComplete } = useClinicProfile();
  const { clinicId, scopedLocationIds } = useClinicActingContext();
  const { isWide } = useResponsiveLayout();
  const [summaries, setSummaries] = useState<JobApplicationSummary[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [summaryFilter, setSummaryFilter] = useState<ClinicApplicationSummaryFilter>('all');
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  const useSplit = isWide;

  const styles = useThemedStyles(({ spacing }) => ({
    content: { gap: spacing.lg, flex: useSplit ? 1 : undefined, minHeight: useSplit ? 0 : undefined },
    list: { gap: spacing.lg },
    masterPane: {
      gap: spacing.lg,
      flex: 1,
      minHeight: 0,
      paddingHorizontal: spacing.lg,
      paddingBottom: spacing.xl,
    },
    detailEmpty: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      padding: spacing.xl,
    },
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

  const needsAttentionCount = useMemo(
    () => summaries.filter((summary) => summary.unseen_count > 0).length,
    [summaries],
  );

  const applicationFilterTabs = useMemo(
    () => [
      {
        value: 'all' as const,
        label: 'All roles',
        count: summaries.length,
        accent: 'primary' as const,
        icon: 'briefcase-outline' as const,
      },
      {
        value: 'needs_attention' as const,
        label: 'Needs attention',
        count: needsAttentionCount,
        badgeCount: needsAttentionCount,
        accent: 'primary' as const,
        icon: 'alert-circle-outline' as const,
      },
    ],
    [needsAttentionCount, summaries.length],
  );

  const hasSearch = hasActiveListSearch(searchQuery);
  const isNeedsAttentionFilter = summaryFilter === 'needs_attention';
  const hasActiveFilters = isNeedsAttentionFilter;

  const load = useCallback(async () => {
    if (!clinicId) {
      setSummaries([]);
      setLoadError(false);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setLoadError(false);
    try {
      const rows = await listJobApplicationSummaries(clinicId, {
        locationIds: scopedLocationIds,
      });
      setSummaries(rows);
    } catch {
      setSummaries([]);
      setLoadError(true);
    } finally {
      setIsLoading(false);
    }
  }, [clinicId, scopedLocationIds]);

  useRefreshOnFocus(load);
  const { refreshing, onRefresh } = usePullToRefresh(load);

  useEffect(() => {
    const redirect = redirectEmbeddedCalendarDeepLink(
      params.mode,
      typeof params.date === 'string' ? params.date : undefined,
      'clinic',
    );
    if (redirect) {
      router.replace(redirect);
    }
  }, [params.date, params.mode]);

  useEffect(() => {
    if (!useSplit) {
      setSelectedJobId(null);
      return;
    }
    if (filteredSummaries.length === 0) {
      setSelectedJobId(null);
      return;
    }
    setSelectedJobId((current) => {
      if (current && filteredSummaries.some((row) => row.job_post_id === current)) {
        return current;
      }
      return filteredSummaries[0]?.job_post_id ?? null;
    });
  }, [filteredSummaries, useSplit]);

  const postRoleCta = isProfileComplete
    ? {
        ctaLabel: 'Post role' as const,
        onCtaPress: () => router.push(CLINIC_POST_JOB),
      }
    : {};

  const handleRowPress = (jobPostId: string) => {
    if (useSplit) {
      setSelectedJobId(jobPostId);
      return;
    }
    router.push(getClinicRoleApplicationsRoute(jobPostId, 'applications-tab'));
  };

  const listBody =
    filteredSummaries.length === 0 ? (
      <EmptyState
        embedded
        icon={hasSearch || hasActiveFilters ? 'search-outline' : 'document-text-outline'}
        title={
          hasSearch
            ? 'No roles match your search'
            : isNeedsAttentionFilter
              ? 'No roles need attention'
              : 'No applications yet'
        }
        message={
          hasSearch
            ? 'Try a different search or filter.'
            : isNeedsAttentionFilter
              ? 'Roles with new applicants will appear here.'
              : 'They will appear here when workers apply to your roles.'
        }
        {...(hasSearch || isNeedsAttentionFilter ? {} : postRoleCta)}
      />
    ) : (
      <View style={styles.list}>
        <StaggeredList>
          {filteredSummaries.map((summary) => (
            <RoleApplicationSummaryRow
              key={summary.job_post_id}
              summary={summary}
              selected={useSplit && selectedJobId === summary.job_post_id}
              onViewPress={() => handleRowPress(summary.job_post_id)}
            />
          ))}
        </StaggeredList>
      </View>
    );

  const filtersAndList = (
    <>
      <ListSearchFilterRow
        value={searchQuery}
        onChange={setSearchQuery}
        placeholder="Search role title"
        accessibilityLabel="Search applications"
      />
      <FileTabWell
        tabs={applicationFilterTabs}
        selected={summaryFilter}
        onSelect={setSummaryFilter}>
        {listBody}
      </FileTabWell>
    </>
  );

  return (
    <Screen
      title="Applications"
      subtitle="Review applicants and your interview schedule."
      refreshing={refreshing}
      onRefresh={onRefresh}
      scroll={!useSplit}
      fillsContainer={useSplit}
      constrainWidth={!useSplit}>
      <View style={styles.content}>
        {loadError ? (
          <DashboardErrorBanner
            message="Could not load applications."
            onRetry={() => void load()}
          />
        ) : null}
        {isLoading ? (
          <PageLoadingList message="Loading applications…" />
        ) : loadError ? null : summaries.length === 0 ? (
          <EmptyState
            icon="document-text-outline"
            title="No applications yet"
            message="They will appear here when workers apply to your roles."
            {...postRoleCta}
          />
        ) : useSplit ? (
          <MasterDetailLayout
            showDetail={Boolean(selectedJobId)}
            master={<View style={styles.masterPane}>{filtersAndList}</View>}
            detail={
              selectedJobId ? (
                <ClinicRoleApplicantsPanel
                  key={selectedJobId}
                  jobId={selectedJobId}
                  returnTo="applications-tab"
                  embedded
                />
              ) : (
                <View style={styles.detailEmpty}>
                  <EmptyState
                    icon="people-outline"
                    title="Select a role"
                    message="Choose a role on the left to review applicants."
                  />
                </View>
              )
            }
          />
        ) : (
          filtersAndList
        )}
      </View>
    </Screen>
  );
}
