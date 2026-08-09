import { isWorkerProfileComplete } from '@chairside/api';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Text, View } from 'react-native';

import { ApplicationKitPreview } from '@/components/worker/ApplicationKitPreview';
import { AuthField } from '@/components/onboarding/AuthField';
import { OnboardingButton } from '@/components/onboarding/OnboardingButton';
import { SetupStepProgress } from '@/components/onboarding/SetupStepProgress';
import { FormScreen } from '@/components/ui/FormScreen';
import {
  ProfileDetailStack,
  SectionPanel,
  profileSettingsHintStyle,
} from '@/components/profile/ProfileDetailBlocks';
import { ProfilePhotoUpload } from '@/components/worker/ProfilePhotoUpload';
import { ResumeUpload } from '@/components/worker/ResumeUpload';
import { WORKER_SETUP_REVIEW } from '@/lib/routing';
import { useWorkerProfile } from '@/contexts/WorkerProfileContext';
import { useSetupEditMode, getSetupEditBackLabel } from '@/hooks/useSetupEditMode';
import { useSetupFormScreenProps } from '@/hooks/useSetupFormScreenProps';
import { useSetupStepProgress } from '@/hooks/useSetupStepProgress';
import { useWorkerSetupSave } from '@/hooks/useWorkerSetupSave';
import { useThemedStyles } from '@/theme';

export default function WorkerApplicationKitScreen() {
  const { workerProfile, isWorkerProfileReady, refreshWorkerProfile } = useWorkerProfile();
  const { save } = useWorkerSetupSave();
  const { isEditMode, exitHref, returnTo, applyPostType } = useSetupEditMode({ role: 'worker' });
  const setupFormProps = useSetupFormScreenProps('worker');
  const progress = useSetupStepProgress('application-kit', { role: 'worker' });
  const backLabel = getSetupEditBackLabel(returnTo, applyPostType);
  const [defaultCoverMessage, setDefaultCoverMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const styles = useThemedStyles(({ colors, spacing, typography }) => ({
    hint: profileSettingsHintStyle({ typography, colors }),
    previewIntro: { gap: spacing.md },
    footer: { gap: spacing.md, marginTop: spacing.lg },
    badge: {
      alignSelf: 'flex-start',
      borderRadius: 999,
      paddingHorizontal: spacing.sm + 2,
      paddingVertical: spacing.xs + 1,
      backgroundColor: colors.fillSubtle,
      borderWidth: 1,
      borderColor: colors.separator,
    },
    badgeText: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.labelSecondary,
    },
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
      backLabel={backLabel}
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
      <ProfileDetailStack>
        {!backgroundComplete ? (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>Finish your professional background first</Text>
          </View>
        ) : null}

        <SectionPanel icon="camera-outline" iconAccent="primary" title="Profile photo">
          <Text style={styles.hint}>
            Optional — included with role and fill-in applications.
          </Text>
          <ProfilePhotoUpload embedded onUpdated={() => void refreshWorkerProfile()} />
        </SectionPanel>

        <SectionPanel icon="document-outline" iconAccent="secondary" title="Resume">
          <Text style={styles.hint}>Optional PDF attached to role applications.</Text>
          <ResumeUpload embedded onUploaded={() => void refreshWorkerProfile()} />
        </SectionPanel>

        <SectionPanel icon="chatbubble-ellipses-outline" iconAccent="primary" title="Default cover note">
          <Text style={styles.hint}>
            A reusable note sent with applications. You can customize it each time you apply.
          </Text>
          <AuthField
            label="Cover note"
            placeholder="Optional message"
            value={defaultCoverMessage}
            onChangeText={setDefaultCoverMessage}
            multiline
            autoCapitalize="sentences"
            icon="chatbubble-ellipses-outline"
          />
        </SectionPanel>

        <SectionPanel icon="eye-outline" title="Clinic preview" collapsible defaultExpanded={false}>
          <View style={styles.previewIntro}>
            <Text style={styles.hint}>
              A live preview of the application profile clinics review when you apply.
            </Text>
            <ApplicationKitPreview profile={workerProfile} embedded />
          </View>
        </SectionPanel>
      </ProfileDetailStack>
    </FormScreen>
  );
}
