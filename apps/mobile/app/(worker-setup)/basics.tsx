import { ROLE_TYPE_OPTIONS, type RoleType } from '@chairside/config';
import {
  getWorkerRoleTypes,
  resolveAuthNameParts,
  updateProfileName,
} from '@chairside/api';
import { router } from 'expo-router';
import { ONBOARDING_CHANGE_ROLE, WORKER_SETUP_EXPERIENCE } from '@/lib/routing';
import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';

import { ChipSelector } from '@/components/clinic/ChipSelector';
import { AuthField } from '@/components/onboarding/AuthField';
import { SetupStepFooter } from '@/components/onboarding/SetupStepFooter';
import { SetupStepProgress } from '@/components/onboarding/SetupStepProgress';
import { FormScreen } from '@/components/ui/FormScreen';
import { useAuth } from '@/contexts/AuthContext';
import { useWorkerProfile } from '@/contexts/WorkerProfileContext';
import { useSetupFormScreenProps } from '@/hooks/useSetupFormScreenProps';
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
  const setupFormProps = useSetupFormScreenProps('worker');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [roleTypes, setRoleTypes] = useState<RoleType[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [showValidation, setShowValidation] = useState(false);

  const seededName = resolveAuthNameParts({
    firstName: profile?.first_name,
    lastName: profile?.last_name,
    displayName: profile?.display_name,
    userMetadata: user?.user_metadata as Record<string, unknown> | undefined,
  });

  useWorkerSetupStepGuard(
    'basics',
    workerProfile,
    seededName.firstName,
    seededName.lastName,
    isWorkerProfileReady,
    isEditMode,
  );

  const validation = validateWorkerBasicsStep({ firstName, lastName, roleTypes });

  const styles = useThemedStyles(({ spacing, typography }) => ({
    form: { gap: spacing.lg },
    section: { gap: spacing.sm },
    nameRow: { gap: spacing.md },
    label: { ...typography.body, fontWeight: '600' },
  }));

  useEffect(() => {
    setFirstName(seededName.firstName);
    setLastName(seededName.lastName);
  }, [seededName.firstName, seededName.lastName]);

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
        await updateProfileName(user.id, {
          firstName: firstName.trim(),
          lastName: lastName.trim(),
        });
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
    <FormScreen
      {...setupFormProps}
      title="Professional background · Basics"
      subtitle="Tell clinics who you are and which roles you are qualified for."
      backLabel={isEditMode ? undefined : 'Back'}
      onBack={() =>
        isEditMode ? router.replace(exitHref) : router.replace(ONBOARDING_CHANGE_ROLE)
      }
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
      {!isEditMode ? <SetupStepProgress step={1} total={5} /> : null}
      <View style={styles.form}>
        <View style={styles.nameRow}>
          <AuthField
            label="First name"
            placeholder="First name"
            value={firstName}
            onChangeText={setFirstName}
            autoCapitalize="words"
            invalid={showValidation && !firstName.trim()}
          />
          <AuthField
            label="Last name"
            placeholder="Last name"
            value={lastName}
            onChangeText={setLastName}
            autoCapitalize="words"
            invalid={showValidation && !lastName.trim()}
          />
        </View>
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
    </FormScreen>
  );
}
