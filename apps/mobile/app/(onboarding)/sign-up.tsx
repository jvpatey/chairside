import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { Alert, Pressable, Text, View } from 'react-native';

import { AuthField } from '@/components/onboarding/AuthField';
import { AuthPlaceholderNote } from '@/components/onboarding/AuthPlaceholderNote';
import { AuthScreenHeader } from '@/components/onboarding/AuthScreenHeader';
import { OnboardingButton } from '@/components/onboarding/OnboardingButton';
import { OnboardingShell } from '@/components/onboarding/OnboardingShell';
import { ROLE_OPTIONS } from '@/constants';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { useThemedStyles } from '@/theme';
import type { UserRole } from '@/types';

function parseRole(value: string | string[] | undefined): UserRole | null {
  const raw = Array.isArray(value) ? value[0] : value;
  return raw === 'worker' || raw === 'clinic' ? raw : null;
}

/**
 * New users: welcome → Get started → role → sign-up.
 *
 * TODO(auth): Replace handleCreateAccount stub with Supabase signUp.
 * On success, persist role on the user profile server-side, then:
 *   completeOnboarding(role) and router.replace('/(tabs)').
 */
export default function SignUpScreen() {
  const { role: roleParam } = useLocalSearchParams<{ role?: string }>();
  const role = parseRole(roleParam);
  const { completeOnboarding } = useOnboarding();
  const roleLabel = ROLE_OPTIONS.find((o) => o.role === role)?.title ?? 'your role';

  const styles = useThemedStyles(({ colors, spacing }) => ({
    form: {
      gap: spacing.md,
    },
    roleBadge: {
      alignSelf: 'flex-start',
      backgroundColor: colors.primarySubtle,
      borderRadius: 8,
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
      marginBottom: spacing.sm,
    },
    roleBadgeText: {
      fontSize: 13,
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

  const handleCreateAccount = async () => {
    if (!role) {
      router.replace('/(onboarding)/role');
      return;
    }

    Alert.alert(
      'Create account',
      'Connect Supabase signUp here. Until then, preview mode enters the app with your selected role.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Preview app',
          onPress: async () => {
            await completeOnboarding(role);
            router.replace('/(tabs)');
          },
        },
      ],
    );
  };

  if (!role) {
    return <Redirect href="/(onboarding)/role" />;
  }

  return (
    <OnboardingShell
      footer={
        <View style={styles.footer}>
          <OnboardingButton label="Create account" onPress={handleCreateAccount} />
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
      <View style={styles.roleBadge}>
        <Text style={styles.roleBadgeText}>Signing up to {roleLabel}</Text>
      </View>
      <View style={styles.form}>
        <AuthField label="Email" placeholder="you@example.com" keyboardType="email-address" />
        <AuthField label="Password" placeholder="Create a password" secureTextEntry />
        <AuthField
          label="Confirm password"
          placeholder="Confirm your password"
          secureTextEntry
        />
        <AuthPlaceholderNote message="Account creation will connect here once Supabase auth is added." />
      </View>
    </OnboardingShell>
  );
}
