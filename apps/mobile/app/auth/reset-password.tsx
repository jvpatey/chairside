import { getAuthErrorMessage, getSupabaseClient, updatePassword } from '@chairside/api';
import type { User } from '@supabase/supabase-js';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Platform, Text, View } from 'react-native';

import { AuthField } from '@/components/onboarding/AuthField';
import { AuthScreenHeader } from '@/components/onboarding/AuthScreenHeader';
import { OnboardingButton } from '@/components/onboarding/OnboardingButton';
import { OnboardingShell } from '@/components/onboarding/OnboardingShell';
import { PageLoadingSpinner } from '@/components/ui/PageLoadingState';
import { useAuth } from '@/contexts/AuthContext';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { handleAuthSuccess } from '@/lib/handleAuthSuccess';
import { useThemedStyles } from '@/theme';

const MIN_PASSWORD_LENGTH = 6;
const SESSION_HYDRATION_MS = 1500;

export default function ResetPasswordScreen() {
  const { session, refreshProfile, clearPasswordRecoveryPending } = useAuth();
  const { completeOnboarding } = useOnboarding();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sessionChecked, setSessionChecked] = useState(false);
  const [recoveryUser, setRecoveryUser] = useState<User | null>(null);
  const [linkExpired, setLinkExpired] = useState(false);

  const styles = useThemedStyles(({ spacing, colors, typography }) => ({
    form: {
      gap: spacing.md,
    },
    footer: {
      gap: spacing.md,
      marginTop: spacing.lg,
    },
    matchHint: {
      fontSize: 13,
      lineHeight: 18,
      paddingHorizontal: spacing.xs,
    },
    matchHintSuccess: {
      color: colors.success,
      fontWeight: '500',
    },
    matchHintError: {
      color: colors.destructive,
      fontWeight: '500',
    },
    hint: typography.subtitle,
    expiredCopy: {
      ...typography.subtitle,
      fontSize: 15,
      lineHeight: 22,
    },
  }));

  useEffect(() => {
    let cancelled = false;

    async function hydrateRecoverySession() {
      const {
        data: { session: activeSession },
      } = await getSupabaseClient().auth.getSession();
      if (cancelled) return;

      setRecoveryUser(activeSession?.user ?? null);
      setSessionChecked(true);
    }

    void hydrateRecoverySession();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (session?.user) {
      setRecoveryUser(session.user);
    }
  }, [session?.user]);

  const user = session?.user ?? recoveryUser;

  useEffect(() => {
    if (!sessionChecked || user) return;

    const timeoutId = setTimeout(() => {
      setLinkExpired(true);
      void clearPasswordRecoveryPending();
    }, SESSION_HYDRATION_MS);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [clearPasswordRecoveryPending, sessionChecked, user]);

  const passwordsMatch = password === confirmPassword;
  const meetsMinLength = password.length >= MIN_PASSWORD_LENGTH;
  const confirmHasInput = confirmPassword.length > 0;
  const canSubmit = meetsMinLength && passwordsMatch && confirmHasInput;

  const handleSubmit = async () => {
    if (isSubmitting || !user) return;

    if (password.length < MIN_PASSWORD_LENGTH) {
      Alert.alert(
        'Password too short',
        `Use at least ${MIN_PASSWORD_LENGTH} characters for your new password.`,
      );
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Passwords do not match', 'Make sure both password fields match.');
      return;
    }

    setIsSubmitting(true);
    try {
      await updatePassword(password);
      await clearPasswordRecoveryPending();
      if (Platform.OS !== 'web') {
        Alert.alert('Password updated', 'Your new password is ready to use.');
      }
      await handleAuthSuccess(refreshProfile, completeOnboarding, user.id);
    } catch (error) {
      Alert.alert('Could not update password', getAuthErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReturnToSignIn = () => {
    void clearPasswordRecoveryPending();
    router.replace('/(onboarding)/sign-in');
  };

  if (!sessionChecked || (!user && !linkExpired)) {
    return <PageLoadingSpinner message="Verifying reset link…" />;
  }

  if (linkExpired && !user) {
    return (
      <OnboardingShell
        atmosphere="form"
        footer={
          <View style={styles.footer}>
            <OnboardingButton label="Back to sign in" onPress={handleReturnToSignIn} />
          </View>
        }>
        <AuthScreenHeader
          title="Reset link expired"
          subtitle="This password reset link is invalid or has expired. Request a new one from the sign-in screen."
        />
        <Text style={styles.expiredCopy}>
          If you already updated your password, try signing in with your new password.
        </Text>
      </OnboardingShell>
    );
  }

  return (
    <OnboardingShell
      atmosphere="form"
      footer={
        <View style={styles.footer}>
          <OnboardingButton
            label={isSubmitting ? 'Saving…' : 'Save password'}
            disabled={isSubmitting || !canSubmit}
            onPress={() => void handleSubmit()}
          />
        </View>
      }>
      <AuthScreenHeader
        title="Choose a new password"
        subtitle="Your reset link worked. Set a new password to finish signing in."
      />
      <View style={styles.form}>
        <AuthField
          label="New password"
          placeholder="At least 6 characters"
          secureTextEntry
          enablePasswordVisibilityToggle
          value={password}
          onChangeText={setPassword}
          editable={!isSubmitting}
          validated={meetsMinLength}
        />
        <AuthField
          label="Confirm password"
          placeholder="Re-enter your new password"
          secureTextEntry
          enablePasswordVisibilityToggle
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          editable={!isSubmitting}
          validated={canSubmit}
          invalid={confirmHasInput && !passwordsMatch}
        />
        {confirmHasInput ? (
          <Text
            style={[
              styles.matchHint,
              passwordsMatch ? styles.matchHintSuccess : styles.matchHintError,
            ]}>
            {passwordsMatch ? 'Passwords match' : 'Passwords do not match'}
          </Text>
        ) : (
          <Text style={styles.hint}>Use a password you have not used here before.</Text>
        )}
      </View>
    </OnboardingShell>
  );
}
