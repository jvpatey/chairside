import { View } from 'react-native';

import { AccountSettingsSection } from '@/components/account/AccountSettingsSection';
import { useThemedStyles } from '@/theme';

type AccountProfileViewProps = {
  email?: string | null;
  accountTypeLabel: string;
  isSigningOut: boolean;
  isDeleting: boolean;
  onSignOut: () => void;
  onDeleteAccount: () => void;
  deleteDescription: string;
};

export function AccountProfileView({
  email,
  accountTypeLabel,
  isSigningOut,
  isDeleting,
  onSignOut,
  onDeleteAccount,
  deleteDescription,
}: AccountProfileViewProps) {
  const styles = useThemedStyles(({ spacing }) => ({
    content: { gap: spacing.xl },
  }));

  return (
    <View style={styles.content}>
      <AccountSettingsSection
        email={email}
        accountTypeLabel={accountTypeLabel}
        isSigningOut={isSigningOut}
        isDeleting={isDeleting}
        onSignOut={onSignOut}
        onDeleteAccount={onDeleteAccount}
        deleteDescription={deleteDescription}
      />
    </View>
  );
}
