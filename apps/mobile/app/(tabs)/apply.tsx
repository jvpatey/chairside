import {
  createApplication,
  getLiveJobPost,
  getLiveShiftPost,
  type LiveJobPost,
  type LiveShiftPost,
} from '@chairside/api';
import type { JobMatchBreakdown, JobMatchContext } from '@chairside/core';
import { formatJobPostCardMeta } from '@chairside/config';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Alert, Platform, Pressable, Text, View } from 'react-native';

import { AuthField } from '@/components/onboarding/AuthField';
import { AuthScreenHeader } from '@/components/onboarding/AuthScreenHeader';
import { OnboardingButton } from '@/components/onboarding/OnboardingButton';
import { OnboardingShell } from '@/components/onboarding/OnboardingShell';
import { MatchTierBadge } from '@/components/matching/MatchTierBadge';
import { ApplicationPackageFields } from '@/components/worker/ApplicationPackageFields';
import { ClinicPostHeader } from '@/components/worker/ClinicPostHeader';
import { FormErrorBanner } from '@/components/ui/FormErrorBanner';
import { useAuth } from '@/contexts/AuthContext';
import { useWorkerProfile } from '@/contexts/WorkerProfileContext';
import { useWorkerPhotoUri } from '@/hooks/useWorkerPhotoUri';
import { showConfirmActionSheet } from '@/lib/confirmActionSheet';
import { WORKER_APPLICATIONS, WORKER_FILLINS, WORKER_SETUP_APPLICATION, WORKER_SETUP_BASICS, getApplyScreeningRoute } from '@/lib/routing';
import { formatShiftPostMeta, formatShiftPostRoleTitle } from '@/lib/shiftPostDisplay';
import {
  buildLiveJobMatchDisplayContext,
  computeJobMatchBreakdown,
} from '@/lib/workerMatch';
import { useThemedStyles, useTheme } from '@/theme';

export default function ApplyScreen() {
  const { user, profile } = useAuth();
  const { colors } = useTheme();
  const { workerProfile, isProfileComplete } = useWorkerProfile();
  const { postType, postId } = useLocalSearchParams<{ postType?: string; postId?: string }>();
  const type = postType === 'shift' ? 'shift' : 'job';
  const id = typeof postId === 'string' ? postId : '';
  const [coverMessage, setCoverMessage] = useState('');
  const [job, setJob] = useState<LiveJobPost | null>(null);
  const [shift, setShift] = useState<LiveShiftPost | null>(null);
  const [jobMatch, setJobMatch] = useState<JobMatchBreakdown | null>(null);
  const [matchContext, setMatchContext] = useState<Partial<JobMatchContext> | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [screeningEnabled, setScreeningEnabled] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const styles = useThemedStyles(({ colors, spacing, typography }) => ({
    content: { gap: spacing.lg },
    card: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.separator,
      padding: spacing.md,
    },
    wage: {
      fontSize: 15,
      fontWeight: '600',
      color: colors.primary,
    },
    compensation: {
      fontSize: 15,
      fontWeight: '600',
      color: colors.primary,
    },
    footer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: spacing.sm,
    },
    credentialsTitle: {
      fontSize: 13,
      fontWeight: '600',
      letterSpacing: 0.4,
      textTransform: 'uppercase',
      color: colors.primary,
    },
    hint: { ...typography.subtitle, fontSize: 13 },
    editLink: { color: colors.primary, fontWeight: '600' },
    screeningNote: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: spacing.md,
      backgroundColor: colors.surface,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.separator,
      padding: spacing.md,
    },
    screeningIconWrap: {
      width: 36,
      height: 36,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.primarySubtle,
    },
    screeningContent: {
      flex: 1,
      gap: spacing.xs,
    },
    screeningEyebrow: {
      fontSize: 12,
      fontWeight: '700',
      letterSpacing: 0.4,
      textTransform: 'uppercase',
      color: colors.primary,
    },
    screeningText: typography.subtitle,
  }));

  const loadPost = useCallback(async () => {
    if (!id) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      if (type === 'job') {
        const loadedJob = await getLiveJobPost(id);
        if (!loadedJob) throw new Error('Role not found');
        setJob(loadedJob);
        setShift(null);
        setScreeningEnabled(loadedJob.screening_enabled && loadedJob.screening_questions.length > 0);
        if (workerProfile) {
          setJobMatch(computeJobMatchBreakdown(workerProfile, loadedJob));
          setMatchContext(buildLiveJobMatchDisplayContext(workerProfile, loadedJob));
        } else {
          setJobMatch(null);
          setMatchContext(null);
        }
      } else {
        const loadedShift = await getLiveShiftPost(id);
        if (!loadedShift) throw new Error('Shift not found');
        setShift(loadedShift);
        setJob(null);
        setJobMatch(null);
        setMatchContext(null);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Please try again.';
      setFormError(message);
      if (Platform.OS !== 'web') {
        Alert.alert('Could not load posting', message);
      }
      router.back();
    } finally {
      setIsLoading(false);
    }
  }, [id, type, workerProfile]);

  useEffect(() => {
    setCoverMessage(workerProfile?.default_cover_message ?? '');
  }, [workerProfile?.default_cover_message]);

  useEffect(() => {
    if (!isProfileComplete) {
      showConfirmActionSheet({
        title: 'Complete your profile',
        message: 'Finish setup before applying.',
        cancelLabel: 'Cancel',
        confirmLabel: 'Continue setup',
        onConfirm: () => router.replace(WORKER_SETUP_BASICS),
      });
      return;
    }
    void loadPost();
  }, [isProfileComplete, loadPost]);

  const photoUri = useWorkerPhotoUri(workerProfile?.photo_storage_path);

  const handleContinue = () => {
    if (type === 'job' && screeningEnabled) {
      router.push(getApplyScreeningRoute(id));
      return;
    }
    void handleSubmit();
  };

  const handleSubmit = async () => {
    if (!user?.id || !id) return;

    setIsSubmitting(true);
    try {
      await createApplication(user.id, {
        jobPostId: type === 'job' ? id : undefined,
        shiftPostId: type === 'shift' ? id : undefined,
        coverMessage: coverMessage.trim() || undefined,
      });
      router.replace(type === 'shift' ? WORKER_FILLINS : WORKER_APPLICATIONS);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Please try again.';
      setFormError(message);
      if (Platform.OS !== 'web') {
        Alert.alert(type === 'shift' ? 'Request failed' : 'Application failed', message);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <OnboardingShell>
        <AuthScreenHeader
          title={type === 'shift' ? 'Request to cover' : 'Apply'}
          subtitle="Loading…"
          onBack={() => router.back()}
        />
      </OnboardingShell>
    );
  }

  return (
    <OnboardingShell
      footer={
        <OnboardingButton
          label={
            isSubmitting
              ? 'Submitting…'
              : type === 'shift'
                ? 'Submit request'
                : screeningEnabled
                  ? 'Continue to screening'
                  : 'Submit application'
          }
          disabled={isSubmitting}
          onPress={handleContinue}
        />
      }>
      <AuthScreenHeader
        title={type === 'job' ? 'Apply for role' : 'Request to cover'}
        subtitle={
          type === 'shift'
            ? 'Review what the clinic will receive with your cover request.'
            : screeningEnabled
              ? undefined
              : 'Review what the clinic will receive.'
        }
        onBack={() => router.back()}
      />
      <View style={styles.content}>
        <FormErrorBanner message={formError} />
        {type === 'job' && job ? (
          <View style={styles.card}>
            <ClinicPostHeader
              clinicName={job.clinic.clinic_name}
              logoStoragePath={job.clinic.logo_storage_path}
              title={job.title}
              location={[job.clinic.city, job.clinic.province].filter(Boolean).join(', ') || null}
              detail={formatJobPostCardMeta(job)}
              avatarSize={44}
              accessory={
                jobMatch && matchContext ? (
                  <MatchTierBadge
                    breakdown={jobMatch}
                    context={matchContext}
                    subtitle={job.title}
                    showProfileHint
                  />
                ) : null
              }
              footer={
                job.wage_range ? (
                  <View style={styles.footer}>
                    <Text style={styles.wage}>{job.wage_range}</Text>
                  </View>
                ) : null
              }
            />
          </View>
        ) : null}

        {type === 'shift' && shift ? (
          <View style={styles.card}>
            <ClinicPostHeader
              clinicName={shift.clinic.clinic_name}
              logoStoragePath={shift.clinic.logo_storage_path}
              title={formatShiftPostRoleTitle(shift.role_type)}
              location={[shift.clinic.city, shift.clinic.province].filter(Boolean).join(', ') || null}
              detail={formatShiftPostMeta(shift)}
              avatarSize={44}
              footer={
                shift.compensation ? (
                  <View style={styles.footer}>
                    <Text style={styles.compensation}>{shift.compensation}</Text>
                  </View>
                ) : null
              }
            />
          </View>
        ) : null}

        {type === 'job' && screeningEnabled ? (
          <View style={styles.screeningNote}>
            <View style={styles.screeningIconWrap}>
              <Ionicons name="clipboard-outline" size={20} color={colors.primary} />
            </View>
            <View style={styles.screeningContent}>
              <Text style={styles.screeningEyebrow}>Screening questions</Text>
              <Text style={styles.screeningText}>
                This clinic uses screening questions before reviewing full applications. You will only
                submit your application kit if the clinic requests it.
              </Text>
            </View>
          </View>
        ) : (
          <>
            <View style={styles.card}>
              <Text style={styles.credentialsTitle}>
                {type === 'shift' ? 'Cover request details' : 'Application credentials'}
              </Text>
              <Text style={styles.hint}>
                {type === 'shift'
                  ? 'This is what the clinic will receive with your cover request.'
                  : 'This is what the clinic will receive with your application.'}
              </Text>
              {workerProfile ? (
                <ApplicationPackageFields
                  profile={workerProfile}
                  displayName={profile?.display_name}
                  photoUri={photoUri}
                  showDefaultNote
                />
              ) : null}
              <Pressable onPress={() => router.push(WORKER_SETUP_APPLICATION)}>
                <Text style={styles.editLink}>Edit application kit</Text>
              </Pressable>
            </View>

            <AuthField
              label="Cover message (optional)"
              placeholder="Optional message"
              value={coverMessage}
              onChangeText={setCoverMessage}
              multiline
            />
          </>
        )}
      </View>
    </OnboardingShell>
  );
}
