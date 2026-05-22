import {
  getAuthErrorMessage,
  resetPasswordForEmail,
  signInWithApple,
  signInWithEmail,
  signInWithGoogle,
} from '@chairside/api';
import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, Text, View } from 'react-native';

import { AuthField } from '@/components/onboarding/AuthField';
import { AuthScreenHeader } from '@/components/onboarding/AuthScreenHeader';
import { OnboardingButton } from '@/components/onboarding/OnboardingButton';
import { OnboardingShell } from '@/components/onboarding/OnboardingShell';
import { SocialAuthButtons } from '@/components/onboarding/SocialAuthButtons';
import { useAuth } from '@/contexts/AuthContext';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { handleAuthSuccess } from '@/lib/handleAuthSuccess';
import { useThemedStyles } from '@/theme';

export default function SignInScreen() {
  const { refreshProfile } = useAuth();
  const { completeOnboarding } = useOnboarding();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const styles = useThemedStyles(({ colors, spacing }) => ({
    form: {
      gap: spacing.md,
    },
    forgot: {
      alignSelf: 'flex-end',
      paddingVertical: spacing.xs,
      minHeight: 44,
      justifyContent: 'center',
    },
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
    switchLink: {
      fontSize: 15,
      fontWeight: '600',
      color: colors.primary,
    },
  }));

  const runSocialSignIn = async (action: () => Promise<unknown>) => {
    if (isSubmitting) return;

    setIsSubmitting(true);
    try {
      await action();
      await handleAuthSuccess(refreshProfile, completeOnboarding);
    } catch (error) {
      const message = getAuthErrorMessage(error);
      if (message !== 'Sign in was cancelled.') {
        Alert.alert('Sign in failed', message);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSignIn = async () => {
    if (isSubmitting) return;

    if (!email.trim() || !password) {
      Alert.alert('Missing information', 'Enter your email and password.');
      return;
    }

    setIsSubmitting(true);
    try {
      await signInWithEmail(email, password);
      await handleAuthSuccess(refreshProfile, completeOnboarding);
    } catch (error) {
      Alert.alert('Sign in failed', getAuthErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email.trim()) {
      Alert.alert('Enter your email', 'Add the email for your account first.');
      return;
    }

    try {
      await resetPasswordForEmail(email);
      Alert.alert(
        'Check your email',
        'If an account exists for that address, you will receive a password reset link.',
      );
    } catch (error) {
      Alert.alert('Reset failed', getAuthErrorMessage(error));
    }
  };

  return (
    <OnboardingShell
      footer={
        <View style={styles.footer}>
          <OnboardingButton
            label={isSubmitting ? 'Signing in…' : 'Sign in'}
            disabled={isSubmitting}
            onPress={handleSignIn}
          />
          <View style={styles.switchRow}>
            <Text style={styles.switchMuted}>New to Chairside?</Text>
            <Pressable
              accessibilityRole="link"
              onPress={() => router.replace('/(onboarding)/role')}>
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
        disabled={isSubmitting}
        onApplePress={() => runSocialSignIn(signInWithApple)}
        onGooglePress={() => runSocialSignIn(signInWithGoogle)}
      />
      <View style={styles.form}>
        <AuthField
          label="Email"
          placeholder="you@example.com"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
          editable={!isSubmitting}
        />
        <AuthField
          label="Password"
          placeholder="Your password"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
          editable={!isSubmitting}
        />
        <Pressable
          accessibilityRole="button"
          onPress={handleForgotPassword}
          style={styles.forgot}>
          <Text style={styles.forgotText}>Forgot password?</Text>
        </Pressable>
      </View>
    </OnboardingShell>
  );
}
