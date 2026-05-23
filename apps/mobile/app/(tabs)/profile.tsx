import { Text, View } from 'react-native';

import { OnboardingButton } from '@/components/onboarding/OnboardingButton';
import { Screen } from '@/components/ui/Screen';
import { useAuth } from '@/contexts/AuthContext';
import { useSignOut } from '@/hooks/useSignOut';
import { useThemedStyles } from '@/theme';

export default function ProfileScreen() {
  const { profile } = useAuth();
  const { isSigningOut, signOut } = useSignOut();

  const styles = useThemedStyles(({ colors, spacing, typography }) => ({
    card: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.separator,
      padding: spacing.lg,
      gap: spacing.sm,
    },
    label: typography.subtitle,
    value: {
      ...typography.body,
      fontWeight: '600',
    },
    hint: typography.subtitle,
    actions: {
      marginTop: spacing.lg,
    },
  }));

  return (
    <Screen
      title="Profile"
      subtitle="Your professional profile and availability.">
      <View style={styles.card}>
        <Text style={styles.label}>Account type</Text>
        <Text style={styles.value}>
          {profile?.role === 'clinic' ? 'Clinic' : profile?.role === 'worker' ? 'Worker' : '—'}
        </Text>
        <Text style={styles.hint}>
          Full worker and clinic profile setup will be added in a follow-up.
        </Text>
      </View>
      <View style={styles.actions}>
        <OnboardingButton
          label={isSigningOut ? 'Signing out…' : 'Sign out'}
          variant="secondary"
          disabled={isSigningOut}
          onPress={signOut}
        />
      </View>
    </Screen>
  );
}
