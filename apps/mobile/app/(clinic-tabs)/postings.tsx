import { listJobPosts, listShiftPosts, type JobPost, type ShiftPost } from '@chairside/api';
import { ROLE_TYPE_OPTIONS, SPECIALTY_OPTIONS } from '@chairside/config';
import { router } from 'expo-router';
import { CLINIC_POST_JOB, CLINIC_POST_SHIFT } from '@/lib/routing';
import { useCallback, useState } from 'react';
import { Alert, Text, View } from 'react-native';

import { OnboardingButton } from '@/components/onboarding/OnboardingButton';
import { BulletList } from '@/components/clinic/BulletList';
import { Screen } from '@/components/ui/Screen';
import { useAuth } from '@/contexts/AuthContext';
import { useClinicProfile } from '@/contexts/ClinicProfileContext';
import { useRefreshOnFocus } from '@/hooks/useRefreshOnFocus';
import { useThemedStyles } from '@/theme';

function PostingCard({
  title,
  subtitle,
  details,
  offerings,
  status,
}: {
  title: string;
  subtitle: string;
  details?: string;
  offerings?: string[];
  status: string;
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

  return (
    <View style={styles.card}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
      {details ? <Text style={styles.subtitle}>{details}</Text> : null}
      <BulletList items={offerings ?? []} label="Perks & offerings" />
      <View style={styles.badge}>
        <Text style={styles.badgeText}>{status}</Text>
      </View>
    </View>
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
  const [isLoading, setIsLoading] = useState(true);

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
            {jobs.length === 0 ? (
              <Text style={styles.empty}>No job posts yet.</Text>
            ) : (
              jobs.map((job) => {
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
                    status={job.status}
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
                  status={shift.status}
                />
              ))
            )}
          </View>
        </>
      )}
    </Screen>
  );
}
