import { getAuthErrorMessage, updatePassword } from '@chairside/api';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Text, View } from 'react-native';

import { AuthField } from '@/components/onboarding/AuthField';
import { AuthScreenHeader } from '@/components/onboarding/AuthScreenHeader';
import { OnboardingButton } from '@/components/onboarding/OnboardingButton';
import { OnboardingShell } from '@/components/onboarding/OnboardingShell';
import { useAuth } from '@/contexts/AuthContext';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { handleAuthSuccess } from '@/lib/handleAuthSuccess';
import { useThemedStyles } from '@/theme';

const MIN_PASSWORD_LENGTH = 6;

export default function ResetPasswordScreen() {
  const { session, refreshProfile } = useAuth();
  const { completeOnboarding } = useOnboarding();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

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
  }));

  useEffect(() => {
    if (!session?.user) {
      router.replace('/(onboarding)/sign-in');
    }
  }, [session?.user]);

  const passwordsMatch = password === confirmPassword;
  const meetsMinLength = password.length >= MIN_PASSWORD_LENGTH;
  const confirmHasInput = confirmPassword.length > 0;
  const canSubmit = meetsMinLength && passwordsMatch && confirmHasInput;

  const handleSubmit = async () => {
    if (isSubmitting || !session?.user) return;

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
      await handleAuthSuccess(refreshProfile, completeOnboarding, session.user.id);
    } catch (error) {
      Alert.alert('Could not update password', getAuthErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!session?.user) {
    return null;
  }

  return (
    <OnboardingShell
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
