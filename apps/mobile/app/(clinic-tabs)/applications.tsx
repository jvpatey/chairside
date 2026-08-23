import { listJobApplicationSummaries, type JobApplicationSummary } from '@chairside/api';
import { formatJobApplicationSummaryMeta } from '@chairside/config';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { View } from 'react-native';

import { FileTabWell } from '@/components/dashboard/FileTabWell';
import { ClinicLocationScopeChip } from '@/components/clinic/ClinicLocationScopeChip';
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
import { IS_WEB } from '@/lib/webPressableStyles';
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
              borderColor: colors.tertiary,
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
  const params = useLocalSearchParams<{ mode?: string; date?: string; jobId?: string }>();
  const { isProfileComplete } = useClinicProfile();
  const { clinicId, scopedLocationIds, isGroup, accessibleLocations } = useClinicActingContext();
  const { isWide } = useResponsiveLayout();
  const [summaries, setSummaries] = useState<JobApplicationSummary[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [summaryFilter, setSummaryFilter] = useState<ClinicApplicationSummaryFilter>('all');
  const [selectedJobId, setSelectedJobId] = useState<string | null>(
    typeof params.jobId === 'string' ? params.jobId : null,
  );
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  // List+detail split is web-only — iPad with the sidebar is too cramped.
  const useSplit = IS_WEB && isWide;

  const styles = useThemedStyles(({ spacing }) => ({
    content: {
      gap: spacing.lg,
      flex: useSplit ? 1 : undefined,
      minHeight: useSplit ? 0 : undefined,
    },
    splitContent: {
      gap: 0,
      flex: 1,
      minHeight: 0,
    },
    list: { gap: spacing.lg },
    masterPane: {
      gap: spacing.lg,
      flex: 1,
      minHeight: 0,
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.md,
      paddingBottom: spacing.lg,
    },
    detailEmpty: {
      flex: 1,
      minHeight: 0,
      padding: spacing.xl,
      justifyContent: 'center',
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
    () => summaries.filter((summary) => summary.action_needed_count > 0).length,
    [summaries],
  );

  const unseenRolesCount = useMemo(
    () => summaries.filter((summary) => summary.unseen_count > 0).length,
    [summaries],
  );

  const isNeedsAttentionFilter = summaryFilter === 'needs_attention';

  const applicationFilterTabs = useMemo(
    () => [
      {
        value: 'all' as const,
        label: 'All roles',
        count: summaries.length,
        accent: 'tertiary' as const,
        icon: 'briefcase-outline' as const,
      },
      {
        value: 'needs_attention' as const,
        label: 'Needs attention',
        count: isNeedsAttentionFilter ? undefined : needsAttentionCount,
        badgeCount:
          isNeedsAttentionFilter || unseenRolesCount === 0 ? undefined : unseenRolesCount,
        accent: 'tertiary' as const,
        icon: 'alert-circle-outline' as const,
      },
    ],
    [isNeedsAttentionFilter, needsAttentionCount, summaries.length, unseenRolesCount],
  );

  const hasSearch = hasActiveListSearch(searchQuery);

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
    if (typeof params.jobId === 'string' && params.jobId.length > 0) {
      setSelectedJobId(params.jobId);
    }
  }, [params.jobId]);

  useEffect(() => {
    if (!useSplit) {
      setSelectedJobId(null);
      return;
    }
    // Keep a param-driven selection while summaries are still loading.
    if (filteredSummaries.length === 0) {
      return;
    }
    setSelectedJobId((current) => {
      if (current && filteredSummaries.some((row) => row.job_post_id === current)) {
        return current;
      }
      const fromParams = typeof params.jobId === 'string' ? params.jobId : null;
      if (fromParams && filteredSummaries.some((row) => row.job_post_id === fromParams)) {
        return fromParams;
      }
      return filteredSummaries[0]?.job_post_id ?? null;
    });
  }, [filteredSummaries, params.jobId, useSplit]);

  const detailEmptyState = useMemo(() => {
    if (hasSearch && filteredSummaries.length === 0) {
      return {
        icon: 'search-outline' as const,
        title: 'No roles match your search',
        message: 'Try a different search or filter.',
      };
    }
    if (isNeedsAttentionFilter && filteredSummaries.length === 0) {
      return {
        icon: 'alert-circle-outline' as const,
        title: 'No roles need attention',
        message: 'Roles with applicants awaiting your review will appear here.',
      };
    }
    return {
      icon: 'people-outline' as const,
      title: 'Select a role',
      message: 'Choose a role on the left to review applicants.',
    };
  }, [filteredSummaries.length, hasSearch, isNeedsAttentionFilter]);

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
        fill={useSplit}
        accent="tertiary"
        icon={
          hasSearch
            ? 'search-outline'
            : isNeedsAttentionFilter
              ? 'alert-circle-outline'
              : 'document-text-outline'
        }
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
              ? 'Roles with applicants awaiting your review will appear here.'
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
        onSelect={setSummaryFilter}
        fillHeight={useSplit}>
        {listBody}
      </FileTabWell>
    </>
  );

  const showScopeChip = isGroup && accessibleLocations.length > 1;

  return (
    <Screen
      title="Applications"
      subtitle="Review applicants and your interview schedule."
      refreshing={refreshing}
      onRefresh={onRefresh}
      scroll={!useSplit}
      fillsContainer={useSplit}
      constrainWidth={!useSplit}
      headerAccessory={showScopeChip ? <ClinicLocationScopeChip /> : undefined}
      contentContainerStyle={
        useSplit
          ? { paddingHorizontal: 0, paddingBottom: 0, flex: 1, minHeight: 0 }
          : undefined
      }>
      <View style={[styles.content, useSplit ? styles.splitContent : null]}>
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
            roundedPanes
            style={{ flex: 1, minHeight: 0 }}
            showDetail
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
                    embedded
                    fill
                    accent="tertiary"
                    icon={detailEmptyState.icon}
                    title={detailEmptyState.title}
                    message={detailEmptyState.message}
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
