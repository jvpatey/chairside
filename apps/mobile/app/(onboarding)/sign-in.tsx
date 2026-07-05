import {
  getAuthErrorMessage,
  getSupabaseClient,
  resetPasswordForEmail,
  signInWithApple,
  signInWithEmail,
  signInWithGoogle,
} from '@chairside/api';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Platform, Pressable, Text, View } from 'react-native';
import Animated, { useReducedMotion } from 'react-native-reanimated';

import { AuthField } from '@/components/onboarding/AuthField';
import { AuthScreenHeader } from '@/components/onboarding/AuthScreenHeader';
import { OnboardingButton } from '@/components/onboarding/OnboardingButton';
import {
  AUTH_STAGGER,
  enterFadeUp,
} from '@/components/onboarding/onboardingAnimations';
import { OnboardingShell } from '@/components/onboarding/OnboardingShell';
import { AuthHeroGlow } from '@/components/onboarding/AuthHeroGlow';
import { SocialAuthButtons } from '@/components/onboarding/SocialAuthButtons';
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
  'sign-in-failed': 'We could not finish signing you in. Please try again.',
};

export default function SignInScreen() {
  const { refreshProfile } = useAuth();
  const { completeOnboarding } = useOnboarding();
  const { authError } = useLocalSearchParams<{ authError?: string }>();
  const reducedMotion = useReducedMotion();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSendingReset, setIsSendingReset] = useState(false);
  const [resetLinkSent, setResetLinkSent] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [resetHint, setResetHint] = useState<string | null>(null);

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
    footer: {
      gap: spacing.md,
      marginTop: spacing.lg,
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
    try {
      await action();
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
      setIsSubmitting(false);
    }
  };

  const handleSignIn = async () => {
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

  return (
    <OnboardingShell
      authSplit
      backgroundAccessory={<AuthHeroGlow />}
      footer={
        <View style={styles.footer}>
          <Animated.View entering={enterFadeUp(AUTH_STAGGER.primaryCta, reducedMotion)}>
            <OnboardingButton
              label={isSubmitting ? 'Signing in…' : 'Sign in'}
              disabled={signInBusy}
              onPress={handleSignIn}
            />
          </Animated.View>
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
          subtitle="Sign in to pick up where you left off."
          onBack={() => router.back()}
        />
      </Animated.View>
      <Animated.View entering={enterFadeUp(AUTH_STAGGER.social, reducedMotion)}>
        <SocialAuthButtons
          disabled={signInBusy}
          onApplePress={() => runSocialSignIn(signInWithApple)}
          onGooglePress={() => runSocialSignIn(signInWithGoogle)}
        />
      </Animated.View>
      <Animated.View
        entering={enterFadeUp(AUTH_STAGGER.form, reducedMotion)}
        style={styles.form}>
        {formError ? <Text style={styles.formError}>{formError}</Text> : null}
        {resetLinkSent ? <FormSuccessBanner message={PASSWORD_RESET_SENT_MESSAGE} /> : null}
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
      </Animated.View>
    </OnboardingShell>
  );
}
