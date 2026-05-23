import { listJobPosts, listShiftPosts, type JobPost, type JobPostStatus, type ShiftPost } from '@chairside/api';
import { ROLE_TYPE_OPTIONS, SPECIALTY_OPTIONS } from '@chairside/config';
import { router } from 'expo-router';
import { CLINIC_POST_JOB, CLINIC_POST_SHIFT, getJobDetailRoute } from '@/lib/routing';
import { useCallback, useMemo, useState } from 'react';
import { Alert, Pressable, Text, View } from 'react-native';

import { ChipSelector } from '@/components/clinic/ChipSelector';
import { JobPostStatusBadge } from '@/components/clinic/JobPostStatusBadge';
import { OnboardingButton } from '@/components/onboarding/OnboardingButton';
import { BulletList } from '@/components/clinic/BulletList';
import { Screen } from '@/components/ui/Screen';
import { useAuth } from '@/contexts/AuthContext';
import { useClinicProfile } from '@/contexts/ClinicProfileContext';
import { useRefreshOnFocus } from '@/hooks/useRefreshOnFocus';
import { useThemedStyles } from '@/theme';

type JobFilter = 'active' | 'paused' | 'archived' | 'all';

const JOB_FILTER_OPTIONS: { value: JobFilter; label: string }[] = [
  { value: 'active', label: 'Active' },
  { value: 'paused', label: 'Paused' },
  { value: 'archived', label: 'Archived' },
  { value: 'all', label: 'All' },
];

function filterJobs(jobs: JobPost[], filter: JobFilter): JobPost[] {
  switch (filter) {
    case 'active':
      return jobs.filter((job) => job.status === 'live');
    case 'paused':
      return jobs.filter((job) => job.status === 'paused');
    case 'archived':
      return jobs.filter((job) => job.status === 'filled' || job.status === 'closed');
    case 'all':
      return jobs;
  }
}

function PostingCard({
  title,
  subtitle,
  details,
  offerings,
  jobStatus,
  statusLabel,
  onPress,
}: {
  title: string;
  subtitle: string;
  details?: string;
  offerings?: string[];
  jobStatus?: JobPostStatus;
  statusLabel?: string;
  onPress?: () => void;
}) {
  const styles = useThemedStyles(({ colors, spacing, typography }) => ({
    card: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.separator,
      padding: spacing.lg,
      gap: spacing.sm,
    },
    cardPressed: {
      opacity: 0.9,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      gap: spacing.sm,
    },
    headerMain: {
      flex: 1,
      gap: spacing.xs,
    },
    title: {
      ...typography.body,
      fontWeight: '600',
    },
    subtitle: typography.subtitle,
    badge: {
      alignSelf: 'flex-start',
      backgroundColor: colors.secondarySubtle,
      borderRadius: 999,
      paddingHorizontal: spacing.sm,
      paddingVertical: 4,
      marginTop: spacing.xs,
    },
    badgeText: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.labelSecondary,
      textTransform: 'capitalize',
    },
  }));

  const content = (
    <>
      <View style={styles.header}>
        <View style={styles.headerMain}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>{subtitle}</Text>
        </View>
        {jobStatus ? <JobPostStatusBadge status={jobStatus} /> : null}
      </View>
      {details ? <Text style={styles.subtitle}>{details}</Text> : null}
      <BulletList items={offerings ?? []} label="Perks & offerings" />
      {!jobStatus && statusLabel ? (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{statusLabel}</Text>
        </View>
      ) : null}
    </>
  );

  if (!onPress) {
    return <View style={styles.card}>{content}</View>;
  }

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}>
      {content}
    </Pressable>
  );
}

function formatJobDetails(job: JobPost): string | undefined {
  const specialtyLabel =
    SPECIALTY_OPTIONS.find((option) => option.value === job.specialty)?.label ?? null;
  const softwareLabel = job.software_used.length ? job.software_used.join(' · ') : null;
  const details = [specialtyLabel, softwareLabel].filter(Boolean).join(' · ');
  return details || undefined;
}

export default function ClinicPostingsScreen() {
  const { user } = useAuth();
  const { isProfileComplete } = useClinicProfile();
  const [jobs, setJobs] = useState<JobPost[]>([]);
  const [shifts, setShifts] = useState<ShiftPost[]>([]);
  const [jobFilter, setJobFilter] = useState<JobFilter>('active');
  const [isLoading, setIsLoading] = useState(true);

  const filteredJobs = useMemo(() => filterJobs(jobs, jobFilter), [jobs, jobFilter]);

  const styles = useThemedStyles(({ spacing, typography }) => ({
    section: { gap: spacing.md, marginBottom: spacing.lg },
    heading: {
      ...typography.body,
      fontWeight: '600',
    },
    empty: typography.subtitle,
    loading: typography.subtitle,
    actions: { flexDirection: 'row', gap: spacing.sm },
    action: { flex: 1 },
    filters: {
      marginBottom: spacing.sm,
    },
  }));

  const load = useCallback(async () => {
    if (!user?.id) {
      setJobs([]);
      setShifts([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const [jobPosts, shiftPosts] = await Promise.all([
        listJobPosts(user.id),
        listShiftPosts(user.id),
      ]);
      setJobs(jobPosts);
      setShifts(shiftPosts);
    } catch (error) {
      setJobs([]);
      setShifts([]);
      Alert.alert(
        'Could not load postings',
        error instanceof Error ? error.message : 'Please try again.',
      );
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  useRefreshOnFocus(load);

  const hasPosts = jobs.length > 0 || shifts.length > 0;

  return (
    <Screen title="Postings" subtitle="Your open roles and fill-in shifts.">
      <View style={styles.actions}>
        <OnboardingButton
          style={styles.action}
          label="Post role"
          disabled={!isProfileComplete}
          onPress={() => router.push(CLINIC_POST_JOB)}
        />
        <OnboardingButton
          style={styles.action}
          label="Post fill-in"
          variant="secondary"
          disabled={!isProfileComplete}
          onPress={() => router.push(CLINIC_POST_SHIFT)}
        />
      </View>

      {!isLoading && !hasPosts ? (
        <Text style={styles.empty}>No postings yet. Create your first role or fill-in shift.</Text>
      ) : isLoading && !hasPosts ? (
        <Text style={styles.loading}>Loading postings…</Text>
      ) : (
        <>
          <View style={styles.section}>
            <Text style={styles.heading}>Roles</Text>
            {jobs.length > 0 ? (
              <View style={styles.filters}>
                <ChipSelector
                  options={JOB_FILTER_OPTIONS}
                  selected={jobFilter}
                  onChange={(value) => setJobFilter(value as JobFilter)}
                />
              </View>
            ) : null}
            {jobs.length === 0 ? (
              <Text style={styles.empty}>No job posts yet.</Text>
            ) : filteredJobs.length === 0 ? (
              <Text style={styles.empty}>No roles in this filter.</Text>
            ) : (
              filteredJobs.map((job) => {
                const roleLabel =
                  ROLE_TYPE_OPTIONS.find((option) => option.value === job.role_type)?.label ??
                  job.role_type;

                return (
                  <PostingCard
                    key={job.id}
                    title={job.title}
                    subtitle={`${roleLabel} · ${job.employment_type}`}
                    details={formatJobDetails(job)}
                    offerings={job.offerings ?? []}
                    jobStatus={job.status}
                    onPress={() => router.push(getJobDetailRoute(job.id))}
                  />
                );
              })
            )}
          </View>
          <View style={styles.section}>
            <Text style={styles.heading}>Fill-ins</Text>
            {shifts.length === 0 ? (
              <Text style={styles.empty}>No fill-in shifts yet.</Text>
            ) : (
              shifts.map((shift) => (
                <PostingCard
                  key={shift.id}
                  title={`${shift.role_type} · ${shift.shift_date}`}
                  subtitle={`${shift.start_time} – ${shift.end_time}`}
                  statusLabel={shift.status}
                />
              ))
            )}
          </View>
        </>
      )}
    </Screen>
  );
}
