import { ROLE_TYPE_OPTIONS, type RoleType } from '@chairside/config';
import { getWorkerRoleTypes, updateProfileDisplayName } from '@chairside/api';
import { router } from 'expo-router';
import { WORKER_HOME, WORKER_SETUP_EXPERIENCE } from '@/lib/routing';
import { useEffect, useState } from 'react';
import { Alert, Text, View } from 'react-native';

import { ChipSelector } from '@/components/clinic/ChipSelector';
import { AuthField } from '@/components/onboarding/AuthField';
import { AuthScreenHeader } from '@/components/onboarding/AuthScreenHeader';
import { OnboardingButton } from '@/components/onboarding/OnboardingButton';
import { OnboardingShell } from '@/components/onboarding/OnboardingShell';
import { SetupStepProgress } from '@/components/onboarding/SetupStepProgress';
import { useAuth } from '@/contexts/AuthContext';
import { useWorkerProfile } from '@/contexts/WorkerProfileContext';
import { useWorkerSetupSave } from '@/hooks/useWorkerSetupSave';
import { useSetupEditMode } from '@/hooks/useSetupEditMode';
import { useThemedStyles } from '@/theme';

export default function WorkerBasicsScreen() {
  const { user, profile, refreshProfile } = useAuth();
  const { workerProfile, isWorkerProfileReady } = useWorkerProfile();
  const { save } = useWorkerSetupSave();
  const { isEditMode, exitHref } = useSetupEditMode({ role: 'worker' });
  const [displayName, setDisplayName] = useState('');
  const [roleTypes, setRoleTypes] = useState<RoleType[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const styles = useThemedStyles(({ spacing, typography }) => ({
    form: { gap: spacing.lg },
    footer: { gap: spacing.md, marginTop: spacing.lg },
    section: { gap: spacing.sm },
    label: { ...typography.body, fontWeight: '600' },
  }));

  useEffect(() => {
    setDisplayName(profile?.display_name ?? '');
  }, [profile?.display_name]);

  useEffect(() => {
    if (!workerProfile) return;
    setRoleTypes(getWorkerRoleTypes(workerProfile));
  }, [workerProfile]);

  const handleContinue = async () => {
    if (!displayName.trim()) {
      Alert.alert('Missing information', 'Enter your name to continue.');
      return;
    }
    if (roleTypes.length === 0) {
      Alert.alert('Missing information', 'Select at least one role you are qualified for.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (user?.id) {
        await updateProfileDisplayName(user.id, displayName.trim());
        await refreshProfile();
      }
      await save({ role_types: roleTypes });
      if (isEditMode) {
        router.replace(exitHref);
      } else {
        router.push(WORKER_SETUP_EXPERIENCE);
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
    <OnboardingShell atmosphere="form"
      footer={
        <View style={styles.footer}>
          <OnboardingButton
            label={isSubmitting ? 'Saving…' : isEditMode ? 'Save changes' : 'Continue'}
            disabled={isSubmitting}
            onPress={handleContinue}
          />
        </View>
      }>
      <AuthScreenHeader
        title="Professional background · Basics"
        subtitle="Tell clinics who you are and which roles you are qualified for."
        onBack={() => (isEditMode ? router.replace(exitHref) : router.replace(WORKER_HOME))}
      />
      {!isEditMode ? <SetupStepProgress step={1} total={5} /> : null}
      <View style={styles.form}>
        <AuthField
          label="Full name"
          placeholder="Your full name"
          value={displayName}
          onChangeText={setDisplayName}
          autoCapitalize="words"
        />
        <View style={styles.section}>
          <Text style={styles.label}>Roles</Text>
          <ChipSelector
            options={[...ROLE_TYPE_OPTIONS]}
            selected={roleTypes}
            multiple
            onChange={(value) => setRoleTypes(value as RoleType[])}
          />
        </View>
      </View>
    </OnboardingShell>
  );
}
