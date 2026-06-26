import type { User } from '@supabase/supabase-js';
import { View } from 'react-native';

import { AccountChangePasswordSection } from '@/components/account/AccountChangePasswordSection';
import { AccountDataPrivacyNotice } from '@/components/account/AccountDataPrivacyNotice';
import { AccountDeleteAccountCard } from '@/components/account/AccountDeleteAccountCard';
import { AccountDisplayNameField } from '@/components/account/AccountDisplayNameField';
import { AccountProfileHero } from '@/components/account/AccountProfileHero';
import { AccountSettingsCard } from '@/components/account/AccountSettingsCard';
import { AccountSignOutCard } from '@/components/account/AccountSignOutCard';
import { userHasEmailPasswordLogin } from '@/lib/authProviders';
import { useThemedStyles } from '@/theme';

type AccountScreenContentProps = {
  user: User;
  displayName?: string | null;
  accountTypeLabel: string;
  onProfileRefresh: () => Promise<unknown>;
  isSigningOut: boolean;
  onSignOut: () => void;
  isDeleting: boolean;
  onDeleteAccount: () => void;
  deleteDescription: string;
};

export function AccountScreenContent({
  user,
  displayName,
  accountTypeLabel,
  onProfileRefresh,
  isSigningOut,
  onSignOut,
  isDeleting,
  onDeleteAccount,
  deleteDescription,
}: AccountScreenContentProps) {
  const busy = isSigningOut || isDeleting;
  const showPasswordSection = userHasEmailPasswordLogin(user);

  const styles = useThemedStyles(({ spacing }) => ({
    content: { gap: spacing.lg },
  }));

  return (
    <View style={styles.content}>
      <AccountProfileHero
        displayName={displayName}
        email={user.email}
        accountTypeLabel={accountTypeLabel}
        icon={accountTypeLabel === 'Clinic' ? 'business-outline' : 'person-circle-outline'}
      />

      <AccountSettingsCard title="Profile" icon="person-outline">
        <AccountDisplayNameField
          userId={user.id}
          savedDisplayName={displayName}
          onSaved={onProfileRefresh}
        />
      </AccountSettingsCard>

      {showPasswordSection ? (
        <AccountSettingsCard title="Security" icon="lock-closed-outline">
          <AccountChangePasswordSection user={user} showSectionLabel={false} />
        </AccountSettingsCard>
      ) : null}

      <AccountDataPrivacyNotice />

      <AccountSignOutCard
        isSigningOut={isSigningOut}
        disabled={busy}
        onSignOut={onSignOut}
      />

      <AccountDeleteAccountCard
        isDeleting={isDeleting}
        disabled={busy}
        description={deleteDescription}
        onDeleteAccount={onDeleteAccount}
      />
    </View>
  );
}
