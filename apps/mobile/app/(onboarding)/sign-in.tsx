import {
  finishWorkerOtpAuth,
  getAuthErrorMessage,
  getProfile,
  getSupabaseClient,
  resetPasswordForEmail,
  resolvePhoneShellLogin,
  signInWithApple,
  signInWithEmail,
  signInWithEmailOtp,
  signInWithGoogle,
  signInWithPhoneOtp,
  signOut,
  verifyEmailOtp,
  verifyPhoneOtp,
  type OtpChannel,
} from '@chairside/api';
import { router, useLocalSearchParams } from 'expo-router';
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
import { FormSuccessBanner } from '@/components/ui/FormSuccessBanner';
import { useAuth } from '@/contexts/AuthContext';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { handleAuthSuccess } from '@/lib/handleAuthSuccess';
import { PASSWORD_RESET_SENT_MESSAGE } from '@/lib/passwordResetCopy';
import {
  webHover,
  webOnlyStyle,
  webPointer,
  webTextLinkHoverStyles,
} from '@/lib/webPressableStyles';
import { useThemedStyles } from '@/theme';

const AUTH_ERROR_MESSAGES: Record<string, string> = {
  'reset-link-expired':
    'That reset link is invalid or expired. Enter your email below and request a new one.',
  'sign-in-failed':
    'We could not finish signing you in. If you used an email link, it may be invalid or expired. Request a new one.',
};

export default function SignInScreen() {
  const { refreshProfile } = useAuth();
  const { completeOnboarding } = useOnboarding();
  const { authError } = useLocalSearchParams<{ authError?: string }>();
  const reducedMotion = useReducedMotion();

  const [authMode, setAuthMode] = useState<'otp' | 'password'>('otp');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [channel, setChannel] = useState<OtpChannel>('phone');
  const [otpStep, setOtpStep] = useState<'contact' | 'code'>('contact');
  const [otpCode, setOtpCode] = useState('');
  const [phoneE164, setPhoneE164] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSendingReset, setIsSendingReset] = useState(false);
  const [resetLinkSent, setResetLinkSent] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [resetHint, setResetHint] = useState<string | null>(null);

  const canSendOtp =
    channel === 'email' ? Boolean(email.trim()) : phone.replace(/\D/g, '').length === 10;
  const canVerifyOtp = otpCode.trim().length >= 4;

  const styles = useThemedStyles(({ colors, spacing }) => ({
    form: {
      gap: spacing.md,
    },
    formError: {
      fontSize: 14,
      lineHeight: 20,
      color: colors.destructive,
      backgroundColor: `${colors.destructive}14`,
      borderRadius: 12,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
    },
    resetHint: {
      fontSize: 14,
      lineHeight: 20,
      color: colors.labelSecondary,
      paddingHorizontal: spacing.xs,
    },
    forgot: {
      alignSelf: 'flex-end',
      paddingVertical: spacing.xs,
      paddingHorizontal: spacing.xs,
      marginRight: -spacing.xs,
      minHeight: 44,
      justifyContent: 'center',
      borderRadius: 8,
      ...webPointer(),
    },
    forgotDisabled: {
      opacity: 0.55,
      ...webPointer('default'),
    },
    forgotHovered: webTextLinkHoverStyles(colors),
    forgotText: {
      fontSize: 15,
      fontWeight: '600',
      color: colors.primary,
    },
    forgotTextDisabled: {
      color: colors.labelTertiary,
    },
    modeSwitch: {
      alignSelf: 'center',
      paddingVertical: spacing.xs,
      ...webPointer(),
    },
    modeSwitchHovered: webTextLinkHoverStyles(colors),
    modeSwitchLabel: {
      fontSize: 15,
      fontWeight: '600',
      color: colors.primary,
    },
    footer: {
      gap: spacing.md,
      marginTop: Platform.OS === 'web' ? 0 : spacing.lg,
    },
    switchRow: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
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
      fontWeight: '600',
      color: colors.primary,
    },
  }));

  useEffect(() => {
    if (!authError) return;
    const message = AUTH_ERROR_MESSAGES[authError];
    if (message) {
      setFormError(message);
    }
  }, [authError]);

  const runSocialSignIn = async (action: () => Promise<unknown>) => {
    if (isSubmitting || isSendingReset) return;

    setIsSubmitting(true);
    setFormError(null);
    setResetHint(null);
    let redirecting = false;
    try {
      if ((await action()) === null) {
        redirecting = true;
        return;
      }

      const {
        data: { session },
      } = await getSupabaseClient().auth.getSession();
      if (!session?.user) return;

      await handleAuthSuccess(refreshProfile, completeOnboarding, session.user.id);
    } catch (error) {
      const message = getAuthErrorMessage(error);
      if (message !== 'Sign in was cancelled.') {
        setFormError(message);
        if (Platform.OS !== 'web') {
          Alert.alert('Sign in failed', message);
        }
      }
    } finally {
      if (!redirecting) setIsSubmitting(false);
    }
  };

  const handlePasswordSignIn = async () => {
    if (isSubmitting || isSendingReset) return;

    if (!email.trim() || !password) {
      const message = 'Enter your email and password.';
      setFormError(message);
      if (Platform.OS !== 'web') {
        Alert.alert('Missing information', message);
      }
      return;
    }

    setIsSubmitting(true);
    setFormError(null);
    setResetHint(null);
    try {
      const { user } = await signInWithEmail(email, password);
      if (!user) return;

      await handleAuthSuccess(refreshProfile, completeOnboarding, user.id);
    } catch (error) {
      const message = getAuthErrorMessage(error);
      setFormError(message);
      if (Platform.OS !== 'web') {
        Alert.alert('Sign in failed', message);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSendOtp = async () => {
    if (isSubmitting || !canSendOtp) return;

    setIsSubmitting(true);
    setFormError(null);
    setFormSuccess(null);
    try {
      if (channel === 'email') {
        await signInWithEmailOtp(email);
        setPhoneE164(null);
        setFormSuccess(`We sent a code to ${email.trim()}.`);
      } else {
        const e164 = await signInWithPhoneOtp(phone, undefined, { createUser: false });
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
    if (isSubmitting || !canVerifyOtp) return;

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

      // Returning phone users: keep verified number on worker profile when role is set.
      const profile = await getProfile(session.user.id);
      if (channel === 'phone' && phoneE164 && !profile?.role) {
        // Empty phone-only shell from before Auth linking — don't send them through role pick.
        try {
          await resolvePhoneShellLogin(phoneE164);
        } catch (shellError) {
          try {
            await signOut();
          } catch {
            // Session may already be invalid if the shell was deleted.
          }
          throw shellError;
        }
      }
      if (profile?.role === 'worker' && channel === 'phone' && phoneE164) {
        await finishWorkerOtpAuth({
          userId: session.user.id,
          role: 'worker',
          phoneE164,
        });
      }

      await handleAuthSuccess(refreshProfile, completeOnboarding, session.user.id);
    } catch (error) {
      const message = getAuthErrorMessage(error);
      setFormError(message);
      if (Platform.OS !== 'web') {
        Alert.alert('Sign in failed', message);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleForgotPassword = async () => {
    if (isSendingReset) return;

    if (!email.trim()) {
      const message = 'Add the email for your account first.';
      setResetHint(message);
      setFormError(null);
      if (Platform.OS !== 'web') {
        Alert.alert('Enter your email', message);
      }
      return;
    }

    setIsSendingReset(true);
    setResetLinkSent(false);
    setFormError(null);
    setResetHint(null);
    try {
      await resetPasswordForEmail(email);
      setResetLinkSent(true);
      if (Platform.OS !== 'web') {
        Alert.alert('Check your email', PASSWORD_RESET_SENT_MESSAGE);
      }
    } catch (error) {
      const message = getAuthErrorMessage(error);
      setFormError(message);
      if (Platform.OS !== 'web') {
        Alert.alert('Reset failed', message);
      }
    } finally {
      setIsSendingReset(false);
    }
  };

  const signInBusy = isSubmitting || isSendingReset;
  const fieldsLocked = isSendingReset;
  const primaryLabel =
    authMode === 'password'
      ? isSubmitting
        ? 'Signing in…'
        : 'Sign in'
      : otpStep === 'code'
        ? isSubmitting
          ? 'Verifying…'
          : 'Verify and sign in'
        : isSubmitting
          ? 'Sending code…'
          : 'Send code';

  return (
    <OnboardingShell
      webLayout="centeredDecision"
      footer={
        <View style={styles.footer}>
          <Animated.View entering={enterFadeUp(AUTH_STAGGER.primaryCta, reducedMotion)}>
            <OnboardingButton
              label={primaryLabel}
              disabled={
                signInBusy ||
                (authMode === 'otp' &&
                  (otpStep === 'code' ? !canVerifyOtp : !canSendOtp))
              }
              onPress={() => {
                if (authMode === 'password') {
                  void handlePasswordSignIn();
                  return;
                }
                void (otpStep === 'code' ? handleVerifyOtp() : handleSendOtp());
              }}
            />
          </Animated.View>
          <Pressable
            accessibilityRole="button"
            onPress={() => {
              setAuthMode((current) => (current === 'otp' ? 'password' : 'otp'));
              setOtpStep('contact');
              setOtpCode('');
              setFormError(null);
              setFormSuccess(null);
            }}
            style={({ pressed, hovered }) => [
              styles.modeSwitch,
              webHover(hovered, pressed, styles.modeSwitchHovered),
              pressed && { opacity: 0.75 },
            ]}>
            <Text style={styles.modeSwitchLabel}>
              {authMode === 'otp' ? 'Use password instead' : 'Use a phone or email code'}
            </Text>
          </Pressable>
          <View style={styles.switchRow}>
            <Text style={styles.switchMuted}>New to Chairside?</Text>
            <Pressable
              accessibilityRole="link"
              onPress={() => router.replace('/(onboarding)/role')}
              style={({ pressed, hovered }) => [
                styles.switchLinkPressable,
                webHover(hovered, pressed, styles.switchLinkHovered),
                pressed && { opacity: 0.75 },
              ]}>
              <Text style={styles.switchLink}>Get started</Text>
            </Pressable>
          </View>
        </View>
      }>
      <Animated.View entering={enterFadeUp(AUTH_STAGGER.header, reducedMotion)}>
        <AuthScreenHeader
          title="Welcome back"
          subtitle={
            authMode === 'otp'
              ? otpStep === 'code'
                ? 'Enter the code we just sent you.'
                : 'Sign in with a phone or email code.'
              : 'Sign in with your email and password.'
          }
          onBack={() => {
            if (authMode === 'otp' && otpStep === 'code') {
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
          disabled={signInBusy}
          onApplePress={() => runSocialSignIn(signInWithApple)}
          onGooglePress={() => runSocialSignIn(signInWithGoogle)}
        />
      </Animated.View>
      <Animated.View entering={enterFadeUp(AUTH_STAGGER.form, reducedMotion)} style={styles.form}>
        {formError ? <Text style={styles.formError}>{formError}</Text> : null}
        {formSuccess ? <FormSuccessBanner message={formSuccess} /> : null}
        {resetLinkSent ? <FormSuccessBanner message={PASSWORD_RESET_SENT_MESSAGE} /> : null}

        {authMode === 'otp' ? (
          <WorkerOtpAuthForm
            mode="sign-in"
            step={otpStep}
            channel={channel}
            onChannelChange={setChannel}
            firstName=""
            lastName=""
            onFirstNameChange={() => undefined}
            onLastNameChange={() => undefined}
            email={email}
            onEmailChange={(text) => {
              setFormError(null);
              setEmail(text);
            }}
            phone={phone}
            onPhoneChange={(text) => {
              setFormError(null);
              setPhone(text);
            }}
            code={otpCode}
            onCodeChange={setOtpCode}
            editable={!signInBusy}
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
              autoComplete="email"
              value={email}
              onChangeText={(text) => {
                setFormError(null);
                setResetHint(null);
                setResetLinkSent(false);
                setEmail(text);
              }}
              editable={!fieldsLocked}
            />
            <AuthField
              label="Password"
              placeholder="Your password"
              secureTextEntry
              enablePasswordVisibilityToggle
              autoComplete="current-password"
              value={password}
              onChangeText={(text) => {
                setFormError(null);
                setPassword(text);
              }}
              editable={!fieldsLocked}
            />
            {resetHint ? <Text style={styles.resetHint}>{resetHint}</Text> : null}
            <Pressable
              accessibilityRole="link"
              accessibilityState={{ disabled: isSendingReset }}
              disabled={isSendingReset}
              onPress={() => void handleForgotPassword()}
              style={({ pressed, hovered }) => [
                styles.forgot,
                isSendingReset && styles.forgotDisabled,
                webHover(hovered, pressed, styles.forgotHovered, isSendingReset),
                pressed && !isSendingReset && { opacity: 0.75 },
                webOnlyStyle({ tabIndex: isSendingReset ? -1 : 0 } as never),
              ]}>
              <Text style={[styles.forgotText, isSendingReset && styles.forgotTextDisabled]}>
                {isSendingReset ? 'Sending reset link…' : 'Forgot password?'}
              </Text>
            </Pressable>
          </>
        )}
      </Animated.View>
    </OnboardingShell>
  );
}
