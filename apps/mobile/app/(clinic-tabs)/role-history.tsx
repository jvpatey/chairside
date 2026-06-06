import {
  getJobPostApplicationCountsMap,
  listJobPosts,
  type JobPost,
} from '@chairside/api';
import { router } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Alert, ScrollView, Text, View } from 'react-native';

import { RoleTypeFilters } from '@/components/clinic/PostingFilters';
import { RolePostingCard } from '@/components/clinic/RolePostingCard';
import { AuthScreenHeader } from '@/components/onboarding/AuthScreenHeader';
import { OnboardingShell } from '@/components/onboarding/OnboardingShell';
import { BrowseListGroup } from '@/components/ui/BrowseListGroup';
import { useAuth } from '@/contexts/AuthContext';
import { useRefreshOnFocus } from '@/hooks/useRefreshOnFocus';
import {
  filterArchivedJobPosts,
  filterFilledJobPosts,
  isArchivedJob,
  isFilledJob,
  type RoleTypeFilter,
} from '@/lib/postingFilters';
import { getClinicRoleApplicationsRoute, getJobDetailRoute } from '@/lib/routing';
import { useThemedStyles } from '@/theme';

function HistorySection({
  title,
  helper,
  jobs,
  applicantCounts,
  emptyTitle,
  emptyBody,
  clinicId,
  onJobUpdated,
  onJobDeleted,
}: {
  title: string;
  helper?: string;
  jobs: JobPost[];
  applicantCounts: Record<string, number>;
  emptyTitle: string;
  emptyBody: string;
  clinicId?: string;
  onJobUpdated?: (job: JobPost) => void;
  onJobDeleted?: (jobId: string) => void;
}) {
  const styles = useThemedStyles(({ colors, spacing, typography }) => ({
    section: {
      gap: spacing.sm,
    },
    header: {
      gap: spacing.xs,
    },
    title: {
      ...typography.body,
      fontSize: 13,
      fontWeight: '600',
      letterSpacing: 0.4,
      textTransform: 'uppercase',
      color: typography.subtitle.color,
    },
    helper: {
      ...typography.subtitle,
      fontSize: 14,
      lineHeight: 20,
    },
    empty: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.separator,
      padding: spacing.lg,
      gap: spacing.xs,
    },
    emptyTitle: {
      ...typography.body,
      fontWeight: '600',
      textAlign: 'center',
    },
    emptyBody: {
      ...typography.subtitle,
      fontSize: 14,
      lineHeight: 20,
      textAlign: 'center',
    },
  }));

  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        {helper ? <Text style={styles.helper}>{helper}</Text> : null}
      </View>
      {jobs.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>{emptyTitle}</Text>
          <Text style={styles.emptyBody}>{emptyBody}</Text>
        </View>
      ) : (
        <BrowseListGroup>
          {jobs.map((job) => (
            <RolePostingCard
              key={job.id}
              job={job}
              layout="list"
              applicantCount={applicantCounts[job.id] ?? 0}
              onPress={() => router.push(getJobDetailRoute(job.id))}
              onApplicantsPress={
                (applicantCounts[job.id] ?? 0) > 0
                  ? () => router.push(getClinicRoleApplicationsRoute(job.id, 'applications-tab'))
                  : undefined
              }
              manage={
                clinicId && onJobUpdated && onJobDeleted
                  ? {
                      clinicId,
                      onUpdated: onJobUpdated,
                      onDeleted: () => onJobDeleted(job.id),
                    }
                  : undefined
              }
            />
          ))}
        </BrowseListGroup>
      )}
    </View>
  );
}

export default function RoleHistoryScreen() {
  const { user } = useAuth();
  const [jobs, setJobs] = useState<JobPost[]>([]);
  const [applicantCounts, setApplicantCounts] = useState<Record<string, number>>({});
  const [roleTypeFilter, setRoleTypeFilter] = useState<RoleTypeFilter>('all');
  const [isLoading, setIsLoading] = useState(true);

  const archivedJobs = useMemo(
    () => filterArchivedJobPosts(jobs, roleTypeFilter),
    [jobs, roleTypeFilter],
  );

  const filledJobs = useMemo(
    () => filterFilledJobPosts(jobs, roleTypeFilter),
    [jobs, roleTypeFilter],
  );

  const hasHistory = useMemo(
    () => jobs.some((job) => isArchivedJob(job) || isFilledJob(job)),
    [jobs],
  );

  const showRoleFilter = !isLoading && hasHistory;

  const styles = useThemedStyles(({ spacing, typography }) => ({
    content: {
      gap: spacing.lg,
      paddingBottom: spacing.xl,
    },
    loading: typography.subtitle,
  }));

  const load = useCallback(async () => {
    if (!user?.id) {
      setJobs([]);
      setApplicantCounts({});
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
        'Could not load role history',
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

  return (
    <OnboardingShell>
      <ScrollView contentContainerStyle={styles.content}>
        <AuthScreenHeader
          title="Role history"
          subtitle="Archived and filled roles"
          onBack={() => router.back()}
          accessory={
            showRoleFilter ? (
              <RoleTypeFilters
                roleTypeFilter={roleTypeFilter}
                onRoleTypeChange={setRoleTypeFilter}
                accessibilityLabel="Filter role history"
                sheetTitle="Filter role history"
              />
            ) : undefined
          }
        />

        {isLoading ? (
          <Text style={styles.loading}>Loading role history…</Text>
        ) : (
          <>
            <HistorySection
              title="Archived"
              helper="Roles you archived. Post again when the same position opens up."
              jobs={archivedJobs}
              applicantCounts={applicantCounts}
              emptyTitle="No archived roles"
              emptyBody="Archived roles appear here when you remove them from your active list."
              clinicId={user?.id}
              onJobUpdated={handleJobUpdated}
              onJobDeleted={handleJobDeleted}
            />

            <HistorySection
              title="Filled"
              helper="Roles you marked as filled. Delete when you no longer need the record."
              jobs={filledJobs}
              applicantCounts={applicantCounts}
              emptyTitle="No filled roles"
              emptyBody="When you mark a role as filled, it will appear here for your records."
              clinicId={user?.id}
              onJobUpdated={handleJobUpdated}
              onJobDeleted={handleJobDeleted}
            />
          </>
        )}
      </ScrollView>
    </OnboardingShell>
  );
}
