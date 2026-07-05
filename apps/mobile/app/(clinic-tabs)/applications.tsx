import { listJobApplicationSummaries, type JobApplicationSummary } from '@chairside/api';
import { formatJobApplicationSummaryMeta } from '@chairside/config';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { View } from 'react-native';

import { ClinicApplicationSummaryFilters } from '@/components/clinic/ClinicApplicationSummaryFilters';
import { FadeInSection } from '@/components/dashboard/FadeInSection';
import { BrowseListRow } from '@/components/ui/BrowseListRow';
import { ApplicationCardBadge } from '@/components/ui/ApplicationCardBadge';
import { formatApplicantCountLabelWithNew } from '@/components/ui/CountBadge';
import { EmptyState } from '@/components/ui/EmptyState';
import { ListSearchFilterRow } from '@/components/ui/ListSearchFilterRow';
import { PageLoadingList } from '@/components/ui/PageLoadingState';
import { Screen } from '@/components/ui/Screen';
import { StaggeredList } from '@/components/ui/StaggeredList';
import { SurfaceCard } from '@/components/ui/SurfaceCard';
import { Ionicons } from '@expo/vector-icons';

import { useAuth } from '@/contexts/AuthContext';
import { useClinicProfile } from '@/contexts/ClinicProfileContext';
import { usePullToRefresh } from '@/hooks/usePullToRefresh';
import { useRefreshOnFocus } from '@/hooks/useRefreshOnFocus';
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

function RoleIconAvatar() {
  const { colors } = useTheme();
  const styles = useThemedStyles(({ radii }) => ({
    avatar: {
      width: 44,
      height: 44,
      borderRadius: radii.md,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.primarySubtle,
    },
  }));

  return (
    <View style={styles.avatar}>
      <Ionicons name="briefcase-outline" size={22} color={colors.primary} />
    </View>
  );
}

function RoleApplicationSummaryRow({
  summary,
  onViewPress,
}: {
  summary: JobApplicationSummary;
  onViewPress: () => void;
}) {
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
    <SurfaceCard padding="none" onPress={onViewPress}>
      <BrowseListRow
        avatar={<RoleIconAvatar />}
        title={summary.post_title}
        meta={metaLine || null}
        postedLabel={postedLabel || null}
        postedLabelPlacement="header"
        topTrailing={hasNewApplicants ? <ApplicationCardBadge /> : undefined}
        showChevron={Boolean(onViewPress)}
      />
    </SurfaceCard>
  );

  return hasNewApplicants ? <FadeInSection>{row}</FadeInSection> : row;
}

export default function ClinicApplicationsScreen() {
  const { user } = useAuth();
  const params = useLocalSearchParams<{ mode?: string; date?: string }>();
  const { isProfileComplete } = useClinicProfile();
  const [summaries, setSummaries] = useState<JobApplicationSummary[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [summaryFilter, setSummaryFilter] = useState<ClinicApplicationSummaryFilter>('all');
  const [isLoading, setIsLoading] = useState(true);

  const styles = useThemedStyles(({ spacing }) => ({
    content: { gap: spacing.lg },
    list: { gap: spacing.lg },
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

  const postRoleCta = isProfileComplete
    ? {
        ctaLabel: 'Post role' as const,
        onCtaPress: () => router.push(CLINIC_POST_JOB),
      }
    : {};

  return (
    <Screen
      title="Applications"
      subtitle="Review applicants and your interview schedule."
      refreshing={refreshing}
      onRefresh={onRefresh}>
      <View style={styles.content}>
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
          <>
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
                  hasSearch || hasActiveFilters
                    ? 'No roles match your search'
                    : 'No applications yet'
                }
                message={
                  hasSearch || hasActiveFilters
                    ? 'Try a different search or filter.'
                    : 'They will appear here when workers apply to your roles.'
                }
                {...(hasSearch || hasActiveFilters ? {} : postRoleCta)}
              />
            ) : (
              <View style={styles.list}>
                <StaggeredList>
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
                </StaggeredList>
              </View>
            )}
          </>
        )}
      </View>
    </Screen>
  );
}
