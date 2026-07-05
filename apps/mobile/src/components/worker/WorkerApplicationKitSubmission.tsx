import { submitRequestedApplicationKit } from '@chairside/api';
import * as Haptics from 'expo-haptics';
import { useState } from 'react';
import { Alert, Text, View } from 'react-native';

import { AuthField } from '@/components/onboarding/AuthField';
import { OnboardingButton } from '@/components/onboarding/OnboardingButton';
import { EditPillButton } from '@/components/ui/EditPillButton';
import { ApplicationKitPreview } from '@/components/worker/ApplicationKitPreview';
import { useAuth } from '@/contexts/AuthContext';
import { useWorkerProfile } from '@/contexts/WorkerProfileContext';
import { WORKER_SETUP_APPLICATION } from '@/lib/routing';
import { router } from 'expo-router';
import { useThemedStyles } from '@/theme';

type WorkerApplicationKitSubmissionProps = {
  applicationId: string;
  clinicName: string;
  postTitle: string;
  onSubmitted?: () => void;
};

export function WorkerApplicationKitSubmission({
  applicationId,
  clinicName,
  postTitle,
  onSubmitted,
}: WorkerApplicationKitSubmissionProps) {
  const { user, profile } = useAuth();
  const { workerProfile } = useWorkerProfile();
  const [coverMessage, setCoverMessage] = useState(workerProfile?.default_cover_message ?? '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const styles = useThemedStyles(({ colors, spacing, typography }) => ({
    card: {
      backgroundColor: colors.secondarySubtle,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.separator,
      padding: spacing.lg,
      gap: spacing.md,
    },
    eyebrow: {
      fontSize: 12,
      fontWeight: '700',
      letterSpacing: 0.4,
      textTransform: 'uppercase',
      color: colors.primary,
    },
    title: {
      ...typography.body,
      fontWeight: '700',
      fontSize: 17,
    },
    body: typography.subtitle,
    kitSection: {
      gap: spacing.sm,
    },
    kitLabel: {
      fontSize: 13,
      fontWeight: '600',
      letterSpacing: 0.4,
      textTransform: 'uppercase',
      color: colors.primary,
    },
  }));

  const handleSubmit = async () => {
    if (!user?.id) return;

    setIsSubmitting(true);
    try {
      await submitRequestedApplicationKit(user.id, applicationId, coverMessage);
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onSubmitted?.();
    } catch (error) {
      Alert.alert(
        'Submission failed',
        error instanceof Error ? error.message : 'Please try again.',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={styles.card}>
      <Text style={styles.eyebrow}>Application requested</Text>
      <Text style={styles.title}>{clinicName} wants your full application</Text>
      <Text style={styles.body}>
        {clinicName} reviewed your screening responses for {postTitle} and would like your full
        application to continue.
      </Text>

      <View style={styles.kitSection}>
        <Text style={styles.kitLabel}>Application profile</Text>
        {workerProfile ? (
          <ApplicationKitPreview
            profile={workerProfile}
            displayName={profile?.display_name}
            photoStoragePath={workerProfile.photo_storage_path}
            showDefaultNote
            embedded
          />
        ) : null}
        <EditPillButton
          label="Edit application profile"
          onPress={() => router.push(WORKER_SETUP_APPLICATION)}
        />
      </View>

      <AuthField
        label="Cover message (optional)"
        placeholder="Optional message"
        value={coverMessage}
        onChangeText={setCoverMessage}
        multiline
      />

      <OnboardingButton
        label={isSubmitting ? 'Submitting…' : 'Submit full application'}
        disabled={isSubmitting}
        onPress={() => void handleSubmit()}
      />
    </View>
  );
}
