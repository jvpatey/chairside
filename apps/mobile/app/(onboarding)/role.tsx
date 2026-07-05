import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, Platform, Text, View } from 'react-native';
import Animated, { useReducedMotion } from 'react-native-reanimated';
import { setProfileRole } from '@chairside/api';

import { AuthHeroGlow } from '@/components/onboarding/AuthHeroGlow';
import { AuthScreenHeader, AuthScreenTitle } from '@/components/onboarding/AuthScreenHeader';
import { OnboardingButton } from '@/components/onboarding/OnboardingButton';
import {
  AUTH_STAGGER,
  authCardDelay,
  enterFadeUp,
} from '@/components/onboarding/onboardingAnimations';
import { OnboardingShell } from '@/components/onboarding/OnboardingShell';
import { RoleCard } from '@/components/onboarding/RoleCard';
import { ChairsideBrandText } from '@/components/brand/ChairsideWordmark';
import { ROLE_OPTIONS } from '@/constants';
import { useAuth } from '@/contexts/AuthContext';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { useSignOut } from '@/hooks/useSignOut';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';
import { resolveAuthenticatedRoute } from '@/lib/resolveAuthenticatedRoute';
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
  const reducedMotion = useReducedMotion();
  const useTileCards = Platform.OS === 'web';
  const cardsRow = useTileCards && isWide;

  const styles = useThemedStyles(({ colors, spacing }) => ({
    cards: {
      flexDirection: cardsRow ? ('row' as const) : ('column' as const),
      gap: spacing.md,
    },
    cardWrap: cardsRow ? { flex: 1, minWidth: 0 } : {},
    trust: {
      fontSize: 14,
      lineHeight: 20,
      fontWeight: '600' as const,
      letterSpacing: 0.2,
      color: colors.labelTertiary,
      textAlign: 'center' as const,
      marginTop: useTileCards ? 0 : spacing.lg,
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
        const refreshed = await refreshProfile();
        await completeOnboarding(selectedRole);
        const { href } = await resolveAuthenticatedRoute({
          userId: session.user.id,
          profile: refreshed,
          refreshProfile,
        });
        router.replace(href);
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
      backgroundAccessory={<AuthHeroGlow />}
      footer={
        <View style={styles.footer}>
          <Animated.View entering={enterFadeUp(AUTH_STAGGER.primaryCta, reducedMotion)}>
            <OnboardingButton
              label={isSubmitting ? 'Saving…' : 'Continue'}
              disabled={selectedRole === null || isSubmitting || isSigningOut}
              onPress={handleContinue}
            />
          </Animated.View>
        </View>
      }>
      <Animated.View entering={enterFadeUp(AUTH_STAGGER.header, reducedMotion)}>
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
      </Animated.View>
      <View style={styles.cards}>
        {ROLE_OPTIONS.map((option, index) => (
          <Animated.View
            key={option.role}
            style={styles.cardWrap}
            entering={enterFadeUp(authCardDelay(index), reducedMotion)}>
            <RoleCard
              title={option.title}
              description={option.description}
              icon={option.icon}
              accent={option.role === 'clinic' ? 'primary' : 'secondary'}
              selected={selectedRole === option.role}
              onPress={() => setSelectedRole(option.role)}
              variant={useTileCards ? 'tile' : 'list'}
            />
          </Animated.View>
        ))}
      </View>
      <Animated.View entering={enterFadeUp(AUTH_STAGGER.switchRow, reducedMotion)}>
        <Text style={styles.trust}>{ROLE_TRUST_LINE}</Text>
      </Animated.View>
    </OnboardingShell>
  );
}
