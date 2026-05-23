import { listJobPosts, listShiftPosts, type JobPost, type ShiftPost } from '@chairside/api';
import { formatDisplayLabel, formatJobPostCardMeta, formatOfferingLabel, getRoleTypeLabel } from '@chairside/config';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { CLINIC_POST_JOB, CLINIC_POST_SHIFT, getJobDetailRoute } from '@/lib/routing';
import { useCallback, useMemo, useState } from 'react';
import { Alert, Pressable, Text, View } from 'react-native';

import { ChipSelector } from '@/components/clinic/ChipSelector';
import { JobPostStatusBadge } from '@/components/clinic/JobPostStatusBadge';
import { PostingsTabBar, type PostingsTab } from '@/components/clinic/PostingsTabBar';
import { OnboardingButton } from '@/components/onboarding/OnboardingButton';
import { Screen } from '@/components/ui/Screen';
import { useAuth } from '@/contexts/AuthContext';
import { useClinicProfile } from '@/contexts/ClinicProfileContext';
import { useRefreshOnFocus } from '@/hooks/useRefreshOnFocus';
import { useTheme, useThemedStyles } from '@/theme';

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

function formatJobMeta(job: JobPost): string {
  return formatJobPostCardMeta(job);
}

function formatShiftMeta(shift: ShiftPost): string {
  const roleLabel = getRoleTypeLabel(shift.role_type);
  return `${roleLabel} · ${shift.start_time} – ${shift.end_time}`;
}

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

function RolePostingCard({ job, onPress }: { job: JobPost; onPress: () => void }) {
  const previewOfferings = job.offerings.slice(0, 2);
  const extraOfferings = job.offerings.length - previewOfferings.length;

  const styles = useThemedStyles(({ colors, spacing, typography }) => ({
    card: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.separator,
      padding: spacing.md,
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
      fontSize: 16,
    },
    meta: {
      fontSize: 14,
      lineHeight: 20,
      color: colors.labelSecondary,
    },
    wage: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.primary,
    },
    offerings: {
      fontSize: 13,
      lineHeight: 18,
      color: colors.labelSecondary,
    },
  }));

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}>
      <View style={styles.header}>
        <View style={styles.headerMain}>
          <Text style={styles.title}>{job.title}</Text>
          <Text style={styles.meta}>{formatJobMeta(job)}</Text>
        </View>
        <JobPostStatusBadge status={job.status} />
      </View>
      {job.wage_range ? <Text style={styles.wage}>{job.wage_range}</Text> : null}
      {previewOfferings.length > 0 ? (
        <Text style={styles.offerings} numberOfLines={2}>
          {previewOfferings.map((item) => `• ${formatOfferingLabel(item)}`).join('  ')}
          {extraOfferings > 0 ? `  +${extraOfferings} more` : ''}
        </Text>
      ) : null}
    </Pressable>
  );
}

function FillInPostingCard({ shift }: { shift: ShiftPost }) {
  const styles = useThemedStyles(({ colors, spacing, typography }) => ({
    card: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.separator,
      padding: spacing.md,
      gap: spacing.sm,
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
      fontSize: 16,
    },
    meta: typography.subtitle,
    status: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.labelSecondary,
      backgroundColor: colors.fillSubtle,
      borderRadius: 999,
      paddingHorizontal: spacing.sm,
      paddingVertical: 4,
    },
    compensation: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.primary,
    },
  }));

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.headerMain}>
          <Text style={styles.title}>{shift.shift_date}</Text>
          <Text style={styles.meta}>{formatShiftMeta(shift)}</Text>
        </View>
        <Text style={styles.status}>{formatDisplayLabel(shift.status)}</Text>
      </View>
      {shift.compensation ? <Text style={styles.compensation}>{shift.compensation}</Text> : null}
    </View>
  );
}

export default function ClinicPostingsScreen() {
  const { user } = useAuth();
  const { isProfileComplete } = useClinicProfile();
  const [jobs, setJobs] = useState<JobPost[]>([]);
  const [shifts, setShifts] = useState<ShiftPost[]>([]);
  const [selectedTab, setSelectedTab] = useState<PostingsTab>('roles');
  const [jobFilter, setJobFilter] = useState<JobFilter>('active');
  const [isLoading, setIsLoading] = useState(true);

  const filteredJobs = useMemo(() => filterJobs(jobs, jobFilter), [jobs, jobFilter]);

  const styles = useThemedStyles(({ spacing, typography }) => ({
    wrap: {
      gap: spacing.lg,
    },
    list: {
      gap: spacing.sm,
    },
    empty: typography.subtitle,
    loading: typography.subtitle,
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

  const postTarget = selectedTab === 'roles' ? CLINIC_POST_JOB : CLINIC_POST_SHIFT;
  const postLabel = selectedTab === 'roles' ? 'Post role' : 'Post fill-in';

  return (
    <Screen title="Postings">
      <View style={styles.wrap}>
        <PostingsTabBar
          selected={selectedTab}
          roleCount={jobs.length}
          fillInCount={shifts.length}
          onChange={setSelectedTab}
        />

        <OnboardingButton
          label={postLabel}
          disabled={!isProfileComplete}
          onPress={() => router.push(postTarget)}
        />

        {isLoading ? (
          <Text style={styles.loading}>Loading postings…</Text>
        ) : selectedTab === 'roles' ? (
          <>
            {jobs.length > 0 ? (
              <ChipSelector
                options={JOB_FILTER_OPTIONS}
                selected={jobFilter}
                onChange={(value) => setJobFilter(value as JobFilter)}
              />
            ) : null}

            {jobs.length === 0 ? (
              <PostingListEmptyState
                icon="briefcase-outline"
                title="No roles yet"
                body="Post your first role to start receiving applications from candidates."
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
                    onPress={() => router.push(getJobDetailRoute(job.id))}
                  />
                ))}
              </View>
            )}
          </>
        ) : shifts.length === 0 ? (
          <PostingListEmptyState
            icon="calendar-outline"
            title="No fill-ins yet"
            body="Post a fill-in shift when you need temporary or urgent coverage."
          />
        ) : (
          <View style={styles.list}>
            {shifts.map((shift) => (
              <FillInPostingCard key={shift.id} shift={shift} />
            ))}
          </View>
        )}
      </View>
    </Screen>
  );
}
