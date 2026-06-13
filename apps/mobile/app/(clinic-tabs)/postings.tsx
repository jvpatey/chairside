import { listJobPosts, getJobPostApplicationCountsMap, type JobPost } from '@chairside/api';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import {
  CLINIC_FILL_INS,
  CLINIC_POST_JOB,
  getClinicRoleApplicationsRoute,
  getJobDetailRoute,
  getRoleHistoryRoute,
} from '@/lib/routing';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Text, View } from 'react-native';

import { RolePostingFilters } from '@/components/clinic/PostingFilters';
import { RolePostingCard } from '@/components/clinic/RolePostingCard';
import { PostingCardActionButton } from '@/components/clinic/PostingCardActionButton';
import { OnboardingButton } from '@/components/onboarding/OnboardingButton';
import { PageLoadingList } from '@/components/ui/PageLoadingState';
import { Screen } from '@/components/ui/Screen';
import { BrowseListGroup } from '@/components/ui/BrowseListGroup';
import { BrowseListRow } from '@/components/ui/BrowseListRow';
import { useAuth } from '@/contexts/AuthContext';
import { useClinicProfile } from '@/contexts/ClinicProfileContext';
import { useRefreshOnFocus } from '@/hooks/useRefreshOnFocus';
import {
  countHistoryJobs,
  filterJobPostsForMainList,
  type JobStatusFilter,
  type RoleTypeFilter,
} from '@/lib/postingFilters';
import { useTheme, useThemedStyles } from '@/theme';

function PostingListEmptyState({
  icon,
  title,
  body,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  body: string;
}) {
  const { colors } = useTheme();
  const styles = useThemedStyles(({ colors, spacing, typography }) => ({
    card: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.separator,
      padding: spacing.xl,
      alignItems: 'center',
      gap: spacing.sm,
    },
    iconWrap: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: colors.fillSubtle,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: spacing.xs,
    },
    title: {
      ...typography.body,
      fontWeight: '600',
      textAlign: 'center',
    },
    body: {
      ...typography.subtitle,
      fontSize: 14,
      lineHeight: 20,
      textAlign: 'center',
    },
  }));

  return (
    <View style={styles.card}>
      <View style={styles.iconWrap}>
        <Ionicons name={icon} size={24} color={colors.labelSecondary} />
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.body}>{body}</Text>
    </View>
  );
}

export default function ClinicPostingsScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const { isProfileComplete } = useClinicProfile();
  const { tab } = useLocalSearchParams<{ tab?: string }>();
  const [jobs, setJobs] = useState<JobPost[]>([]);
  const [applicantCounts, setApplicantCounts] = useState<Record<string, number>>({});
  const [jobStatusFilter, setJobStatusFilter] = useState<JobStatusFilter>('all');
  const [jobRoleTypeFilter, setJobRoleTypeFilter] = useState<RoleTypeFilter>('all');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (tab === 'fill-ins') {
      router.replace(CLINIC_FILL_INS);
    }
  }, [tab]);

  const mainListJobs = useMemo(() => filterJobPostsForMainList(jobs, 'all', 'all'), [jobs]);

  const filteredJobs = useMemo(
    () => filterJobPostsForMainList(jobs, jobStatusFilter, jobRoleTypeFilter),
    [jobs, jobStatusFilter, jobRoleTypeFilter],
  );

  const historyCounts = useMemo(() => countHistoryJobs(jobs), [jobs]);
  const hasRoleHistory = historyCounts.archived > 0 || historyCounts.filled > 0;

  const styles = useThemedStyles(({ spacing }) => ({
    wrap: {
      gap: spacing.lg,
    },
  }));

  const load = useCallback(async () => {
    if (!user?.id) {
      setJobs([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const [jobPosts, counts] = await Promise.all([
        listJobPosts(user.id),
        getJobPostApplicationCountsMap(user.id),
      ]);
      setJobs(jobPosts);
      setApplicantCounts(counts);
    } catch (error) {
      setJobs([]);
      setApplicantCounts({});
      Alert.alert(
        'Could not load postings',
        error instanceof Error ? error.message : 'Please try again.',
      );
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  useRefreshOnFocus(load);

  const handleJobUpdated = useCallback((updated: JobPost) => {
    setJobs((prev) => prev.map((job) => (job.id === updated.id ? updated : job)));
  }, []);

  const handleJobDeleted = useCallback((jobId: string) => {
    setJobs((prev) => prev.filter((job) => job.id !== jobId));
    setApplicantCounts((prev) => {
      const next = { ...prev };
      delete next[jobId];
      return next;
    });
  }, []);

  const postTarget = CLINIC_POST_JOB;
  const postLabel = 'Post role';
  const showRoleFilters = !isLoading && mainListJobs.length > 0;

  return (
    <Screen
      title="Postings"
      subtitle="Open roles at your clinic."
      headerAccessory={
        showRoleFilters ? (
          <RolePostingFilters
            statusFilter={jobStatusFilter}
            roleTypeFilter={jobRoleTypeFilter}
            onStatusChange={setJobStatusFilter}
            onRoleTypeChange={setJobRoleTypeFilter}
          />
        ) : undefined
      }>
      <View style={styles.wrap}>
        <OnboardingButton
          label={postLabel}
          disabled={!isProfileComplete}
          onPress={() => router.push(postTarget)}
        />

        {isLoading ? (
          <PageLoadingList message="Loading postings…" />
        ) : (
          <>
            {jobs.length === 0 ? (
              <PostingListEmptyState
                icon="briefcase-outline"
                title="No roles yet"
                body="Post your first role to start receiving applications from candidates."
              />
            ) : mainListJobs.length === 0 ? (
              <PostingListEmptyState
                icon="briefcase-outline"
                title="No active roles"
                body="Paused and live roles appear here. View role history for archived and filled postings."
              />
            ) : filteredJobs.length === 0 ? (
              <PostingListEmptyState
                icon="filter-outline"
                title="No roles in this filter"
                body="Try a different filter or publish a new role."
              />
            ) : (
              <BrowseListGroup>
                {filteredJobs.map((job) => (
                  <RolePostingCard
                    key={job.id}
                    job={job}
                    layout="list"
                    applicantCount={applicantCounts[job.id] ?? 0}
                    onPress={() => router.push(getJobDetailRoute(job.id))}
                    onApplicantsPress={
                      (applicantCounts[job.id] ?? 0) > 0
                        ? () =>
                            router.push(
                              getClinicRoleApplicationsRoute(job.id, 'postings-tab'),
                            )
                        : undefined
                    }
                    manage={
                      user?.id
                        ? {
                            clinicId: user.id,
                            onUpdated: handleJobUpdated,
                            onDeleted: () => handleJobDeleted(job.id),
                          }
                        : undefined
                    }
                  />
                ))}
              </BrowseListGroup>
            )}

            {hasRoleHistory ? (
              <BrowseListGroup>
                <BrowseListRow
                  avatar={
                    <View
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 20,
                        backgroundColor: colors.fillSubtle,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}>
                      <Ionicons name="time-outline" size={20} color={colors.labelSecondary} />
                    </View>
                  }
                  title="Role history"
                  headerDetail={`${historyCounts.archived === 1 ? '1 archived' : `${historyCounts.archived} archived`} · ${historyCounts.filled === 1 ? '1 filled' : `${historyCounts.filled} filled`}`}
                  showChevron={false}
                  action={
                    <PostingCardActionButton
                      label="View role history"
                      variant="primary"
                      fullWidth
                      onPress={() => router.push(getRoleHistoryRoute())}
                    />
                  }
                />
              </BrowseListGroup>
            ) : null}
          </>
        )}
      </View>
    </Screen>
  );
}
