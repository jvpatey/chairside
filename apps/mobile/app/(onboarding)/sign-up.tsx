import {
  getAuthErrorMessage,
  getProfile,
  getSupabaseClient,
  setProfileRole,
  signInWithApple,
  signInWithGoogle,
  signUpWithEmail,
} from '@chairside/api';
import { Redirect, router, useLocalSearchParams } from 'expo-router';
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
import { getHomeRouteForRole } from '@/lib/routing';
import { useThemedStyles } from '@/theme';
import type { UserRole } from '@/types';

function parseRole(value: string | string[] | undefined): UserRole | null {
  const raw = Array.isArray(value) ? value[0] : value;
  return raw === 'worker' || raw === 'clinic' ? raw : null;
}

export default function SignUpScreen() {
  const { role: roleParam } = useLocalSearchParams<{ role?: string }>();
  const role = parseRole(roleParam);
  const { refreshProfile } = useAuth();
  const { completeOnboarding } = useOnboarding();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const styles = useThemedStyles(({ colors, spacing }) => ({
    form: {
      gap: spacing.md,
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
      const {
        data: { session },
      } = await getSupabaseClient().auth.getSession();
      const profile = session?.user ? await getProfile(session.user.id) : null;

      if (!profile?.role && role && profile?.id) {
        await setProfileRole(profile.id, role);
        await refreshProfile();
        await completeOnboarding(role);
        router.replace(getHomeRouteForRole(role));
        return;
      }

      await handleAuthSuccess(refreshProfile, completeOnboarding);
    } catch (error) {
      const message = getAuthErrorMessage(error);
      if (message !== 'Sign in was cancelled.') {
        Alert.alert('Sign up failed', message);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateAccount = async () => {
    if (!role) {
      router.replace('/(onboarding)/role');
      return;
    }

    if (isSubmitting) return;

    if (!email.trim() || !password || !confirmPassword) {
      Alert.alert('Missing information', 'Fill in all fields to create your account.');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Passwords do not match', 'Make sure both password fields match.');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Password too short', 'Use at least 6 characters.');
      return;
    }

    setIsSubmitting(true);
    try {
      const { session, user } = await signUpWithEmail(email, password, role);

      if (!session) {
        Alert.alert(
          'Confirm your email',
          'We sent a confirmation link. Open it to finish setting up your account, then sign in.',
        );
        router.replace('/(onboarding)/sign-in');
        return;
      }

      if (user) {
        await handleAuthSuccess(refreshProfile, completeOnboarding);
      }
    } catch (error) {
      Alert.alert('Create account failed', getAuthErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!role) {
    return <Redirect href="/(onboarding)/role" />;
  }

  return (
    <OnboardingShell
      footer={
        <View style={styles.footer}>
          <OnboardingButton
            label={isSubmitting ? 'Creating account…' : 'Create account'}
            disabled={isSubmitting}
            onPress={handleCreateAccount}
          />
          <View style={styles.switchRow}>
            <Text style={styles.switchMuted}>Already have an account?</Text>
            <Pressable
              accessibilityRole="link"
              onPress={() => router.replace('/(onboarding)/sign-in')}>
              <Text style={styles.switchLink}>Sign in</Text>
            </Pressable>
          </View>
        </View>
      }>
      <AuthScreenHeader
        title="Create your account"
        subtitle="A few details to get you into Chairside."
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
          placeholder="Create a password"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
          editable={!isSubmitting}
        />
        <AuthField
          label="Confirm password"
          placeholder="Confirm your password"
          secureTextEntry
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          editable={!isSubmitting}
        />
      </View>
    </OnboardingShell>
  );
}
