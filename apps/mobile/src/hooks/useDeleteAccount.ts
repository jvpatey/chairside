import { deleteAccount } from '@chairside/api';
import { router } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert } from 'react-native';

import { useAuth } from '@/contexts/AuthContext';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { showConfirmActionSheet } from '@/lib/confirmActionSheet';

const DELETE_SUMMARY =
  'This will permanently delete your account and login. Your applications, messages, and postings will stay visible to others as historical records marked as no longer on Chairside. This cannot be undone.';

export function useDeleteAccount() {
  const { signOut } = useAuth();
  const { resetOnboarding } = useOnboarding();
  const [isDeleting, setIsDeleting] = useState(false);

  const performDelete = useCallback(async () => {
    if (isDeleting) return;

    setIsDeleting(true);
    try {
      await deleteAccount();
      await signOut();
      await resetOnboarding();
      router.replace('/(onboarding)/welcome');
    } catch (error) {
      Alert.alert(
        'Could not delete account',
        error instanceof Error ? error.message : 'Please try again or contact support.',
      );
    } finally {
      setIsDeleting(false);
    }
  }, [isDeleting, resetOnboarding, signOut]);

  const confirmDeleteAccount = useCallback(() => {
    if (isDeleting) return;

    showConfirmActionSheet({
      title: 'Delete your account?',
      message: DELETE_SUMMARY,
      confirmLabel: 'Continue',
      destructive: true,
      onConfirm: () => {
        showConfirmActionSheet({
          title: 'Are you sure?',
          message: 'Your account and all associated data will be permanently removed.',
          confirmLabel: 'Delete account',
          destructive: true,
          onConfirm: () => performDelete(),
        });
      },
    });
  }, [isDeleting, performDelete]);

  return { isDeleting, confirmDeleteAccount };
}
