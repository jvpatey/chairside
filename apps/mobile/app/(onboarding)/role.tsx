import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, View } from 'react-native';
import { setProfileRole } from '@chairside/api';

import { AuthScreenHeader } from '@/components/onboarding/AuthScreenHeader';
import { OnboardingButton } from '@/components/onboarding/OnboardingButton';
import { OnboardingShell } from '@/components/onboarding/OnboardingShell';
import { RoleCard } from '@/components/onboarding/RoleCard';
import { ROLE_OPTIONS } from '@/constants';
import { useAuth } from '@/contexts/AuthContext';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { useThemedStyles } from '@/theme';
import type { UserRole } from '@/types';

export default function RoleScreen() {
  const { fromAuth } = useLocalSearchParams<{ fromAuth?: string }>();
  const { session } = useAuth();
  const { completeOnboarding } = useOnboarding();
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const styles = useThemedStyles(({ spacing }) => ({
    cards: {
      gap: spacing.md,
      marginTop: spacing.sm,
    },
    footer: {
      gap: spacing.md,
      marginTop: spacing.lg,
    },
  }));

  const handleContinue = async () => {
    if (!selectedRole || isSubmitting) return;

    if (fromAuth === '1' && session?.user) {
      setIsSubmitting(true);
      try {
        await setProfileRole(session.user.id, selectedRole);
        await completeOnboarding(selectedRole);
        router.replace('/(tabs)');
      } catch (error) {
        Alert.alert(
          'Could not save role',
          error instanceof Error ? error.message : 'Please try again.',
        );
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    router.push({
      pathname: '/(onboarding)/sign-up',
      params: { role: selectedRole },
    });
  };

  return (
    <OnboardingShell
      footer={
        <View style={styles.footer}>
          <OnboardingButton
            label={isSubmitting ? 'Saving…' : 'Continue'}
            disabled={selectedRole === null || isSubmitting}
            onPress={handleContinue}
          />
        </View>
      }>
      <AuthScreenHeader
        title="How will you use Chairside?"
        subtitle={
          fromAuth === '1'
            ? 'One last step — choose worker or clinic.'
            : 'Choose the path that fits you.'
        }
        onBack={() => router.back()}
      />
      <View style={styles.cards}>
        {ROLE_OPTIONS.map((option) => (
          <RoleCard
            key={option.role}
            title={option.title}
            description={option.description}
            icon={option.icon}
            selected={selectedRole === option.role}
            onPress={() => setSelectedRole(option.role)}
          />
        ))}
      </View>
    </OnboardingShell>
  );
}
