import { deleteAccount } from '@chairside/api';
import { router } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, Platform } from 'react-native';

import { useAuth } from '@/contexts/AuthContext';
import { useOnboarding } from '@/contexts/OnboardingContext';
import {
  ACCOUNT_DELETION_FINAL_CONFIRM,
  ACCOUNT_DELETION_SUMMARY,
} from '@/lib/accountDeletionCopy';
import { showConfirmActionSheet } from '@/lib/confirmActionSheet';

function showDeleteAccountError(message: string) {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    window.alert(`Could not delete account\n\n${message}`);
    return;
  }
  Alert.alert('Could not delete account', message);
}

export function useDeleteAccount() {
  const { signOut } = useAuth();
  const { resetOnboarding } = useOnboarding();
  const [isDeleting, setIsDeleting] = useState(false);

  const performDelete = useCallback(async () => {
    if (isDeleting) return;

    setIsDeleting(true);

    try {
      await deleteAccount();
    } catch (error) {
      showDeleteAccountError(
        error instanceof Error ? error.message : 'Please try again or contact support.',
      );
      setIsDeleting(false);
      return;
    }

    // The account is gone server-side, so local teardown is best-effort from
    // here — surfacing a failure would wrongly imply the deletion didn't happen.
    router.replace('/(onboarding)/welcome');

    try {
      await signOut();
      await resetOnboarding();
    } catch {
      // Local cleanup only; the account has already been deleted.
    } finally {
      setIsDeleting(false);
    }
  }, [isDeleting, resetOnboarding, signOut]);

  const confirmDeleteAccount = useCallback(() => {
    if (isDeleting) return;

    showConfirmActionSheet({
      title: 'Delete your account?',
      message: ACCOUNT_DELETION_SUMMARY,
      confirmLabel: 'Continue',
      destructive: true,
      onConfirm: () => {
        showConfirmActionSheet({
          title: 'Are you sure?',
          message: ACCOUNT_DELETION_FINAL_CONFIRM,
          confirmLabel: 'Delete account',
          destructive: true,
          onConfirm: () => {
            void performDelete();
          },
        });
      },
    });
  }, [isDeleting, performDelete]);

  return { isDeleting, confirmDeleteAccount };
}
