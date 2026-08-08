import { isWorkerProfileComplete } from '@chairside/api';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Text, View } from 'react-native';

import { ApplicationKitPreview } from '@/components/worker/ApplicationKitPreview';
import { AuthField } from '@/components/onboarding/AuthField';
import { OnboardingButton } from '@/components/onboarding/OnboardingButton';
import { SetupStepProgress } from '@/components/onboarding/SetupStepProgress';
import { FormSectionHeader } from '@/components/ui/FormSectionHeader';
import { FormScreen } from '@/components/ui/FormScreen';
import { ProfilePhotoUpload } from '@/components/worker/ProfilePhotoUpload';
import { ResumeUpload } from '@/components/worker/ResumeUpload';
import { WORKER_SETUP_REVIEW } from '@/lib/routing';
import { useWorkerProfile } from '@/contexts/WorkerProfileContext';
import { useSetupEditMode } from '@/hooks/useSetupEditMode';
import { useSetupFormScreenProps } from '@/hooks/useSetupFormScreenProps';
import { useSetupStepProgress } from '@/hooks/useSetupStepProgress';
import { useWorkerSetupSave } from '@/hooks/useWorkerSetupSave';
import { useThemedStyles } from '@/theme';

export default function WorkerApplicationKitScreen() {
  const { workerProfile, isWorkerProfileReady, refreshWorkerProfile } = useWorkerProfile();
  const { save } = useWorkerSetupSave();
  const { isEditMode, exitHref } = useSetupEditMode({ role: 'worker' });
  const setupFormProps = useSetupFormScreenProps('worker');
  const progress = useSetupStepProgress('application-kit', { role: 'worker' });
  const [defaultCoverMessage, setDefaultCoverMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const styles = useThemedStyles(({ colors, spacing }) => ({
    form: { gap: spacing.lg },
    uploadSection: { gap: spacing.sm },
    footer: { gap: spacing.md, marginTop: spacing.lg },
    badge: {
      alignSelf: 'flex-start',
      borderRadius: 999,
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
      backgroundColor: colors.fillSubtle,
    },
    badgeText: { fontSize: 12, fontWeight: '600', color: colors.labelSecondary },
  }));

  useEffect(() => {
    setDefaultCoverMessage(workerProfile?.default_cover_message ?? '');
  }, [workerProfile?.default_cover_message]);

  const backgroundComplete = isWorkerProfileComplete(workerProfile);

  const handleSave = async () => {
    setIsSubmitting(true);
    try {
      await save({ default_cover_message: defaultCoverMessage.trim() || null });
      await refreshWorkerProfile();
      if (isEditMode) {
        router.replace(exitHref);
      } else {
        router.push(WORKER_SETUP_REVIEW);
      }
    } catch (error) {
      Alert.alert(
        'Could not save',
        error instanceof Error ? error.message : 'Please try again.',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isWorkerProfileReady) return null;

  return (
    <FormScreen
      {...setupFormProps}
      title="Application profile · Photo, resume & note"
      subtitle="What clinics receive when you apply. Photo and resume are optional."
      onBack={() => (isEditMode ? router.replace(exitHref) : router.back())}
      footer={
        <View style={styles.footer}>
          <OnboardingButton
            label={isSubmitting ? 'Saving…' : isEditMode ? 'Save changes' : 'Continue'}
            disabled={isSubmitting}
            solid
            onPress={handleSave}
          />
        </View>
      }>
      {progress.visible ? (
        <SetupStepProgress step={progress.step} total={progress.total} />
      ) : null}
      <View style={styles.form}>
        {!backgroundComplete ? (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>Finish your background first</Text>
          </View>
        ) : null}

        <View style={styles.uploadSection}>
          <FormSectionHeader
            icon="camera-outline"
            label="Profile photo"
            hint="Optional — included with role and fill-in applications."
          />
          <ProfilePhotoUpload embedded onUpdated={() => void refreshWorkerProfile()} />
        </View>
        <View style={styles.uploadSection}>
          <FormSectionHeader
            icon="document-text-outline"
            label="Resume"
            hint="Optional PDF attached to role applications."
          />
          <ResumeUpload embedded onUploaded={() => void refreshWorkerProfile()} />
        </View>

        <AuthField
          label="Default cover note"
          placeholder="Optional message"
          value={defaultCoverMessage}
          onChangeText={setDefaultCoverMessage}
          multiline
          autoCapitalize="sentences"
          icon="chatbubble-ellipses-outline"
        />

        <ApplicationKitPreview profile={workerProfile} />
      </View>
    </FormScreen>
  );
}
