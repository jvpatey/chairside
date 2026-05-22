import { router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { AuthScreenHeader } from '@/components/onboarding/AuthScreenHeader';
import { OnboardingButton } from '@/components/onboarding/OnboardingButton';
import { OnboardingShell } from '@/components/onboarding/OnboardingShell';
import { RoleCard } from '@/components/onboarding/RoleCard';
import { ROLE_OPTIONS } from '@/constants';
import { useThemedStyles } from '@/theme';
import type { UserRole } from '@/types';

export default function RoleScreen() {
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);

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

  const handleContinue = () => {
    if (!selectedRole) return;
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
            label="Continue"
            disabled={selectedRole === null}
            onPress={handleContinue}
          />
        </View>
      }>
      <AuthScreenHeader
        title="How will you use Chairside?"
        subtitle="Choose the path that fits you. You can update this later in settings."
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
