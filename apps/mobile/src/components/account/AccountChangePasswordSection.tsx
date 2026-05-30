import { getAuthErrorMessage, resetPasswordForEmail, updatePassword } from '@chairside/api';
import type { User } from '@supabase/supabase-js';
import { useState } from 'react';
import { Alert, Text, View } from 'react-native';

import { AuthField } from '@/components/onboarding/AuthField';
import { OnboardingButton } from '@/components/onboarding/OnboardingButton';
import { userHasEmailPasswordLogin } from '@/lib/authProviders';
import { useThemedStyles } from '@/theme';

const MIN_PASSWORD_LENGTH = 6;

type AccountChangePasswordSectionProps = {
  user: User;
};

export function AccountChangePasswordSection({ user }: AccountChangePasswordSectionProps) {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [isSendingReset, setIsSendingReset] = useState(false);

  const styles = useThemedStyles(({ spacing, typography, colors }) => ({
    section: { gap: spacing.md },
    label: {
      fontSize: 13,
      fontWeight: '600',
      letterSpacing: 0.4,
      textTransform: 'uppercase',
      color: colors.labelSecondary,
      paddingHorizontal: spacing.xs,
    },
    hint: {
      ...typography.subtitle,
      fontSize: 14,
      lineHeight: 20,
      color: colors.labelSecondary,
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
  }));

  if (!userHasEmailPasswordLogin(user)) {
    return null;
  }

  const email = user.email?.trim() ?? '';
  const passwordsMatch = newPassword === confirmPassword;
  const meetsMinLength = newPassword.length >= MIN_PASSWORD_LENGTH;
  const confirmHasInput = confirmPassword.length > 0;
  const showMatchHint = confirmHasInput;
  const passwordsValid = meetsMinLength && passwordsMatch && confirmHasInput;
  const canSubmit = passwordsValid;

  const handleUpdatePassword = async () => {
    if (newPassword.length < MIN_PASSWORD_LENGTH) {
      Alert.alert(
        'Password too short',
        `Use at least ${MIN_PASSWORD_LENGTH} characters for your new password.`,
      );
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Passwords do not match', 'Make sure both password fields match.');
      return;
    }

    setIsUpdating(true);
    try {
      await updatePassword(newPassword);
      setNewPassword('');
      setConfirmPassword('');
      Alert.alert('Password updated', 'Your new password is ready to use next time you sign in.');
    } catch (error) {
      Alert.alert('Could not update password', getAuthErrorMessage(error));
    } finally {
      setIsUpdating(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      Alert.alert('No email on file', 'We could not find an email address for this account.');
      return;
    }

    setIsSendingReset(true);
    try {
      await resetPasswordForEmail(email);
      Alert.alert(
        'Check your email',
        'If an account exists for that address, you will receive a password reset link.',
      );
    } catch (error) {
      Alert.alert('Reset failed', getAuthErrorMessage(error));
    } finally {
      setIsSendingReset(false);
    }
  };

  const busy = isUpdating || isSendingReset;

  return (
    <View style={styles.section}>
      <Text style={styles.label}>Password</Text>
      <AuthField
        label="New password"
        placeholder="At least 6 characters"
        value={newPassword}
        onChangeText={setNewPassword}
        secureTextEntry
        enablePasswordVisibilityToggle
        validated={meetsMinLength}
        editable={!busy}
      />
      <AuthField
        label="Confirm new password"
        placeholder="Re-enter your new password"
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        secureTextEntry
        enablePasswordVisibilityToggle
        validated={passwordsValid}
        invalid={confirmHasInput && !passwordsMatch}
        editable={!busy}
      />
      {showMatchHint ? (
        <Text
          style={[
            styles.matchHint,
            passwordsMatch ? styles.matchHintSuccess : styles.matchHintError,
          ]}>
          {passwordsMatch ? 'Passwords match' : 'Passwords do not match'}
        </Text>
      ) : null}
      <OnboardingButton
        label={isUpdating ? 'Updating…' : 'Update password'}
        disabled={busy || !canSubmit}
        onPress={() => void handleUpdatePassword()}
      />
      <Text style={styles.hint}>
        Choose a new password while you are signed in, or send a reset link to your email if you
        do not remember your current one.
      </Text>
      <OnboardingButton
        label={isSendingReset ? 'Sending…' : 'Send password reset link'}
        variant="ghost"
        disabled={busy || !email}
        onPress={() => void handleForgotPassword()}
      />
    </View>
  );
}
