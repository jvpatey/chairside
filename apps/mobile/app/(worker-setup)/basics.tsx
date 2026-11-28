import { normalizePhoneForStorage, ROLE_TYPE_OPTIONS, type RoleType } from '@chairside/config';
import {
  authUserHasVerifiedPhone,
  getAuthErrorMessage,
  getWorkerRoleTypes,
  joinDisplayName,
  requestAuthPhoneBind,
  resolveAuthNameParts,
  updateProfileName,
  verifyAuthPhoneBind,
} from '@chairside/api';
import { router } from 'expo-router';
import { ONBOARDING_CHANGE_ROLE, WORKER_SETUP_LOCATION } from '@/lib/routing';
import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';

import { ChipSelector } from '@/components/clinic/ChipSelector';
import { AuthField } from '@/components/onboarding/AuthField';
import { SetupStepFooter } from '@/components/onboarding/SetupStepFooter';
import { SetupStepProgress } from '@/components/onboarding/SetupStepProgress';
import { FormScreen } from '@/components/ui/FormScreen';
import {
  ProfileDetailStack,
  SectionPanel,
  profileSettingsHintStyle,
} from '@/components/profile/ProfileDetailBlocks';
import { ProfilePhotoUpload } from '@/components/worker/ProfilePhotoUpload';
import { useAuth } from '@/contexts/AuthContext';
import { useWorkerProfile } from '@/contexts/WorkerProfileContext';
import { useSetupFormScreenProps } from '@/hooks/useSetupFormScreenProps';
import { useSetupStepProgress } from '@/hooks/useSetupStepProgress';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';
import { useWorkerSetupSave } from '@/hooks/useWorkerSetupSave';
import { useWorkerSetupStepGuard } from '@/hooks/useSetupStepGuard';
import { useSetupEditMode } from '@/hooks/useSetupEditMode';
import { formatPhoneNumber, PHONE_NUMBER_PLACEHOLDER } from '@/lib/phone';
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
  const [phone, setPhone] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [showValidation, setShowValidation] = useState(false);
  const [phoneBindE164, setPhoneBindE164] = useState<string | null>(null);
  const [phoneBindCode, setPhoneBindCode] = useState('');

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

  const validation = validateWorkerBasicsStep({ firstName, lastName, roleTypes, phone });

  const styles = useThemedStyles(({ colors, spacing, typography }) => ({
    hint: profileSettingsHintStyle({ typography, colors }),
    nameRow: {
      flexDirection: isWide ? ('row' as const) : ('column' as const),
      gap: spacing.md,
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
    setPhone(workerProfile.phone ? formatPhoneNumber(workerProfile.phone) : '');
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
      const normalizedPhone = normalizePhoneForStorage(phone);
      if (user?.id && normalizedPhone && !authUserHasVerifiedPhone(user, normalizedPhone)) {
        if (!phoneBindE164) {
          const bind = await requestAuthPhoneBind(normalizedPhone);
          if (bind.needsOtp) {
            setPhoneBindE164(bind.e164);
            setPhoneBindCode('');
            setSubmitError(null);
            return;
          }
        } else {
          if (phoneBindCode.trim().length < 6) {
            setSubmitError('Enter the 6-digit code we texted you.');
            return;
          }
          await verifyAuthPhoneBind(user.id, phoneBindE164, phoneBindCode);
          setPhoneBindE164(null);
          setPhoneBindCode('');
        }
      }
      await save({
        role_types: roleTypes,
        ...(normalizedPhone
          ? {
              phone: normalizedPhone,
              // Setup: verified number turns fill-in texts on by default.
              ...(!isEditMode
                ? {
                    fill_in_sms_opt_in: true,
                    short_notice_available: true,
                    fill_in_notification_mode: 'all' as const,
                  }
                : {}),
            }
          : {}),
      });
      if (isEditMode) {
        router.replace(exitHref);
      } else {
        router.push(WORKER_SETUP_LOCATION);
      }
    } catch (error) {
      setSubmitError(getAuthErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isWorkerProfileReady) return null;

  return (
    <FormScreen
      {...setupFormProps}
      title="Basics"
      subtitle="Your name, roles, and mobile number so clinics can reach you for fill-ins."
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
          continueLabel={
            phoneBindE164
              ? 'Verify and continue'
              : isEditMode
                ? 'Save changes'
                : 'Continue'
          }
          onContinue={handleContinue}
        />
      }>
      {progress.visible ? (
        <SetupStepProgress step={progress.step} total={progress.total} />
      ) : null}
      <ProfileDetailStack>
        <SectionPanel icon="camera-outline" iconAccent="primary" title="Profile photo">
          <Text style={styles.hint}>Optional — shown when you apply to clinics.</Text>
          <ProfilePhotoUpload
            embedded
            displayName={joinDisplayName(firstName, lastName)}
            onUpdated={() => void refreshWorkerProfile()}
          />
        </SectionPanel>

        <SectionPanel icon="person-outline" iconAccent="secondary" title="Your name">
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
        </SectionPanel>

        <SectionPanel icon="ribbon-outline" iconAccent="primary" title="Roles">
          <ChipSelector
            options={[...ROLE_TYPE_OPTIONS]}
            selected={roleTypes}
            multiple
            onChange={(value) => setRoleTypes(value as RoleType[])}
          />
        </SectionPanel>

        <SectionPanel icon="call-outline" iconAccent="secondary" title="Mobile phone">
          <Text style={styles.hint}>
            Used for fill-in text alerts and phone sign-in. Texts turn on by default — you can turn
            them off anytime.
          </Text>
          <AuthField
            label="Mobile phone"
            placeholder={PHONE_NUMBER_PLACEHOLDER}
            value={phone}
            onChangeText={(text) => {
              setPhone(formatPhoneNumber(text));
              setPhoneBindE164(null);
              setPhoneBindCode('');
            }}
            keyboardType="phone-pad"
            icon="call-outline"
            required
            invalid={showValidation && !normalizePhoneForStorage(phone)}
            validated={Boolean(normalizePhoneForStorage(phone))}
            accent="secondary"
          />
          {phoneBindE164 ? (
            <AuthField
              label="Verification code"
              placeholder="6-digit code"
              value={phoneBindCode}
              onChangeText={setPhoneBindCode}
              keyboardType="number-pad"
              autoComplete="one-time-code"
              accent="secondary"
            />
          ) : null}
        </SectionPanel>
      </ProfileDetailStack>
    </FormScreen>
  );
}
