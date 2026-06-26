import type { User } from '@supabase/supabase-js';
import { View } from 'react-native';

import { AccountChangePasswordSection } from '@/components/account/AccountChangePasswordSection';
import { AccountDataPrivacyNotice } from '@/components/account/AccountDataPrivacyNotice';
import { AccountDeleteAccountCard } from '@/components/account/AccountDeleteAccountCard';
import { AccountProfileHero } from '@/components/account/AccountProfileHero';
import { AccountSettingsCard } from '@/components/account/AccountSettingsCard';
import { AccountSignOutCard } from '@/components/account/AccountSignOutCard';
import { ProfileSection } from '@/components/worker/ProfileSection';
import { userHasEmailPasswordLogin } from '@/lib/authProviders';
import { useThemedStyles } from '@/theme';

type AccountSettingsSectionProps = {
  user?: User | null;
  email?: string | null;
  accountTypeLabel: string;
  isSigningOut: boolean;
  isDeleting: boolean;
  onSignOut: () => void;
  onDeleteAccount: () => void;
  deleteDescription: string;
};

export function AccountSettingsSection({
  user,
  email,
  accountTypeLabel,
  isSigningOut,
  isDeleting,
  onSignOut,
  onDeleteAccount,
  deleteDescription,
}: AccountSettingsSectionProps) {
  const busy = isSigningOut || isDeleting;
  const showPasswordSection = user != null && userHasEmailPasswordLogin(user);

  const styles = useThemedStyles(({ spacing }) => ({
    content: { gap: spacing.lg },
  }));

  return (
    <ProfileSection
      title="Account settings"
      subtitle="Your login, sign out, and account deletion.">
      <View style={styles.content}>
        <AccountProfileHero email={email} accountTypeLabel={accountTypeLabel} />
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
    </ProfileSection>
  );
}
