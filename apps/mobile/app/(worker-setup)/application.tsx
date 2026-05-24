import { isApplicationPackageReady } from '@chairside/api';
import { router } from 'expo-router';
import { WORKER_PROFILE } from '@/lib/routing';
import { useEffect, useState } from 'react';
import { Alert, Text, View } from 'react-native';

import { ApplicationKitPreview } from '@/components/worker/ApplicationKitPreview';
import { AuthField } from '@/components/onboarding/AuthField';
import { AuthScreenHeader } from '@/components/onboarding/AuthScreenHeader';
import { OnboardingButton } from '@/components/onboarding/OnboardingButton';
import { OnboardingShell } from '@/components/onboarding/OnboardingShell';
import { ResumeUpload } from '@/components/worker/ResumeUpload';
import { useWorkerProfile } from '@/contexts/WorkerProfileContext';
import { useWorkerSetupSave } from '@/hooks/useWorkerSetupSave';
import { useThemedStyles } from '@/theme';

export default function WorkerApplicationKitScreen() {
  const { workerProfile, isWorkerProfileReady, refreshWorkerProfile } = useWorkerProfile();
  const { save } = useWorkerSetupSave();
  const [defaultCoverMessage, setDefaultCoverMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const styles = useThemedStyles(({ colors, spacing }) => ({
    form: { gap: spacing.lg },
    footer: { gap: spacing.md, marginTop: spacing.lg },
    badge: {
      alignSelf: 'flex-start',
      borderRadius: 999,
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
      backgroundColor: colors.fillSubtle,
    },
    badgeReady: { backgroundColor: colors.primarySubtle },
    badgeText: { fontSize: 12, fontWeight: '600', color: colors.labelSecondary },
    badgeTextReady: { color: colors.primary },
  }));

  useEffect(() => {
    setDefaultCoverMessage(workerProfile?.default_cover_message ?? '');
  }, [workerProfile?.default_cover_message]);

  const ready = isApplicationPackageReady(workerProfile);

  const handleSave = async () => {
    setIsSubmitting(true);
    try {
      await save({ default_cover_message: defaultCoverMessage.trim() || null });
      await refreshWorkerProfile();
      router.replace(WORKER_PROFILE);
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
    <OnboardingShell
      footer={
        <View style={styles.footer}>
          <OnboardingButton
            label={isSubmitting ? 'Saving…' : 'Save changes'}
            disabled={isSubmitting}
            onPress={handleSave}
          />
        </View>
      }>
      <AuthScreenHeader
        title="Application kit · Resume & note"
        subtitle="What clinics receive when you apply to a role. Resume is optional."
        onBack={() => router.back()}
      />
      <View style={styles.form}>
        <View style={[styles.badge, ready && styles.badgeReady]}>
          <Text style={[styles.badgeText, ready && styles.badgeTextReady]}>
            {ready ? 'Ready to quick apply' : 'Complete your background to quick apply'}
          </Text>
        </View>

        <ResumeUpload onUploaded={() => void refreshWorkerProfile()} />

        <AuthField
          label="Default cover note (optional)"
          placeholder="Optional message"
          value={defaultCoverMessage}
          onChangeText={setDefaultCoverMessage}
          multiline
          autoCapitalize="sentences"
        />

        <ApplicationKitPreview profile={workerProfile} />
      </View>
    </OnboardingShell>
  );
}
