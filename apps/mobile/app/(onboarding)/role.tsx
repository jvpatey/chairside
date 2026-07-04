import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, Platform, Text, View } from 'react-native';
import { setProfileRole } from '@chairside/api';

import { AuthScreenHeader, AuthScreenTitle } from '@/components/onboarding/AuthScreenHeader';
import { OnboardingButton } from '@/components/onboarding/OnboardingButton';
import { OnboardingShell } from '@/components/onboarding/OnboardingShell';
import { RoleCard } from '@/components/onboarding/RoleCard';
import { ChairsideBrandText } from '@/components/brand/ChairsideWordmark';
import { ROLE_OPTIONS } from '@/constants';
import { useAuth } from '@/contexts/AuthContext';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { useSignOut } from '@/hooks/useSignOut';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';
import { getHomeRouteForRole } from '@/lib/routing';
import { useThemedStyles } from '@/theme';
import type { UserRole } from '@/types';

const ROLE_TRUST_LINE = 'Same-day fill-ins · Apply in one tap · Start free';

export default function RoleScreen() {
  const { fromAuth } = useLocalSearchParams<{ fromAuth?: string }>();
  const { session, refreshProfile } = useAuth();
  const { completeOnboarding } = useOnboarding();
  const { isSigningOut, signOut } = useSignOut();
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isPostAuth = fromAuth === '1';
  const { isWide } = useResponsiveLayout();
  const useTileCards = Platform.OS === 'web';
  const cardsRow = useTileCards && isWide;

  const styles = useThemedStyles(({ colors, spacing }) => ({
    cards: {
      flexDirection: cardsRow ? ('row' as const) : ('column' as const),
      gap: spacing.md,
    },
    trust: {
      fontSize: 14,
      lineHeight: 20,
      fontWeight: '600' as const,
      letterSpacing: 0.2,
      color: colors.labelTertiary,
      textAlign: 'center' as const,
    },
    footer: {
      gap: spacing.md,
    },
  }));

  const handleBack = async () => {
    if (isPostAuth) {
      if (isSubmitting || isSigningOut) return;
      await signOut();
      return;
    }

    if (router.canGoBack()) {
      router.back();
      return;
    }

    router.replace('/(onboarding)/welcome');
  };

  const handleContinue = async () => {
    if (!selectedRole || isSubmitting) return;

    if (isPostAuth && session?.user) {
      setIsSubmitting(true);
      try {
        await setProfileRole(session.user.id, selectedRole);
        await refreshProfile();
        await completeOnboarding(selectedRole);
        router.replace(getHomeRouteForRole(selectedRole));
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
      webLayout="centeredDecision"
      footer={
        <View style={styles.footer}>
          <OnboardingButton
            label={isSubmitting ? 'Saving…' : 'Continue'}
            disabled={selectedRole === null || isSubmitting || isSigningOut}
            onPress={handleContinue}
          />
        </View>
      }>
      <AuthScreenHeader
        title={
          <AuthScreenTitle>
            How will you use <ChairsideBrandText />?
          </AuthScreenTitle>
        }
        subtitle={
          isPostAuth
            ? 'Choose worker or clinic — then set up your profile.'
            : 'Choose the path that fits you.'
        }
        backLabel={isPostAuth ? (isSigningOut ? 'Signing out…' : 'Sign out') : 'Back'}
        onBack={handleBack}
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
            variant={useTileCards ? 'tile' : 'list'}
          />
        ))}
      </View>
      {useTileCards ? <Text style={styles.trust}>{ROLE_TRUST_LINE}</Text> : null}
    </OnboardingShell>
  );
}
