import {
  authUserHasVerifiedPhone,
  getAuthErrorMessage,
  requestAuthPhoneBind,
  upsertClinicProfile,
  verifyAuthPhoneBind,
} from '@chairside/api';
import { normalizePhoneForStorage } from '@chairside/config';
import { Redirect, router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Platform, Text, View } from 'react-native';
import Animated, { useReducedMotion } from 'react-native-reanimated';

import { AuthField } from '@/components/onboarding/AuthField';
import { AuthScreenHeader } from '@/components/onboarding/AuthScreenHeader';
import { OnboardingButton } from '@/components/onboarding/OnboardingButton';
import { AUTH_STAGGER, enterFadeUp } from '@/components/onboarding/onboardingAnimations';
import { OnboardingShell } from '@/components/onboarding/OnboardingShell';
import { FormErrorBanner } from '@/components/ui/FormErrorBanner';
import { FormSuccessBanner } from '@/components/ui/FormSuccessBanner';
import { useAuth } from '@/contexts/AuthContext';
import { useClinicProfile } from '@/contexts/ClinicProfileContext';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { handleAuthSuccess } from '@/lib/handleAuthSuccess';
import {
  clearClinicPostAuthCaptureSkip,
  markClinicPostAuthCaptureSkipped,
} from '@/lib/clinicPostAuthCapture';
import { formatPhoneNumber, PHONE_NUMBER_PLACEHOLDER } from '@/lib/phone';
import { useThemedStyles } from '@/theme';

export default function CaptureClinicPhoneScreen() {
  const { user, profile, refreshProfile, isAuthReady } = useAuth();
  const { clinicProfile, refreshClinicProfile } = useClinicProfile();
  const { completeOnboarding } = useOnboarding();
  const reducedMotion = useReducedMotion();
  const [phone, setPhone] = useState(
    clinicProfile?.phone ? formatPhoneNumber(clinicProfile.phone) : '',
  );
  const [otpStep, setOtpStep] = useState<'phone' | 'code'>('phone');
  const [otpCode, setOtpCode] = useState('');
  const [phoneE164, setPhoneE164] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  const styles = useThemedStyles(({ colors, spacing }) => ({
    form: { gap: spacing.md },
    footer: { gap: spacing.sm },
    footnote: {
      fontSize: 13,
      lineHeight: 18,
      color: colors.labelTertiary,
      textAlign: 'center' as const,
      paddingTop: spacing.sm,
    },
  }));

  useEffect(() => {
    if (clinicProfile?.phone) {
      setPhone(formatPhoneNumber(clinicProfile.phone));
    }
  }, [clinicProfile?.phone]);

  if (isAuthReady && !user) {
    return <Redirect href="/(onboarding)/welcome" />;
  }

  if (isAuthReady && profile?.role && profile.role !== 'clinic') {
    return <Redirect href="/(onboarding)/role" />;
  }

  const continueAfter = async () => {
    await refreshClinicProfile();
    await refreshProfile(user!.id);
    await handleAuthSuccess(refreshProfile, completeOnboarding, user!.id);
  };

  const saveClinicPhone = async (storagePhone: string) => {
    await upsertClinicProfile(user!.id, {
      phone: storagePhone,
      account_type: clinicProfile?.account_type ?? 'individual',
      organization_id: user!.id,
    });
    await clearClinicPostAuthCaptureSkip(user!.id, 'phone');
  };

  const finishWithPhone = async (storage: string) => {
    await saveClinicPhone(storage);
    await continueAfter();
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
      setPhoneE164(bind.e164);
      setOtpStep('code');
      setOtpCode('');
      setFormSuccess('We sent a text with your code.');
    } catch (error) {
      const message = getAuthErrorMessage(error);
      setFormError(message);
      if (Platform.OS !== 'web') {
        Alert.alert('Could not send code', message);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerify = async () => {
    if (!user?.id || isSubmitting || otpCode.trim().length < 6) return;
    setIsSubmitting(true);
    setFormError(null);
    try {
      const storage =
        normalizePhoneForStorage(phoneE164 ?? phone) ?? normalizePhoneForStorage(phone);
      if (!storage) {
        setFormError('Enter a valid 10-digit phone number.');
        return;
      }
      await verifyAuthPhoneBind(user.id, phoneE164 ?? phone, otpCode);
      await finishWithPhone(storage);
    } catch (error) {
      const message = getAuthErrorMessage(error);
      setFormError(message);
      if (Platform.OS !== 'web') {
        Alert.alert('Could not verify', message);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSkip = async () => {
    if (!user?.id || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await markClinicPostAuthCaptureSkipped(user.id, 'phone');
      await continueAfter();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <OnboardingShell
      webLayout="centeredDecision"
      footer={
        <View style={styles.footer}>
          <OnboardingButton
            label={
              isSubmitting
                ? otpStep === 'phone'
                  ? 'Sending…'
                  : 'Verifying…'
                : otpStep === 'phone'
                  ? 'Send code'
                  : 'Verify & continue'
            }
            disabled={
              isSubmitting ||
              (otpStep === 'phone'
                ? phone.replace(/\D/g, '').length !== 10
                : otpCode.trim().length < 6)
            }
            onPress={() => void (otpStep === 'phone' ? handleSendCode() : handleVerify())}
          />
          <OnboardingButton
            label="Skip for now"
            variant="ghost"
            disabled={isSubmitting}
            onPress={() => void handleSkip()}
          />
          <Text style={styles.footnote}>
            You’ll need a clinic phone before posting fill-ins so pros’ cover requests can reach
            you.
          </Text>
        </View>
      }>
      <Animated.View entering={enterFadeUp(AUTH_STAGGER.header, reducedMotion)}>
        <AuthScreenHeader
          title="Clinic phone"
          subtitle="Where cover-request texts go so you can accept from SMS."
          onBack={() => router.back()}
        />
      </Animated.View>
      <Animated.View entering={enterFadeUp(AUTH_STAGGER.form, reducedMotion)} style={styles.form}>
        <FormErrorBanner message={formError} />
        <FormSuccessBanner message={formSuccess} />
        {otpStep === 'phone' ? (
          <AuthField
            label="Phone"
            placeholder={PHONE_NUMBER_PLACEHOLDER}
            value={phone}
            onChangeText={(text) => setPhone(formatPhoneNumber(text))}
            keyboardType="phone-pad"
            icon="call-outline"
            required
          />
        ) : (
          <AuthField
            label="Verification code"
            placeholder="6-digit code"
            value={otpCode}
            onChangeText={setOtpCode}
            keyboardType="number-pad"
            icon="keypad-outline"
            required
          />
        )}
      </Animated.View>
    </OnboardingShell>
  );
}
