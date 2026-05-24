import { View } from 'react-native';

import { AccountProfileHero } from '@/components/account/AccountProfileHero';
import { AccountSessionActions } from '@/components/account/AccountSessionActions';
import { ProfileSection } from '@/components/worker/ProfileSection';
import { useThemedStyles } from '@/theme';

type AccountSettingsSectionProps = {
  email?: string | null;
  accountTypeLabel: string;
  isSigningOut: boolean;
  isDeleting: boolean;
  onSignOut: () => void;
  onDeleteAccount: () => void;
  deleteDescription: string;
};

export function AccountSettingsSection({
  email,
  accountTypeLabel,
  isSigningOut,
  isDeleting,
  onSignOut,
  onDeleteAccount,
  deleteDescription,
}: AccountSettingsSectionProps) {
  const styles = useThemedStyles(({ spacing }) => ({
    content: { gap: spacing.md },
  }));

  return (
    <ProfileSection
      title="Account settings"
      subtitle="Your login, sign out, and account deletion.">
      <View style={styles.content}>
        <AccountProfileHero email={email} accountTypeLabel={accountTypeLabel} />
        <AccountSessionActions
          isSigningOut={isSigningOut}
          isDeleting={isDeleting}
          onSignOut={onSignOut}
          onDeleteAccount={onDeleteAccount}
          deleteDescription={deleteDescription}
        />
      </View>
    </ProfileSection>
  );
}
