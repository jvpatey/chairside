import { router } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert } from 'react-native';

import { useAuth } from '@/contexts/AuthContext';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { showConfirmActionSheet } from '@/lib/confirmActionSheet';

export function useSignOut() {
  const { signOut } = useAuth();
  const { resetOnboarding } = useOnboarding();
  const [isSigningOut, setIsSigningOut] = useState(false);

  const performSignOut = useCallback(async () => {
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

  const confirmSignOut = useCallback(() => {
    if (isSigningOut) return;

    showConfirmActionSheet({
      title: 'Sign out?',
      message: 'You will need to sign in again to access your account.',
      confirmLabel: 'Sign out',
      destructive: true,
      onConfirm: () => performSignOut(),
    });
  }, [isSigningOut, performSignOut]);

  return { isSigningOut, signOut: confirmSignOut };
}
