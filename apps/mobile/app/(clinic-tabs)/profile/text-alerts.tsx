import {
  authUserHasVerifiedPhone,
  getAuthErrorMessage,
  requestAuthPhoneBind,
  upsertClinicProfile,
  verifyAuthPhoneBind,
} from '@chairside/api';
import { normalizePhoneForStorage } from '@chairside/config';
import { router } from 'expo-router';
import { useState } from 'react';
import { Text, View } from 'react-native';

import { ProfileDetailScreen } from '@/components/profile/ProfileDetailScreen';
import { ProfileDetailStack, profileSettingsHintStyle } from '@/components/profile/ProfileDetailBlocks';
import { ProfileSettingsCard } from '@/components/profile/ProfileSettingsCard';
import { AuthField } from '@/components/onboarding/AuthField';
import { OnboardingButton } from '@/components/onboarding/OnboardingButton';
import { FormErrorBanner } from '@/components/ui/FormErrorBanner';
import { useAuth } from '@/contexts/AuthContext';
import { useClinicProfile } from '@/contexts/ClinicProfileContext';
import { clearClinicPostAuthCaptureSkip } from '@/lib/clinicPostAuthCapture';
import { isClinicTextPhoneVerified } from '@/lib/clinicTextAlerts';
import { formatPhoneNumber, PHONE_NUMBER_PLACEHOLDER } from '@/lib/phone';
import { navigateToClinicProfileHub } from '@/lib/routing';
import { useThemedStyles } from '@/theme';

export default function ClinicTextAlertsScreen() {
  const { user } = useAuth();
  const { clinicId, clinicProfile, isOwner, refreshClinicProfile } = useClinicProfile();

  const storedPhone = clinicProfile?.phone?.trim() ?? '';
  const verified = isClinicTextPhoneVerified(user, storedPhone);

  const [editing, setEditing] = useState(false);
  const [phone, setPhone] = useState(storedPhone ? formatPhoneNumber(storedPhone) : '');
  const [otpStep, setOtpStep] = useState<'phone' | 'code'>('phone');
  const [otpCode, setOtpCode] = useState('');
  const [pendingStorage, setPendingStorage] = useState<string | null>(null);
  const [pendingE164, setPendingE164] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  const styles = useThemedStyles(({ spacing, typography, colors }) => ({
    statusRow: {
      gap: spacing.xs,
    },
    statusLabel: {
      ...typography.subtitle,
      fontWeight: '600' as const,
      color: colors.labelPrimary,
    },
    form: {
      gap: spacing.md,
    },
    actions: {
      gap: spacing.sm,
    },
    hint: profileSettingsHintStyle({ typography, colors }),
  }));

  const showForm = isOwner && (!verified || editing);
  const canSend = phone.replace(/\D/g, '').length === 10;
  const canVerify = otpCode.trim().length >= 6;

  const resetForm = () => {
    setEditing(false);
    setOtpStep('phone');
    setOtpCode('');
    setPendingStorage(null);
    setPendingE164(null);
    setFormError(null);
    setFormSuccess(null);
    setPhone(storedPhone ? formatPhoneNumber(storedPhone) : '');
  };

  const finishWithPhone = async (storage: string) => {
    if (!user?.id) return;
    await upsertClinicProfile(user.id, {
      phone: storage,
      account_type: clinicProfile?.account_type ?? 'individual',
      organization_id: clinicId ?? user.id,
    });
    await clearClinicPostAuthCaptureSkip(user.id, 'phone');
    await refreshClinicProfile();
    resetForm();
  };

  const handleSendCode = async () => {
    if (!user?.id || isSubmitting) return;
    const storage = normalizePhoneForStorage(phone);
    if (!storage) {
      setFormError('Enter a valid 10-digit phone number.');
      return;
    }

    setIsSubmitting(true);
    setFormError(null);
    setFormSuccess(null);
    try {
      if (authUserHasVerifiedPhone(user, storage)) {
        await finishWithPhone(storage);
        return;
      }
      const bind = await requestAuthPhoneBind(storage);
      if (!bind.needsOtp) {
        await finishWithPhone(storage);
        return;
      }
      setPendingStorage(storage);
      setPendingE164(bind.e164);
      setOtpStep('code');
      setOtpCode('');
      setFormSuccess('We sent a text with your code.');
    } catch (error) {
      setFormError(getAuthErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!user?.id || isSubmitting || !canVerify || !pendingStorage) return;
    setIsSubmitting(true);
    setFormError(null);
    try {
      await verifyAuthPhoneBind(user.id, pendingE164 ?? phone, otpCode);
      await finishWithPhone(pendingStorage);
    } catch (error) {
      setFormError(getAuthErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  const statusLabel = !storedPhone
    ? 'No number added'
    : verified
      ? `${formatPhoneNumber(storedPhone)} · Verified`
      : `${formatPhoneNumber(storedPhone)} · Not verified`;

  return (
    <ProfileDetailScreen
      title="Text alerts"
      subtitle="Cover-request texts go to this number. Verify it so clinic texts reach you."
      onBack={() => navigateToClinicProfileHub(router)}>
      <ProfileDetailStack>
        <ProfileSettingsCard title="Clinic phone" icon="chatbubble-ellipses-outline" iconAccent="secondary">
          <View style={styles.form}>
            <View style={styles.statusRow}>
              <Text style={styles.statusLabel}>{statusLabel}</Text>
              {!isOwner ? (
                <Text style={styles.hint}>Only the clinic owner can change this number.</Text>
              ) : null}
            </View>

            {isOwner && verified && !editing ? (
              <OnboardingButton
                label="Change number"
                variant="secondary"
                onPress={() => {
                  setEditing(true);
                  setFormError(null);
                  setFormSuccess(null);
                }}
              />
            ) : null}

            {showForm ? (
              <View style={styles.form}>
                <FormErrorBanner message={formError} />
                {formSuccess ? <Text style={styles.hint}>{formSuccess}</Text> : null}
                {otpStep === 'phone' ? (
                  <AuthField
                    label="Clinic phone"
                    placeholder={PHONE_NUMBER_PLACEHOLDER}
                    keyboardType="phone-pad"
                    value={phone}
                    onChangeText={(text) => setPhone(formatPhoneNumber(text))}
                    editable={!isSubmitting}
                    icon="call-outline"
                    required
                  />
                ) : (
                  <AuthField
                    label="Verification code"
                    placeholder="6-digit code"
                    keyboardType="number-pad"
                    value={otpCode}
                    onChangeText={setOtpCode}
                    editable={!isSubmitting}
                    icon="keypad-outline"
                    required
                  />
                )}
                <View style={styles.actions}>
                  {otpStep === 'phone' ? (
                    <OnboardingButton
                      label={isSubmitting ? 'Sending…' : 'Send code'}
                      disabled={isSubmitting || !canSend}
                      onPress={() => void handleSendCode()}
                    />
                  ) : (
                    <OnboardingButton
                      label={isSubmitting ? 'Verifying…' : 'Verify and save'}
                      disabled={isSubmitting || !canVerify}
                      onPress={() => void handleVerifyCode()}
                    />
                  )}
                  {editing || otpStep === 'code' ? (
                    <OnboardingButton
                      label="Cancel"
                      variant="ghost"
                      disabled={isSubmitting}
                      onPress={resetForm}
                    />
                  ) : null}
                </View>
              </View>
            ) : null}

            {!storedPhone && !isOwner ? (
              <Text style={styles.hint}>Ask the clinic owner to add a number.</Text>
            ) : null}
          </View>
        </ProfileSettingsCard>

        <Text style={styles.hint}>
          Cover-request texts go to this number so you can accept or decline from SMS. Verifying
          confirms the number belongs to your clinic.
        </Text>
      </ProfileDetailStack>
    </ProfileDetailScreen>
  );
}
