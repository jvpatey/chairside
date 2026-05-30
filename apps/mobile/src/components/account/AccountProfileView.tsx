import type { User } from '@supabase/supabase-js';
import { View } from 'react-native';

import { AccountSettingsSection } from '@/components/account/AccountSettingsSection';
import { useThemedStyles } from '@/theme';

type AccountProfileViewProps = {
  user?: User | null;
  email?: string | null;
  accountTypeLabel: string;
  isSigningOut: boolean;
  isDeleting: boolean;
  onSignOut: () => void;
  onDeleteAccount: () => void;
  deleteDescription: string;
};

export function AccountProfileView({
  user,
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
        user={user}
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
