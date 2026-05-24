import { AccountProfileHero } from '@/components/account/AccountProfileHero';
import { AccountSessionActions } from '@/components/account/AccountSessionActions';
import { ProfileSection } from '@/components/worker/ProfileSection';

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
  return (
    <>
      <AccountProfileHero email={email} accountTypeLabel={accountTypeLabel} />

      <ProfileSection
        title="Account settings"
        subtitle="Sign out or permanently delete your account.">
        <AccountSessionActions
          isSigningOut={isSigningOut}
          isDeleting={isDeleting}
          onSignOut={onSignOut}
          onDeleteAccount={onDeleteAccount}
          deleteDescription={deleteDescription}
        />
      </ProfileSection>
    </>
  );
}
