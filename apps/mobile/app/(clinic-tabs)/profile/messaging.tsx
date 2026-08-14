import { router } from 'expo-router';

import { ClinicMessagingPreferences } from '@/components/clinic/ClinicMessagingPreferences';
import { ProfileDetailScreen } from '@/components/profile/ProfileDetailScreen';
import { ProfileSettingsCard } from '@/components/profile/ProfileSettingsCard';
import { ProfileSettingsRow } from '@/components/profile/ProfileSettingsRow';
import { useClinicUpgradePrompt } from '@/hooks/useClinicUpgradePrompt';
import { CLINIC_OPEN_INQUIRY_CANDIDATES, navigateToClinicProfileHub } from '@/lib/routing';
import { useTheme } from '@/theme';

export default function ClinicProfileMessagingScreen() {
  const { colors } = useTheme();
  const { billing, upgradePrompt, showGeneralMessagingUpgrade } = useClinicUpgradePrompt();
  const messagingLocked = billing != null && !billing.canUseGeneralCandidateMessaging;

  return (
    <ProfileDetailScreen
      title="Messaging"
      subtitle="Control how candidates can reach your clinic."
      onBack={() => navigateToClinicProfileHub(router)}>
      {upgradePrompt}
      <ProfileSettingsCard title="Open inquiries" icon="chatbubbles-outline">
        <ClinicMessagingPreferences />
        <ProfileSettingsRow
          icon="people-outline"
          title="Browse candidates"
          subtitle="Message workers in your province who opted in"
          iconColor={colors.primary}
          iconBackgroundColor={colors.primarySubtle}
          onPress={() => {
            if (messagingLocked) {
              showGeneralMessagingUpgrade();
              return;
            }
            router.push(CLINIC_OPEN_INQUIRY_CANDIDATES);
          }}
          embedded
        />
      </ProfileSettingsCard>
    </ProfileDetailScreen>
  );
}
