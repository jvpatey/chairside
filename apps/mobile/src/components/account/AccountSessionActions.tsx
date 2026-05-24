import { Text, View } from 'react-native';

import { OnboardingButton } from '@/components/onboarding/OnboardingButton';
import { useThemedStyles } from '@/theme';

type AccountSessionActionsProps = {
  isSigningOut: boolean;
  isDeleting: boolean;
  onSignOut: () => void;
  onDeleteAccount: () => void;
  deleteDescription: string;
};

export function AccountSessionActions({
  isSigningOut,
  isDeleting,
  onSignOut,
  onDeleteAccount,
  deleteDescription,
}: AccountSessionActionsProps) {
  const styles = useThemedStyles(({ colors, spacing, typography }) => ({
    wrap: {
      gap: spacing.md,
    },
    dangerCard: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: `${colors.destructive}40`,
      padding: spacing.lg,
      gap: spacing.md,
    },
    dangerTitle: {
      fontSize: 15,
      fontWeight: '600',
      color: colors.destructive,
    },
    dangerBody: {
      ...typography.subtitle,
      fontSize: 14,
      lineHeight: 20,
    },
  }));

  return (
    <View style={styles.wrap}>
      <OnboardingButton
        label={isSigningOut ? 'Signing out…' : 'Sign out'}
        variant="secondary"
        disabled={isSigningOut || isDeleting}
        onPress={onSignOut}
      />

      <View style={styles.dangerCard}>
        <Text style={styles.dangerTitle}>Delete account</Text>
        <Text style={styles.dangerBody}>{deleteDescription}</Text>
        <OnboardingButton
          label={isDeleting ? 'Deleting account…' : 'Delete account'}
          variant="destructive"
          disabled={isSigningOut || isDeleting}
          onPress={onDeleteAccount}
        />
      </View>
    </View>
  );
}
