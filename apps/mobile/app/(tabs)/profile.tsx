import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, Text, View } from 'react-native';

import { OnboardingButton } from '@/components/onboarding/OnboardingButton';
import { Screen } from '@/components/ui/Screen';
import { useAuth } from '@/contexts/AuthContext';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { useThemedStyles } from '@/theme';

export default function ProfileScreen() {
  const { profile, signOut } = useAuth();
  const { resetOnboarding } = useOnboarding();
  const [isSigningOut, setIsSigningOut] = useState(false);

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

  const handleSignOut = async () => {
    if (isSigningOut) return;

    setIsSigningOut(true);
    try {
      await signOut();
      await resetOnboarding();
      router.replace('/(onboarding)/welcome');
    } catch (error) {
      Alert.alert(
        'Sign out failed',
        error instanceof Error ? error.message : 'Please try again.',
      );
    } finally {
      setIsSigningOut(false);
    }
  };

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
          onPress={handleSignOut}
        />
      </View>
    </Screen>
  );
}
