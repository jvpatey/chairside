import { View } from 'react-native';

import { AccountSessionActions } from '@/components/account/AccountSessionActions';
import { DetailRow, RowDivider } from '@/components/clinic/DetailCard';
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

  const styles = useThemedStyles(({ colors, spacing }) => ({
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
  }));

  return (
    <View style={styles.wrap}>
      <View style={styles.card}>
        <DetailRow label="Clinic name" value={displayClinicName} layout="stacked" />
        <RowDivider />
        <DetailRow label="Account type" value={accountTypeLabel} layout="stacked" />
      </View>

      <AccountSessionActions
        isSigningOut={isSigningOut}
        isDeleting={isDeleting}
        onSignOut={onSignOut}
        onDeleteAccount={onDeleteAccount}
        deleteDescription="Permanently remove your account, clinic profile, all postings, and associated applications. This action cannot be undone."
      />
    </View>
  );
}
