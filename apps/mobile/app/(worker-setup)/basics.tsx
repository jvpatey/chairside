import { ROLE_TYPE_OPTIONS, type RoleType } from '@chairside/config';
import {
  getWorkerRoleTypes,
  joinDisplayName,
  resolveAuthNameParts,
  updateProfileName,
} from '@chairside/api';
import { router } from 'expo-router';
import { ONBOARDING_CHANGE_ROLE, WORKER_SETUP_EXPERIENCE } from '@/lib/routing';
import { useEffect, useState } from 'react';
import { View } from 'react-native';

import { ChipSelector } from '@/components/clinic/ChipSelector';
import { AuthField } from '@/components/onboarding/AuthField';
import { SetupStepFooter } from '@/components/onboarding/SetupStepFooter';
import { SetupStepProgress } from '@/components/onboarding/SetupStepProgress';
import { FormSectionHeader } from '@/components/ui/FormSectionHeader';
import { FormScreen } from '@/components/ui/FormScreen';
import { ProfilePhotoUpload } from '@/components/worker/ProfilePhotoUpload';
import { useAuth } from '@/contexts/AuthContext';
import { useWorkerProfile } from '@/contexts/WorkerProfileContext';
import { useSetupFormScreenProps } from '@/hooks/useSetupFormScreenProps';
import { useSetupStepProgress } from '@/hooks/useSetupStepProgress';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';
import { useWorkerSetupSave } from '@/hooks/useWorkerSetupSave';
import { useWorkerSetupStepGuard } from '@/hooks/useSetupStepGuard';
import { useSetupEditMode } from '@/hooks/useSetupEditMode';
import { validateWorkerBasicsStep } from '@/lib/setupStepValidation';
import { useThemedStyles } from '@/theme';

export default function WorkerBasicsScreen() {
  const { user, profile, refreshProfile } = useAuth();
  const { workerProfile, isWorkerProfileReady, refreshWorkerProfile } = useWorkerProfile();
  const { save } = useWorkerSetupSave();
  const { isEditMode, exitHref } = useSetupEditMode({ role: 'worker' });
  const setupFormProps = useSetupFormScreenProps('worker');
  const progress = useSetupStepProgress('basics', { role: 'worker' });
  const { isWide } = useResponsiveLayout();
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

  const styles = useThemedStyles((theme) => ({
    form: { gap: theme.spacing.lg },
    section: { gap: theme.spacing.sm },
    photoSection: { gap: theme.spacing.sm },
    nameRow: {
      flexDirection: isWide ? ('row' as const) : ('column' as const),
      gap: theme.spacing.md,
    },
    nameField: isWide ? { flex: 1, minWidth: 0 } : {},
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
      subtitle="Add a photo, your name, and the roles you are qualified for."
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
      {progress.visible ? (
        <SetupStepProgress step={progress.step} total={progress.total} />
      ) : null}
      <View style={styles.form}>
        <View style={styles.photoSection}>
          <FormSectionHeader
            icon="camera-outline"
            label="Profile photo"
            hint="Optional — shown when you apply to clinics."
          />
          <ProfilePhotoUpload
            embedded
            displayName={joinDisplayName(firstName, lastName)}
            onUpdated={() => void refreshWorkerProfile()}
          />
        </View>
        <View style={styles.nameRow}>
          <View style={styles.nameField}>
            <AuthField
              label="First name"
              placeholder="First name"
              value={firstName}
              onChangeText={setFirstName}
              autoCapitalize="words"
              icon="person-outline"
              required
              invalid={showValidation && !firstName.trim()}
            />
          </View>
          <View style={styles.nameField}>
            <AuthField
              label="Last name"
              placeholder="Last name"
              value={lastName}
              onChangeText={setLastName}
              autoCapitalize="words"
              icon="person-outline"
              required
              invalid={showValidation && !lastName.trim()}
            />
          </View>
        </View>
        <View style={styles.section}>
          <FormSectionHeader icon="briefcase-outline" label="Roles" required />
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
