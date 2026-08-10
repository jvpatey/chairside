import { router, useLocalSearchParams, Redirect } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Platform, View } from 'react-native';
import Animated, { useReducedMotion } from 'react-native-reanimated';
import { setProfileRole } from '@chairside/api';

import { AuthScreenHeader } from '@/components/onboarding/AuthScreenHeader';
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
import { useClinicProfile } from '@/contexts/ClinicProfileContext';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { useWorkerProfile } from '@/contexts/WorkerProfileContext';
import { useSignOut } from '@/hooks/useSignOut';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';
import { getChangeRoleGateDecision } from '@/lib/changeRoleGate';
import { resolveAuthenticatedRoute } from '@/lib/resolveAuthenticatedRoute';
import { useThemedStyles } from '@/theme';
import type { UserRole } from '@/types';

export default function RoleScreen() {
  const { fromAuth, changeRole } = useLocalSearchParams<{
    fromAuth?: string;
    changeRole?: string;
  }>();
  const { session, profile, refreshProfile } = useAuth();
  const { workerProfile, isWorkerProfileReady } = useWorkerProfile();
  const { clinicProfile, isClinicProfileReady } = useClinicProfile();
  const { completeOnboarding } = useOnboarding();
  const { isSigningOut, signOut } = useSignOut();
  const isPostAuth = fromAuth === '1';
  const isChangingRole = changeRole === '1';
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(
    isChangingRole && (profile?.role === 'worker' || profile?.role === 'clinic')
      ? profile.role
      : null,
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { isWide } = useResponsiveLayout();
  const reducedMotion = useReducedMotion();
  const useTileCards = Platform.OS === 'web';
  const cardsRow = useTileCards && isWide;

  const styles = useThemedStyles(({ spacing }) => ({
    stack: {
      gap: spacing.lg,
    },
    cards: {
      flexDirection: cardsRow ? ('row' as const) : ('column' as const),
      gap: spacing.md,
    },
    cardWrap: cardsRow ? { flex: 1, minWidth: 0 } : {},
    footer: {
      gap: spacing.md,
    },
  }));

  useEffect(() => {
    if (!isChangingRole) return;
    if (profile?.role === 'worker' || profile?.role === 'clinic') {
      setSelectedRole((current) => current ?? profile.role);
    }
  }, [isChangingRole, profile?.role]);

  const changeRoleGate = isChangingRole
    ? getChangeRoleGateDecision({
        profile,
        workerProfile,
        clinicProfile,
        isWorkerProfileReady,
        isClinicProfileReady,
      })
    : null;

  if (changeRoleGate?.type === 'loading') {
    return null;
  }

  if (changeRoleGate?.type === 'redirect') {
    return <Redirect href={changeRoleGate.href} />;
  }

  const handleBack = async () => {
    if (isPostAuth || isChangingRole) {
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

    if ((isPostAuth || isChangingRole) && session?.user) {
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

  const subtitle = isChangingRole
    ? 'You can change this if you picked the wrong path.'
    : isPostAuth
      ? 'Choose worker or clinic — then set up your profile.'
      : 'Choose the path that fits you.';

  return (
    <OnboardingShell
      webLayout="centeredDecision"
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
      <View style={styles.stack}>
        <Animated.View entering={enterFadeUp(AUTH_STAGGER.header, reducedMotion)}>
          <AuthScreenHeader
            title={
              <>
                How will you use <ChairsideBrandText />?
              </>
            }
            subtitle={subtitle}
            backLabel={
              isPostAuth || isChangingRole ? (isSigningOut ? 'Signing out…' : 'Sign out') : 'Back'
            }
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
      </View>
    </OnboardingShell>
  );
}
