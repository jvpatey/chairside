import {
  getJobPostApplicationCountsMap,
  listClinicApplications,
  listJobPosts,
  type ClinicApplication,
  type JobPost,
} from '@chairside/api';
import { router } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Alert, Text, View } from 'react-native';

import { RoleTypeFilters } from '@/components/clinic/PostingFilters';
import { RolePostingCard } from '@/components/clinic/RolePostingCard';
import { dashboardSectionGap } from '@/components/dashboard/dashboardLayout';
import { FormScreen } from '@/components/ui/FormScreen';
import { EmptyState } from '@/components/ui/EmptyState';
import { PageLoadingList } from '@/components/ui/PageLoadingState';
import { StaggeredList } from '@/components/ui/StaggeredList';
import { useAuth } from '@/contexts/AuthContext';
import { useRefreshOnFocus } from '@/hooks/useRefreshOnFocus';
import {
  filterArchivedJobPosts,
  filterFilledJobPosts,
  isArchivedJob,
  isFilledJob,
  type RoleTypeFilter,
} from '@/lib/postingFilters';
import { getClinicRoleApplicationsRoute, getClinicApplicationRoute, getJobDetailRoute } from '@/lib/routing';
import { summarizeJobApplicantPreviews } from '@/lib/dashboardAttention';
import { useThemedStyles } from '@/theme';

function HistorySection({
  title,
  helper,
  jobs,
  applicantCounts,
  applicantPreviewByJobId,
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
  applicantPreviewByJobId: ReturnType<typeof summarizeJobApplicantPreviews>;
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
    emptyWrap: {
      width: '100%',
    },
    cardList: {
      gap: dashboardSectionGap(spacing),
    },
  }));

  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        {helper ? <Text style={styles.helper}>{helper}</Text> : null}
      </View>
      {jobs.length === 0 ? (
        <View style={styles.emptyWrap}>
          <EmptyState icon="archive-outline" title={emptyTitle} message={emptyBody} />
        </View>
      ) : (
        <View style={styles.cardList}>
          <StaggeredList>
            {jobs.map((job) => (
              <RolePostingCard
                key={job.id}
                job={job}
                applicantCount={applicantCounts[job.id] ?? 0}
                applicants={applicantPreviewByJobId[job.id]}
                onPress={() => router.push(getJobDetailRoute(job.id))}
                onApplicantsPress={() =>
                  router.push(getClinicRoleApplicationsRoute(job.id, 'role-history'))
                }
                onApplicantPress={(applicationId) =>
                  router.push(getClinicApplicationRoute(applicationId, 'role-history', job.id))
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
          </StaggeredList>
        </View>
      )}
    </View>
  );
}

export default function RoleHistoryScreen() {
  const { user } = useAuth();
  const [jobs, setJobs] = useState<JobPost[]>([]);
  const [applications, setApplications] = useState<ClinicApplication[]>([]);
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

  const applicantPreviewByJobId = useMemo(
    () =>
      summarizeJobApplicantPreviews(
        applications.map((application) => ({
          id: application.id,
          job_post_id: application.job_post_id,
          worker_display_name: application.worker_display_name,
          worker_photo_storage_path: application.worker_photo_storage_path,
        })),
      ),
    [applications],
  );

  const load = useCallback(async () => {
    if (!user?.id) {
      setJobs([]);
      setApplications([]);
      setApplicantCounts({});
      setApplications([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const [jobPosts, counts, applicationRows] = await Promise.all([
        listJobPosts(user.id),
        getJobPostApplicationCountsMap(user.id),
        listClinicApplications(user.id, 'active'),
      ]);
      setJobs(jobPosts);
      setApplicantCounts(counts);
      setApplications(applicationRows);
    } catch (error) {
      setJobs([]);
      setApplicantCounts({});
      setApplications([]);
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
    <FormScreen
      title="Role history"
      subtitle="Archived and filled roles"
      onBack={() => router.back()}
      headerAccessory={
        showRoleFilter ? (
          <RoleTypeFilters
            roleTypeFilter={roleTypeFilter}
            onRoleTypeChange={setRoleTypeFilter}
            accessibilityLabel="Filter role history"
            sheetTitle="Filter role history"
          />
        ) : undefined
      }>
      <View style={styles.content}>
        {isLoading ? (
          <PageLoadingList message="Loading role history…" />
        ) : (
          <>
            <HistorySection
              title="Archived"
              helper="Roles you archived. Post again when the same position opens up."
              jobs={archivedJobs}
              applicantCounts={applicantCounts}
              applicantPreviewByJobId={applicantPreviewByJobId}
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
              applicantPreviewByJobId={applicantPreviewByJobId}
              emptyTitle="No filled roles"
              emptyBody="When you mark a role as filled, it will appear here for your records."
              clinicId={user?.id}
              onJobUpdated={handleJobUpdated}
              onJobDeleted={handleJobDeleted}
            />
          </>
        )}
      </View>
    </FormScreen>
  );
}
