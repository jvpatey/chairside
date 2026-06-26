import { router } from 'expo-router';
import { View } from 'react-native';

import { AccountChangePasswordSection } from '@/components/account/AccountChangePasswordSection';
import { AccountDisplayNameField } from '@/components/account/AccountDisplayNameField';
import { AccountProfileHero } from '@/components/account/AccountProfileHero';
import { AccountSessionActions } from '@/components/account/AccountSessionActions';
import { ProfileDetailScreen } from '@/components/profile/ProfileDetailScreen';
import { useAuth } from '@/contexts/AuthContext';
import { useDeleteAccount } from '@/hooks/useDeleteAccount';
import { useSignOut } from '@/hooks/useSignOut';
import { getAccountTypeLabel } from '@/lib/profileHubSubtitles';
import { useThemedStyles } from '@/theme';

export default function ClinicProfileAccountScreen() {
  const { user, profile, refreshProfile } = useAuth();
  const { isSigningOut, signOut } = useSignOut();
  const { isDeleting, confirmDeleteAccount } = useDeleteAccount();

  const styles = useThemedStyles(({ spacing }) => ({
    content: { gap: spacing.md },
  }));

  if (!user?.id) return null;

  return (
    <ProfileDetailScreen
      title="Account"
      subtitle="Your clinic name, password, login, sign out, and account deletion."
      onBack={() => router.back()}>
      <View style={styles.content}>
        <AccountProfileHero
          displayName={profile?.display_name}
          email={user.email}
          accountTypeLabel={getAccountTypeLabel('clinic')}
        />
        <AccountDisplayNameField
          userId={user.id}
          savedDisplayName={profile?.display_name}
          onSaved={refreshProfile}
        />
        <AccountChangePasswordSection user={user} />
        <AccountSessionActions
          isSigningOut={isSigningOut}
          isDeleting={isDeleting}
          onSignOut={signOut}
          onDeleteAccount={confirmDeleteAccount}
          deleteDescription="Permanently remove your account and login. Historical applications and messages will remain visible to others as no longer on Chairside."
        />
      </View>
    </ProfileDetailScreen>
  );
}
