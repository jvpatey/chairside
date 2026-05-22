import { router } from 'expo-router';
import { Alert, Pressable, Text, View } from 'react-native';

import { AuthField } from '@/components/onboarding/AuthField';
import { AuthPlaceholderNote } from '@/components/onboarding/AuthPlaceholderNote';
import { AuthScreenHeader } from '@/components/onboarding/AuthScreenHeader';
import { OnboardingButton } from '@/components/onboarding/OnboardingButton';
import { OnboardingShell } from '@/components/onboarding/OnboardingShell';
import { useThemedStyles } from '@/theme';

/**
 * Returning users land here from welcome → Sign in.
 *
 * TODO(auth): Wire Supabase signInWithPassword (or magic link). On success:
 *   - Load profile.role from the server (do not ask on this screen).
 *   - Mark onboarding complete and router.replace('/(tabs)').
 */
export default function SignInScreen() {
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

  const handleSignIn = () => {
    Alert.alert(
      'Sign in',
      'Connect Supabase auth in app/(onboarding)/sign-in.tsx, then navigate to tabs on session success.',
    );
  };

  const handleForgotPassword = () => {
    Alert.alert(
      'Reset password',
      'Wire Supabase resetPasswordForEmail here when auth is ready.',
    );
  };

  return (
    <OnboardingShell
      footer={
        <View style={styles.footer}>
          <OnboardingButton label="Sign in" onPress={handleSignIn} />
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
      <View style={styles.form}>
        <AuthField
          label="Email"
          placeholder="you@example.com"
          keyboardType="email-address"
        />
        <AuthField label="Password" placeholder="Your password" secureTextEntry />
        <Pressable
          accessibilityRole="button"
          onPress={handleForgotPassword}
          style={styles.forgot}>
          <Text style={styles.forgotText}>Forgot password?</Text>
        </Pressable>
        <AuthPlaceholderNote />
      </View>
    </OnboardingShell>
  );
}
