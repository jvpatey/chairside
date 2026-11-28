import {
  completeEmailSignUp,
  finishClinicOtpAuth,
  finishWorkerOtpAuth,
  getAuthErrorMessage,
  getProfile,
  getSupabaseClient,
  resendSignupConfirmation,
  setProfileRole,
  signInWithApple,
  signInWithEmailOtp,
  signInWithGoogle,
  signInWithPhoneOtp,
  SIGNUP_CONFIRMATION_REQUIRED_MESSAGE,
  updateProfileName,
  verifyEmailOtp,
  verifyPhoneOtp,
  type OtpChannel,
} from '@chairside/api';
import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Platform, Pressable, Text, View } from 'react-native';
import Animated, { useReducedMotion } from 'react-native-reanimated';

import { AuthField } from '@/components/onboarding/AuthField';
import { AuthScreenHeader } from '@/components/onboarding/AuthScreenHeader';
import { OnboardingButton } from '@/components/onboarding/OnboardingButton';
import { AUTH_STAGGER, enterFadeUp } from '@/components/onboarding/onboardingAnimations';
import { OnboardingShell } from '@/components/onboarding/OnboardingShell';
import { SocialAuthButtons } from '@/components/onboarding/SocialAuthButtons';
import { WorkerOtpAuthForm } from '@/components/onboarding/WorkerOtpAuthForm';
import { FormErrorBanner } from '@/components/ui/FormErrorBanner';
import { FormSuccessBanner } from '@/components/ui/FormSuccessBanner';
import { PasswordRequirements } from '@/components/onboarding/PasswordRequirements';
import { useAuth } from '@/contexts/AuthContext';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { handleAuthSuccess } from '@/lib/handleAuthSuccess';
import { savePendingSignupRole } from '@/lib/pendingSignupRole';
import {
  evaluatePassword,
  getPasswordPlaceholder,
  getPasswordTooShortMessage,
  passwordsMatch,
} from '@/lib/passwordPolicy';
import { webHover, webPointer, webTextLinkHoverStyles } from '@/lib/webPressableStyles';
import { useThemedStyles } from '@/theme';
import type { UserRole } from '@/types';

function parseRole(value: string | string[] | undefined): UserRole | null {
  const raw = Array.isArray(value) ? value[0] : value;
  return raw === 'worker' || raw === 'clinic' ? raw : null;
}

export default function SignUpScreen() {
  const { role: roleParam } = useLocalSearchParams<{ role?: string }>();
  const role = parseRole(roleParam);
  const isWorkerSignup = role === 'worker';
  /** Clinic signup uses OTP like workers. */
  const isClinicOtpSignup = role === 'clinic';
  const isOtpSignup = isWorkerSignup || isClinicOtpSignup;
  const { refreshProfile } = useAuth();
  const { completeOnboarding } = useOnboarding();
  const reducedMotion = useReducedMotion();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [channel, setChannel] = useState<OtpChannel>('phone');
  const [otpStep, setOtpStep] = useState<'contact' | 'code'>('contact');
  const [otpCode, setOtpCode] = useState('');
  const [phoneE164, setPhoneE164] = useState<string | null>(null);
  const [needsOauthName, setNeedsOauthName] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [confirmationRequired, setConfirmationRequired] = useState(false);
  const [isResending, setIsResending] = useState(false);

  const passwordEvaluation = evaluatePassword(password, { email });
  const confirmHasInput = confirmPassword.length > 0;
  const passwordsDoMatch = passwordsMatch(password, confirmPassword);
  const canSubmitClinic =
    Boolean(email.trim()) && passwordEvaluation.isValid && passwordsDoMatch && confirmHasInput;
  const canSendWorkerOtp =
    Boolean(firstName.trim()) &&
    Boolean(lastName.trim()) &&
    (channel === 'email' ? Boolean(email.trim()) : phone.replace(/\D/g, '').length === 10);
  const canSendClinicOtp =
    channel === 'email' ? Boolean(email.trim()) : phone.replace(/\D/g, '').length === 10;
  const canSendOtp = isWorkerSignup ? canSendWorkerOtp : canSendClinicOtp;
  const canVerifyOtp = otpCode.trim().length >= 4;

  useEffect(() => {
    if (role) {
      void savePendingSignupRole(role);
    }
  }, [role]);

  const styles = useThemedStyles(({ colors, spacing }) => ({
    form: {
      gap: spacing.md,
    },
    matchHint: {
      fontSize: 13,
      lineHeight: 18,
      paddingHorizontal: spacing.xs,
    },
    matchHintSuccess: {
      color: colors.success,
      fontWeight: '500' as const,
    },
    matchHintError: {
      color: colors.destructive,
      fontWeight: '500' as const,
    },
    footer: {
      gap: spacing.md,
      marginTop: Platform.OS === 'web' ? 0 : spacing.lg,
    },
    switchRow: {
      flexDirection: 'row' as const,
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
      gap: spacing.xs,
      paddingVertical: spacing.sm,
    },
    switchMuted: {
      fontSize: 15,
      color: colors.labelSecondary,
    },
    switchLinkPressable: {
      paddingVertical: spacing.xs,
      paddingHorizontal: spacing.xs,
      borderRadius: 8,
      ...webPointer(),
    },
    switchLinkHovered: webTextLinkHoverStyles(colors),
    switchLink: {
      fontSize: 15,
      fontWeight: '600' as const,
      color: colors.primary,
    },
  }));

  const finishWorkerSession = async (userId: string, verifiedPhoneE164?: string | null) => {
    await finishWorkerOtpAuth({
      userId,
      role: 'worker',
      name: { firstName: firstName.trim(), lastName: lastName.trim() },
      phoneE164: verifiedPhoneE164,
    });
    await handleAuthSuccess(refreshProfile, completeOnboarding, userId);
  };

  const finishClinicSession = async (userId: string, verifiedPhoneE164?: string | null) => {
    await finishClinicOtpAuth({
      userId,
      phoneE164: verifiedPhoneE164,
    });
    await handleAuthSuccess(refreshProfile, completeOnboarding, userId);
  };

  const runSocialSignIn = async (action: () => Promise<unknown>) => {
    if (isSubmitting) return;
    if (!role) {
      router.replace('/(onboarding)/role');
      return;
    }

    setIsSubmitting(true);
    setFormError(null);
    setFormSuccess(null);
    let redirecting = false;
    try {
      await savePendingSignupRole(role);
      if ((await action()) === null) {
        redirecting = true;
        return;
      }

      const {
        data: { session },
      } = await getSupabaseClient().auth.getSession();

      if (!session?.user) return;

      const profile = await getProfile(session.user.id);
      if (!profile?.role) {
        await setProfileRole(session.user.id, role);
        await refreshProfile();
      }

      if (role === 'worker') {
        const hasName =
          Boolean(profile?.first_name?.trim()) ||
          Boolean(profile?.display_name?.trim()) ||
          Boolean(firstName.trim());
        if (!hasName) {
          setNeedsOauthName(true);
          return;
        }
        if (firstName.trim() || lastName.trim()) {
          await updateProfileName(session.user.id, {
            firstName: firstName.trim(),
            lastName: lastName.trim(),
          });
        }
      }

      await handleAuthSuccess(refreshProfile, completeOnboarding, session.user.id);
    } catch (error) {
      const message = getAuthErrorMessage(error);
      if (message !== 'Sign in was cancelled.') {
        setFormError(message);
        setFormSuccess(null);
        if (Platform.OS !== 'web') {
          Alert.alert('Sign up failed', message);
        }
      }
    } finally {
      if (!redirecting) setIsSubmitting(false);
    }
  };

  const handleOauthNameContinue = async () => {
    if (isSubmitting) return;
    if (!firstName.trim() || !lastName.trim()) {
      setFormError('Add your first and last name to continue.');
      return;
    }

    setIsSubmitting(true);
    setFormError(null);
    try {
      const {
        data: { session },
      } = await getSupabaseClient().auth.getSession();
      if (!session?.user) {
        setFormError('Session expired. Sign up again.');
        return;
      }
      await updateProfileName(session.user.id, {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
      });
      if (role) {
        const profile = await getProfile(session.user.id);
        if (!profile?.role) {
          await setProfileRole(session.user.id, role);
        }
      }
      await handleAuthSuccess(refreshProfile, completeOnboarding, session.user.id);
    } catch (error) {
      setFormError(getAuthErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSendOtp = async () => {
    if (!role || isSubmitting || !canSendOtp) return;

    setIsSubmitting(true);
    setFormError(null);
    setFormSuccess(null);
    try {
      await savePendingSignupRole(role);
      if (channel === 'email') {
        await signInWithEmailOtp(email, role);
        setPhoneE164(null);
        setFormSuccess(`We sent a code to ${email.trim()}.`);
      } else {
        const e164 = await signInWithPhoneOtp(phone, role);
        setPhoneE164(e164);
        setFormSuccess('We sent a text with your code.');
      }
      setOtpStep('code');
      setOtpCode('');
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

  const handleVerifyOtp = async () => {
    if (!role || isSubmitting || !canVerifyOtp) return;

    setIsSubmitting(true);
    setFormError(null);
    try {
      const session =
        channel === 'email'
          ? await verifyEmailOtp(email, otpCode)
          : await verifyPhoneOtp(phoneE164 ?? phone, otpCode);

      if (!session.user) {
        throw new Error('Could not verify that code. Try again.');
      }

      if (role === 'clinic') {
        await finishClinicSession(session.user.id, channel === 'phone' ? phoneE164 : null);
      } else {
        await finishWorkerSession(session.user.id, channel === 'phone' ? phoneE164 : null);
      }
    } catch (error) {
      const message = getAuthErrorMessage(error);
      setFormError(message);
      if (Platform.OS !== 'web') {
        Alert.alert('Verification failed', message);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateClinicAccount = async () => {
    if (!role) {
      router.replace('/(onboarding)/role');
      return;
    }

    if (isSubmitting) return;

    if (!email.trim() || !password || !confirmPassword) {
      setFormError('Fill in all fields to create your account.');
      setFormSuccess(null);
      if (Platform.OS !== 'web') {
        Alert.alert('Missing information', 'Fill in all fields to create your account.');
      }
      return;
    }

    if (password !== confirmPassword) {
      setFormError('Make sure both password fields match.');
      setFormSuccess(null);
      return;
    }

    if (passwordEvaluation.maxLengthError) {
      setFormError(passwordEvaluation.maxLengthError);
      return;
    }

    if (!passwordEvaluation.isValid) {
      const message = passwordEvaluation.requirements.find((requirement) => !requirement.met)?.label
        ? `Password requirements not met: ${passwordEvaluation.requirements
            .filter((requirement) => !requirement.met)
            .map((requirement) => requirement.label.toLowerCase())
            .join(', ')}.`
        : getPasswordTooShortMessage();
      setFormError(message);
      return;
    }

    setIsSubmitting(true);
    setFormError(null);
    setFormSuccess(null);
    setConfirmationRequired(false);
    try {
      const { session, confirmationRequired: needsConfirmation } = await completeEmailSignUp(
        email,
        password,
        role,
      );

      if (session?.user) {
        const userId = session.user.id;
        const profile = await getProfile(userId);
        if (!profile?.role) {
          await setProfileRole(userId, role);
        }
        await handleAuthSuccess(refreshProfile, completeOnboarding, userId);
        return;
      }

      if (needsConfirmation) {
        await savePendingSignupRole(role);
        setConfirmationRequired(true);
        setFormSuccess(SIGNUP_CONFIRMATION_REQUIRED_MESSAGE);
        if (Platform.OS !== 'web') {
          Alert.alert('Confirm your email', SIGNUP_CONFIRMATION_REQUIRED_MESSAGE);
        }
      }
    } catch (error) {
      const message = getAuthErrorMessage(error);
      setFormError(message);
      setFormSuccess(null);
      if (Platform.OS !== 'web') {
        Alert.alert('Create account failed', message);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendConfirmation = async () => {
    if (isResending || isSubmitting || !email.trim()) return;
    setIsResending(true);
    setFormError(null);
    try {
      await resendSignupConfirmation(email);
      setFormSuccess(SIGNUP_CONFIRMATION_REQUIRED_MESSAGE);
    } catch (error) {
      const message = getAuthErrorMessage(error);
      setFormError(message);
      setFormSuccess(null);
    } finally {
      setIsResending(false);
    }
  };

  if (!role) {
    return <Redirect href="/(onboarding)/role" />;
  }

  if (needsOauthName) {
    return (
      <OnboardingShell
        webLayout="centeredDecision"
        footer={
          <OnboardingButton
            label={isSubmitting ? 'Saving…' : 'Continue'}
            disabled={isSubmitting || !firstName.trim() || !lastName.trim()}
            onPress={() => void handleOauthNameContinue()}
          />
        }>
        <Animated.View entering={enterFadeUp(AUTH_STAGGER.header, reducedMotion)}>
          <AuthScreenHeader
            title="What’s your name?"
            subtitle="We need a name for your profile before you continue."
            onBack={() => setNeedsOauthName(false)}
          />
        </Animated.View>
        <Animated.View entering={enterFadeUp(AUTH_STAGGER.form, reducedMotion)} style={styles.form}>
          <FormErrorBanner message={formError} />
          <AuthField
            label="First name"
            placeholder="First name"
            autoCapitalize="words"
            autoComplete="given-name"
            value={firstName}
            onChangeText={setFirstName}
            editable={!isSubmitting}
          />
          <AuthField
            label="Last name"
            placeholder="Last name"
            autoCapitalize="words"
            autoComplete="family-name"
            value={lastName}
            onChangeText={setLastName}
            editable={!isSubmitting}
          />
        </Animated.View>
      </OnboardingShell>
    );
  }

  const otpPrimaryLabel =
    otpStep === 'code'
      ? isSubmitting
        ? 'Verifying…'
        : 'Verify and continue'
      : isSubmitting
        ? 'Sending code…'
        : 'Send code';

  return (
    <OnboardingShell
      webLayout="centeredDecision"
      footer={
        <View style={styles.footer}>
          <Animated.View entering={enterFadeUp(AUTH_STAGGER.primaryCta, reducedMotion)}>
            {isOtpSignup ? (
              <OnboardingButton
                label={otpPrimaryLabel}
                disabled={
                  isSubmitting || (otpStep === 'code' ? !canVerifyOtp : !canSendOtp)
                }
                onPress={() => void (otpStep === 'code' ? handleVerifyOtp() : handleSendOtp())}
              />
            ) : confirmationRequired ? (
              <OnboardingButton
                label={isResending ? 'Sending…' : 'Resend confirmation email'}
                disabled={isResending || isSubmitting || !email.trim()}
                onPress={handleResendConfirmation}
              />
            ) : (
              <OnboardingButton
                label={isSubmitting ? 'Creating account…' : 'Create account'}
                disabled={isSubmitting || !canSubmitClinic}
                onPress={handleCreateClinicAccount}
              />
            )}
          </Animated.View>
          <View style={styles.switchRow}>
            <Text style={styles.switchMuted}>Already have an account?</Text>
            <Pressable
              accessibilityRole="link"
              onPress={() => router.replace('/(onboarding)/sign-in')}
              style={({ pressed, hovered }) => [
                styles.switchLinkPressable,
                webHover(hovered, pressed, styles.switchLinkHovered),
                pressed && { opacity: 0.75 },
              ]}>
              <Text style={styles.switchLink}>Sign in</Text>
            </Pressable>
          </View>
        </View>
      }>
      {confirmationRequired && !isOtpSignup ? (
        <>
          <Animated.View entering={enterFadeUp(AUTH_STAGGER.header, reducedMotion)}>
            <AuthScreenHeader
              title="Check your email"
              subtitle={`We sent a confirmation link to ${email.trim()}. Open it to finish setting up your account.`}
              onBack={() => setConfirmationRequired(false)}
            />
          </Animated.View>
          <Animated.View entering={enterFadeUp(AUTH_STAGGER.form, reducedMotion)} style={styles.form}>
            <FormErrorBanner message={formError} />
            <FormSuccessBanner message={formSuccess} />
          </Animated.View>
        </>
      ) : (
        <>
          <Animated.View entering={enterFadeUp(AUTH_STAGGER.header, reducedMotion)}>
            <AuthScreenHeader
              title={isOtpSignup && otpStep === 'code' ? 'Enter your code' : 'Create your account'}
              subtitle={
                isWorkerSignup
                  ? 'Name plus phone or email — that’s it to get started.'
                  : isClinicOtpSignup
                    ? 'Phone or email, then your clinic name and address.'
                    : 'A few details to get you into Chairside.'
              }
              onBack={() => {
                if (isOtpSignup && otpStep === 'code') {
                  setOtpStep('contact');
                  setOtpCode('');
                  setFormSuccess(null);
                  return;
                }
                router.back();
              }}
            />
          </Animated.View>
          <Animated.View entering={enterFadeUp(AUTH_STAGGER.social, reducedMotion)}>
            <SocialAuthButtons
              disabled={isSubmitting}
              onApplePress={() => runSocialSignIn(signInWithApple)}
              onGooglePress={() => runSocialSignIn(signInWithGoogle)}
            />
          </Animated.View>
          <Animated.View entering={enterFadeUp(AUTH_STAGGER.form, reducedMotion)} style={styles.form}>
            <FormErrorBanner message={formError} />
            <FormSuccessBanner message={formSuccess} />
            {isOtpSignup ? (
              <WorkerOtpAuthForm
                mode="sign-up"
                step={otpStep}
                channel={channel}
                onChannelChange={setChannel}
                firstName={firstName}
                lastName={lastName}
                onFirstNameChange={setFirstName}
                onLastNameChange={setLastName}
                email={email}
                onEmailChange={setEmail}
                phone={phone}
                onPhoneChange={setPhone}
                code={otpCode}
                onCodeChange={setOtpCode}
                editable={!isSubmitting}
                showPersonName={isWorkerSignup}
                onChangeContact={() => {
                  setOtpStep('contact');
                  setOtpCode('');
                  setFormSuccess(null);
                }}
                onResendCode={handleSendOtp}
              />
            ) : (
              <>
                <AuthField
                  label="Email"
                  placeholder="you@example.com"
                  keyboardType="email-address"
                  value={email}
                  onChangeText={setEmail}
                  editable={!isSubmitting && !isResending}
                />
                <AuthField
                  label="Password"
                  placeholder={getPasswordPlaceholder()}
                  secureTextEntry
                  enablePasswordVisibilityToggle
                  value={password}
                  onChangeText={setPassword}
                  editable={!isSubmitting && !isResending}
                  validated={passwordEvaluation.isValid}
                />
                <PasswordRequirements
                  password={password}
                  email={email}
                  evaluation={passwordEvaluation}
                />
                <AuthField
                  label="Confirm password"
                  placeholder="Confirm your password"
                  secureTextEntry
                  enablePasswordVisibilityToggle
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  editable={!isSubmitting && !isResending}
                  validated={canSubmitClinic}
                  invalid={confirmHasInput && !passwordsDoMatch}
                />
                {confirmHasInput ? (
                  <Text
                    style={[
                      styles.matchHint,
                      passwordsDoMatch ? styles.matchHintSuccess : styles.matchHintError,
                    ]}>
                    {passwordsDoMatch ? 'Passwords match' : 'Passwords do not match'}
                  </Text>
                ) : null}
              </>
            )}
          </Animated.View>
        </>
      )}
    </OnboardingShell>
  );
}
