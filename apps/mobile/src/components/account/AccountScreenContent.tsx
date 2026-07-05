import type { User } from '@supabase/supabase-js';
import { Text } from 'react-native';

import { AccountChangePasswordSection } from '@/components/account/AccountChangePasswordSection';
import { AccountDataPrivacyNotice } from '@/components/account/AccountDataPrivacyNotice';
import { AccountDeleteAccountCard } from '@/components/account/AccountDeleteAccountCard';
import { AccountDisplayNameField } from '@/components/account/AccountDisplayNameField';
import { AccountLegalLinks } from '@/components/account/AccountLegalLinks';
import { AccountProfileHero } from '@/components/account/AccountProfileHero';
import { AccountSignOutCard } from '@/components/account/AccountSignOutCard';
import {
  ProfileDetailStack,
  ProfileSummaryBanner,
  SectionPanel,
  profileSettingsHintStyle,
} from '@/components/profile/ProfileDetailBlocks';
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
  const isClinic = accountTypeLabel === 'Clinic';

  const styles = useThemedStyles(({ colors, typography }) => ({
    intro: profileSettingsHintStyle({ typography, colors }),
    hint: profileSettingsHintStyle({ typography, colors }),
  }));

  return (
    <ProfileDetailStack>
      <ProfileSummaryBanner icon="information-circle-outline" title="Account overview">
        <Text style={styles.intro}>
          Manage how you sign in, how your name appears, and what happens to your account data.
        </Text>
      </ProfileSummaryBanner>

      <AccountProfileHero
        displayName={displayName}
        email={user.email}
        accountTypeLabel={accountTypeLabel}
        icon={isClinic ? 'business-outline' : 'person-circle-outline'}
      />

      <SectionPanel stepNumber={1} stepAccent="primary" title="Profile">
        <AccountDisplayNameField
          userId={user.id}
          savedDisplayName={displayName}
          onSaved={onProfileRefresh}
        />
      </SectionPanel>

      {showPasswordSection ? (
        <SectionPanel stepNumber={2} stepAccent="secondary" title="Security">
          <AccountChangePasswordSection user={user} showSectionLabel={false} />
        </SectionPanel>
      ) : null}

      <SectionPanel
        stepNumber={showPasswordSection ? 3 : 2}
        stepAccent="primary"
        title="Privacy & data"
        collapsible
        defaultExpanded={false}>
        <Text style={styles.hint}>
          What happens to your data when you use Chairside and when you delete your account.
        </Text>
        <AccountDataPrivacyNotice />
      </SectionPanel>

      <SectionPanel
        stepNumber={showPasswordSection ? 4 : 3}
        stepAccent="secondary"
        title="Legal & support">
        <Text style={styles.hint}>
          Review policies and reach out if you need help with your account.
        </Text>
        <AccountLegalLinks />
      </SectionPanel>

      <SectionPanel icon="log-out-outline" title="Sign out">
        <Text style={styles.hint}>Sign out on this device. You can sign back in anytime.</Text>
        <AccountSignOutCard
          isSigningOut={isSigningOut}
          disabled={busy}
          onSignOut={onSignOut}
        />
      </SectionPanel>

      <SectionPanel icon="trash-outline" title="Delete account" variant="danger">
        <AccountDeleteAccountCard
          isDeleting={isDeleting}
          disabled={busy}
          description={deleteDescription}
          onDeleteAccount={onDeleteAccount}
        />
      </SectionPanel>
    </ProfileDetailStack>
  );
}
