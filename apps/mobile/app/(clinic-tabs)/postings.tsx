import { listJobPosts, getJobPostApplicationCountsMap, type JobPost } from '@chairside/api';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { CLINIC_FILL_INS, CLINIC_POST_JOB, getJobDetailRoute, getRoleHistoryRoute } from '@/lib/routing';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, Text, View } from 'react-native';

import { RolePostingFilters } from '@/components/clinic/PostingFilters';
import { RolePostingCard } from '@/components/clinic/RolePostingCard';
import { OnboardingButton } from '@/components/onboarding/OnboardingButton';
import { Screen } from '@/components/ui/Screen';
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

  const styles = useThemedStyles(({ colors, spacing, typography }) => ({
    wrap: {
      gap: spacing.lg,
    },
    list: {
      gap: spacing.sm,
    },
    loading: typography.subtitle,
    historyLink: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: colors.surface,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.separator,
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.md,
      gap: spacing.sm,
    },
    historyLinkPressed: {
      opacity: 0.92,
    },
    historyTitle: {
      ...typography.body,
      fontWeight: '600',
      fontSize: 15,
    },
    historyMeta: {
      ...typography.subtitle,
      fontSize: 13,
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

  return (
    <Screen title="Postings" subtitle="Open roles at your clinic.">
      <View style={styles.wrap}>
        <OnboardingButton
          label={postLabel}
          disabled={!isProfileComplete}
          onPress={() => router.push(postTarget)}
        />

        {isLoading ? (
          <Text style={styles.loading}>Loading postings…</Text>
        ) : (
          <>
            {mainListJobs.length > 0 ? (
              <RolePostingFilters
                statusFilter={jobStatusFilter}
                roleTypeFilter={jobRoleTypeFilter}
                onStatusChange={setJobStatusFilter}
                onRoleTypeChange={setJobRoleTypeFilter}
              />
            ) : null}

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
              <View style={styles.list}>
                {filteredJobs.map((job) => (
                  <RolePostingCard
                    key={job.id}
                    job={job}
                    applicantCount={applicantCounts[job.id] ?? 0}
                    onPress={() => router.push(getJobDetailRoute(job.id))}
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
              </View>
            )}

            {hasRoleHistory ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Role history"
                onPress={() => router.push(getRoleHistoryRoute())}
                style={({ pressed }) => [styles.historyLink, pressed && styles.historyLinkPressed]}
              >
                <View>
                  <Text style={styles.historyTitle}>Role history</Text>
                  <Text style={styles.historyMeta}>
                    {historyCounts.archived === 1
                      ? '1 archived'
                      : `${historyCounts.archived} archived`}
                    {' · '}
                    {historyCounts.filled === 1 ? '1 filled' : `${historyCounts.filled} filled`}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={colors.labelTertiary} />
              </Pressable>
            ) : null}
          </>
        )}
      </View>
    </Screen>
  );
}
