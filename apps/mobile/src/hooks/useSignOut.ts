import { router } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert } from 'react-native';

import { useAuth } from '@/contexts/AuthContext';
import { useOnboarding } from '@/contexts/OnboardingContext';

export function useSignOut() {
  const { signOut } = useAuth();
  const { resetOnboarding } = useOnboarding();
  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleSignOut = useCallback(async () => {
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
  }, [isSigningOut, resetOnboarding, signOut]);

  return { isSigningOut, signOut: handleSignOut };
}
