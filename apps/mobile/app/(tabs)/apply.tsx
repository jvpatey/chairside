import {
  createApplication,
  getLiveJobPost,
  getLiveShiftPost,
} from '@chairside/api';
import { getRoleTypeLabel, formatWorkerEducation, getSpecialtyLabel, travelRadiusRangeToMaxKm } from '@chairside/config';
import { calculateMatchScore } from '@chairside/core';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Alert, Pressable, Text, View } from 'react-native';

import { AuthField } from '@/components/onboarding/AuthField';
import { AuthScreenHeader } from '@/components/onboarding/AuthScreenHeader';
import { OnboardingButton } from '@/components/onboarding/OnboardingButton';
import { OnboardingShell } from '@/components/onboarding/OnboardingShell';
import { useAuth } from '@/contexts/AuthContext';
import { useWorkerProfile } from '@/contexts/WorkerProfileContext';
import { WORKER_APPLICATIONS, WORKER_SETUP_APPLICATION, WORKER_SETUP_BASICS } from '@/lib/routing';
import { computeListingMatchScore } from '@/lib/workerMatch';
import { useThemedStyles } from '@/theme';

export default function ApplyScreen() {
  const { user } = useAuth();
  const { workerProfile, isProfileComplete } = useWorkerProfile();
  const { postType, postId } = useLocalSearchParams<{ postType?: string; postId?: string }>();
  const type = postType === 'shift' ? 'shift' : 'job';
  const id = typeof postId === 'string' ? postId : '';
  const [coverMessage, setCoverMessage] = useState('');
  const [postTitle, setPostTitle] = useState('');
  const [clinicName, setClinicName] = useState('');
  const [matchScore, setMatchScore] = useState<number | null>(null);
  const [breakdown, setBreakdown] = useState<ReturnType<typeof calculateMatchScore> | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const styles = useThemedStyles(({ colors, spacing, typography }) => ({
    content: { gap: spacing.lg },
    card: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.separator,
      padding: spacing.lg,
      gap: spacing.sm,
    },
    cardTitle: { ...typography.body, fontWeight: '600' },
    cardMeta: typography.subtitle,
    credentialsTitle: {
      fontSize: 13,
      fontWeight: '600',
      letterSpacing: 0.4,
      textTransform: 'uppercase',
      color: colors.primary,
    },
    hint: { ...typography.subtitle, fontSize: 13 },
    match: { fontSize: 15, fontWeight: '600', color: colors.primary },
    editLink: { color: colors.primary, fontWeight: '600' },
  }));

  const workerTravelRadiusKm =
    travelRadiusRangeToMaxKm(workerProfile?.travel_radius_range) ??
    workerProfile?.travel_radius_km ??
    null;

  const loadPost = useCallback(async () => {
    if (!id) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      if (type === 'job') {
        const job = await getLiveJobPost(id);
        if (!job) throw new Error('Role not found');
        setPostTitle(job.title);
        setClinicName(job.clinic.clinic_name);
        setMatchScore(computeListingMatchScore(workerProfile, job));
        setBreakdown(
          calculateMatchScore({
            postRoleType: job.role_type,
            postSoftware: job.software_used,
            workerRoleType: workerProfile?.role_type,
            workerSoftware: workerProfile?.software_used,
            workerTravelRadiusKm,
            distanceKm: null,
          }),
        );
      } else {
        const shift = await getLiveShiftPost(id);
        if (!shift) throw new Error('Shift not found');
        setPostTitle(`Fill-in · ${shift.shift_date}`);
        setClinicName(shift.clinic.clinic_name);
        setMatchScore(computeListingMatchScore(workerProfile, shift));
        setBreakdown(
          calculateMatchScore({
            postRoleType: shift.role_type,
            workerRoleType: workerProfile?.role_type,
            workerSoftware: workerProfile?.software_used,
            workerTravelRadiusKm,
            distanceKm: null,
          }),
        );
      }
    } catch (error) {
      Alert.alert(
        'Could not load posting',
        error instanceof Error ? error.message : 'Please try again.',
      );
      router.back();
    } finally {
      setIsLoading(false);
    }
  }, [id, type, workerProfile, workerTravelRadiusKm]);

  useEffect(() => {
    setCoverMessage(workerProfile?.default_cover_message ?? '');
  }, [workerProfile?.default_cover_message]);

  useEffect(() => {
    if (!isProfileComplete) {
      Alert.alert('Complete your profile', 'Finish setup before applying.', [
        { text: 'OK', onPress: () => router.replace(WORKER_SETUP_BASICS) },
      ]);
      return;
    }
    void loadPost();
  }, [isProfileComplete, loadPost]);

  const handleSubmit = async () => {
    if (!user?.id || !id) return;

    setIsSubmitting(true);
    try {
      await createApplication(user.id, {
        jobPostId: type === 'job' ? id : undefined,
        shiftPostId: type === 'shift' ? id : undefined,
        coverMessage: coverMessage.trim() || undefined,
      });
      router.replace(WORKER_APPLICATIONS);
    } catch (error) {
      Alert.alert(
        'Application failed',
        error instanceof Error ? error.message : 'Please try again.',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <OnboardingShell>
        <AuthScreenHeader title="Apply" subtitle="Loading…" onBack={() => router.back()} />
      </OnboardingShell>
    );
  }

  const cityLine = [workerProfile?.city, workerProfile?.province].filter(Boolean).join(', ');

  return (
    <OnboardingShell
      footer={
        <OnboardingButton
          label={isSubmitting ? 'Submitting…' : 'Submit application'}
          disabled={isSubmitting}
          onPress={handleSubmit}
        />
      }>
      <AuthScreenHeader
        title={type === 'job' ? 'Apply for role' : 'Apply for shift'}
        subtitle="Review what the clinic will receive."
        onBack={() => router.back()}
      />
      <View style={styles.content}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{postTitle}</Text>
          <Text style={styles.cardMeta}>{clinicName}</Text>
          {matchScore != null ? <Text style={styles.match}>{matchScore}% match</Text> : null}
          {breakdown ? (
            <Text style={styles.cardMeta}>
              Role: {breakdown.roleFit} · Software: {breakdown.software} · Location:{' '}
              {breakdown.location}
            </Text>
          ) : null}
        </View>

        <View style={styles.card}>
          <Text style={styles.credentialsTitle}>Application credentials</Text>
          <Text style={styles.hint}>This is what the clinic will receive with your application.</Text>
          <Text style={styles.cardMeta}>
            {workerProfile?.role_type ? getRoleTypeLabel(workerProfile.role_type) : ''}
          </Text>
          <Text style={styles.cardMeta}>
            {workerProfile?.years_of_experience != null
              ? `${workerProfile.years_of_experience} years experience`
              : ''}
          </Text>
          <Text style={styles.cardMeta}>
            {workerProfile ? formatWorkerEducation(workerProfile) : ''}
          </Text>
          {workerProfile?.software_used && workerProfile.software_used.length > 0 ? (
            <Text style={styles.cardMeta}>Software: {workerProfile.software_used.join(', ')}</Text>
          ) : null}
          {workerProfile?.practice_types && workerProfile.practice_types.length > 0 ? (
            <Text style={styles.cardMeta}>
              Specialties: {workerProfile.practice_types.map(getSpecialtyLabel).join(', ')}
            </Text>
          ) : null}
          {cityLine ? <Text style={styles.cardMeta}>{cityLine}</Text> : null}
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
      </View>
    </OnboardingShell>
  );
}
