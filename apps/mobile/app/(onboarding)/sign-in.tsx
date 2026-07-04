import {
  getAuthErrorMessage,
  getSupabaseClient,
  resetPasswordForEmail,
  signInWithApple,
  signInWithEmail,
  signInWithGoogle,
} from '@chairside/api';
import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, Platform, Pressable, Text, View } from 'react-native';

import { AuthField } from '@/components/onboarding/AuthField';
import { AuthScreenHeader } from '@/components/onboarding/AuthScreenHeader';
import { OnboardingButton } from '@/components/onboarding/OnboardingButton';
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
  webPointer,
  webTextLinkHoverStyles,
} from '@/lib/webPressableStyles';
import { useThemedStyles } from '@/theme';

export default function SignInScreen() {
  const { refreshProfile } = useAuth();
  const { completeOnboarding } = useOnboarding();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSendingReset, setIsSendingReset] = useState(false);
  const [resetLinkSent, setResetLinkSent] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

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
    forgotHovered: webTextLinkHoverStyles(colors),
    forgotText: {
      fontSize: 15,
      fontWeight: '600',
      color: colors.primary,
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

  const runSocialSignIn = async (action: () => Promise<unknown>) => {
    if (isSubmitting) return;

    setIsSubmitting(true);
    setFormError(null);
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
        Alert.alert('Sign in failed', message);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSignIn = async () => {
    if (isSubmitting) return;

    if (!email.trim() || !password) {
      const message = 'Enter your email and password.';
      setFormError(message);
      Alert.alert('Missing information', message);
      return;
    }

    setIsSubmitting(true);
    setFormError(null);
    try {
      const { user } = await signInWithEmail(email, password);
      if (!user) return;

      await handleAuthSuccess(refreshProfile, completeOnboarding, user.id);
    } catch (error) {
      const message = getAuthErrorMessage(error);
      setFormError(message);
      Alert.alert('Sign in failed', message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email.trim()) {
      Alert.alert('Enter your email', 'Add the email for your account first.');
      return;
    }

    setIsSendingReset(true);
    setResetLinkSent(false);
    setFormError(null);
    try {
      await resetPasswordForEmail(email);
      setResetLinkSent(true);
      if (Platform.OS !== 'web') {
        Alert.alert('Check your email', PASSWORD_RESET_SENT_MESSAGE);
      }
    } catch (error) {
      const message = getAuthErrorMessage(error);
      setFormError(message);
      Alert.alert('Reset failed', message);
    } finally {
      setIsSendingReset(false);
    }
  };

  const formBusy = isSubmitting || isSendingReset;

  return (
    <OnboardingShell
      authSplit
      backgroundAccessory={<AuthHeroGlow />}
      footer={
        <View style={styles.footer}>
          <OnboardingButton
            label={isSubmitting ? 'Signing in…' : 'Sign in'}
            disabled={formBusy}
            onPress={handleSignIn}
          />
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
      <AuthScreenHeader
        title="Welcome back"
        subtitle="Sign in to pick up where you left off."
        onBack={() => router.back()}
      />
      <SocialAuthButtons
        disabled={formBusy}
        onApplePress={() => runSocialSignIn(signInWithApple)}
        onGooglePress={() => runSocialSignIn(signInWithGoogle)}
      />
      <View style={styles.form}>
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
            setResetLinkSent(false);
            setEmail(text);
          }}
          editable={!formBusy}
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
          editable={!formBusy}
        />
        <Pressable
          accessibilityRole="button"
          disabled={formBusy}
          onPress={handleForgotPassword}
          style={({ pressed, hovered }) => [
            styles.forgot,
            webHover(hovered, pressed, styles.forgotHovered, formBusy),
            pressed && !formBusy && { opacity: 0.75 },
          ]}>
          <Text style={styles.forgotText}>
            {isSendingReset ? 'Sending reset link…' : 'Forgot password?'}
          </Text>
        </Pressable>
      </View>
    </OnboardingShell>
  );
}
