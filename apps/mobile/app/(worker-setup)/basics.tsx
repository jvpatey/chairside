import { ROLE_TYPE_OPTIONS, type RoleType } from '@chairside/config';
import { updateProfileDisplayName } from '@chairside/api';
import { router } from 'expo-router';
import { WORKER_HOME, WORKER_SETUP_EXPERIENCE } from '@/lib/routing';
import { useEffect, useState } from 'react';
import { Alert, Text, View } from 'react-native';

import { ChipSelector } from '@/components/clinic/ChipSelector';
import { AuthField } from '@/components/onboarding/AuthField';
import { AuthScreenHeader } from '@/components/onboarding/AuthScreenHeader';
import { OnboardingButton } from '@/components/onboarding/OnboardingButton';
import { OnboardingShell } from '@/components/onboarding/OnboardingShell';
import { useAuth } from '@/contexts/AuthContext';
import { useWorkerProfile } from '@/contexts/WorkerProfileContext';
import { useWorkerSetupSave } from '@/hooks/useWorkerSetupSave';
import { useThemedStyles } from '@/theme';

export default function WorkerBasicsScreen() {
  const { user, profile, refreshProfile } = useAuth();
  const { workerProfile, isWorkerProfileReady } = useWorkerProfile();
  const { save } = useWorkerSetupSave();
  const [displayName, setDisplayName] = useState('');
  const [roleType, setRoleType] = useState<RoleType | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const styles = useThemedStyles(({ spacing, typography }) => ({
    form: { gap: spacing.lg },
    footer: { gap: spacing.md, marginTop: spacing.lg },
    step: { marginBottom: spacing.sm },
    section: { gap: spacing.sm },
    label: { ...typography.body, fontWeight: '600' },
  }));

  useEffect(() => {
    setDisplayName(profile?.display_name ?? '');
  }, [profile?.display_name]);

  useEffect(() => {
    if (!workerProfile) return;
    setRoleType((workerProfile.role_type as RoleType) ?? null);
  }, [workerProfile]);

  const handleContinue = async () => {
    if (!displayName.trim()) {
      Alert.alert('Missing information', 'Enter your name to continue.');
      return;
    }
    if (!roleType) {
      Alert.alert('Missing information', 'Select the role you are qualified for.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (user?.id) {
        await updateProfileDisplayName(user.id, displayName.trim());
        await refreshProfile();
      }
      await save({ role_type: roleType });
      router.push(WORKER_SETUP_EXPERIENCE);
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
            label={isSubmitting ? 'Saving…' : 'Continue'}
            disabled={isSubmitting}
            onPress={handleContinue}
          />
        </View>
      }>
      <AuthScreenHeader
        title="Your basics"
        subtitle="Tell clinics who you are and what role you are qualified for."
        onBack={() => router.replace(WORKER_HOME)}
      />
      <Text style={styles.step}>Step 1 of 6</Text>
      <View style={styles.form}>
        <AuthField
          label="Full name"
          placeholder="Jane Smith"
          value={displayName}
          onChangeText={setDisplayName}
          autoCapitalize="words"
        />
        <View style={styles.section}>
          <Text style={styles.label}>Role</Text>
          <ChipSelector
            options={[...ROLE_TYPE_OPTIONS]}
            selected={roleType}
            onChange={(value) => setRoleType(value as RoleType)}
          />
        </View>
      </View>
    </OnboardingShell>
  );
}
