import { Text, View } from 'react-native';

import { DetailRow, RowDivider } from '@/components/clinic/DetailCard';
import { OnboardingButton } from '@/components/onboarding/OnboardingButton';
import { useThemedStyles } from '@/theme';

type AccountProfileViewProps = {
  clinicName: string | null;
  accountTypeLabel: string;
  isSigningOut: boolean;
  isDeleting: boolean;
  onSignOut: () => void;
  onDeleteAccount: () => void;
};

export function AccountProfileView({
  clinicName,
  accountTypeLabel,
  isSigningOut,
  isDeleting,
  onSignOut,
  onDeleteAccount,
}: AccountProfileViewProps) {
  const displayClinicName = clinicName?.trim() || 'Your clinic';

  const styles = useThemedStyles(({ colors, spacing, typography }) => ({
    wrap: {
      gap: spacing.lg,
    },
    card: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.separator,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
    },
    actions: {
      gap: spacing.sm,
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
      <View style={styles.card}>
        <DetailRow label="Clinic name" value={displayClinicName} layout="stacked" />
        <RowDivider />
        <DetailRow label="Account type" value={accountTypeLabel} layout="stacked" />
      </View>

      <View style={styles.actions}>
        <OnboardingButton
          label={isSigningOut ? 'Signing out…' : 'Sign out'}
          variant="secondary"
          disabled={isSigningOut || isDeleting}
          onPress={onSignOut}
        />
      </View>

      <View style={styles.dangerCard}>
        <Text style={styles.dangerTitle}>Delete account</Text>
        <Text style={styles.dangerBody}>
          Permanently remove your account, clinic profile, all postings, and associated
          applications. This action cannot be undone.
        </Text>
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
