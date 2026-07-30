import { ROLE_TYPE_OPTIONS, type RoleType } from '@chairside/config';
import { getWorkerRoleTypes, resolveAuthDisplayName, updateProfileDisplayName } from '@chairside/api';
import { router } from 'expo-router';
import { ONBOARDING_CHANGE_ROLE, WORKER_SETUP_EXPERIENCE } from '@/lib/routing';
import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';

import { ChipSelector } from '@/components/clinic/ChipSelector';
import { AuthField } from '@/components/onboarding/AuthField';
import { AuthScreenHeader } from '@/components/onboarding/AuthScreenHeader';
import { OnboardingShell } from '@/components/onboarding/OnboardingShell';
import { SetupStepFooter } from '@/components/onboarding/SetupStepFooter';
import { SetupStepProgress } from '@/components/onboarding/SetupStepProgress';
import { useAuth } from '@/contexts/AuthContext';
import { useWorkerProfile } from '@/contexts/WorkerProfileContext';
import { useWorkerSetupSave } from '@/hooks/useWorkerSetupSave';
import { useWorkerSetupStepGuard } from '@/hooks/useSetupStepGuard';
import { useSetupEditMode } from '@/hooks/useSetupEditMode';
import { validateWorkerBasicsStep } from '@/lib/setupStepValidation';
import { useThemedStyles } from '@/theme';

export default function WorkerBasicsScreen() {
  const { user, profile, refreshProfile } = useAuth();
  const { workerProfile, isWorkerProfileReady } = useWorkerProfile();
  const { save } = useWorkerSetupSave();
  const { isEditMode, exitHref } = useSetupEditMode({ role: 'worker' });
  const [displayName, setDisplayName] = useState('');
  const [roleTypes, setRoleTypes] = useState<RoleType[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [showValidation, setShowValidation] = useState(false);

  const seededDisplayName = resolveAuthDisplayName(
    profile?.display_name,
    user?.user_metadata as Record<string, unknown> | undefined,
  );

  useWorkerSetupStepGuard(
    'basics',
    workerProfile,
    seededDisplayName || profile?.display_name,
    isWorkerProfileReady,
    isEditMode,
  );

  const validation = validateWorkerBasicsStep({ displayName, roleTypes });

  const styles = useThemedStyles(({ spacing, typography }) => ({
    form: { gap: spacing.lg },
    section: { gap: spacing.sm },
    label: { ...typography.body, fontWeight: '600' },
  }));

  useEffect(() => {
    setDisplayName(seededDisplayName);
  }, [seededDisplayName]);

  useEffect(() => {
    if (!workerProfile) return;
    setRoleTypes(getWorkerRoleTypes(workerProfile));
  }, [workerProfile]);

  const handleContinue = async () => {
    if (!validation.ok) {
      setShowValidation(true);
      return;
    }

    setSubmitError(null);
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
      setSubmitError(error instanceof Error ? error.message : 'Could not save. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isWorkerProfileReady) return null;

  return (
    <OnboardingShell
      atmosphere="form"
      footer={
        <SetupStepFooter
          canContinue={validation.ok}
          validationMessage={validation.message}
          showValidation={showValidation}
          submitError={submitError}
          isSubmitting={isSubmitting}
          continueLabel={isEditMode ? 'Save changes' : 'Continue'}
          onContinue={handleContinue}
        />
      }>
      <AuthScreenHeader
        title="Professional background · Basics"
        subtitle="Tell clinics who you are and which roles you are qualified for."
        backLabel={isEditMode ? undefined : 'Back'}
        onBack={() =>
          isEditMode ? router.replace(exitHref) : router.replace(ONBOARDING_CHANGE_ROLE)
        }
      />
      {!isEditMode ? <SetupStepProgress step={1} total={5} /> : null}
      <View style={styles.form}>
        <AuthField
          label="Full name"
          placeholder="Your full name"
          value={displayName}
          onChangeText={setDisplayName}
          autoCapitalize="words"
          invalid={showValidation && !validation.ok && !displayName.trim()}
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
