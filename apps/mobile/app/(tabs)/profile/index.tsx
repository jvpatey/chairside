import { router } from 'expo-router';
import { View } from 'react-native';

import { ProfileDetailScreen } from '@/components/profile/ProfileDetailScreen';
import { SignOutHeaderButton } from '@/components/navigation/SignOutHeaderButton';
import { ProfileSettingsGroup } from '@/components/profile/ProfileSettingsGroup';
import { ProfileSettingsRow } from '@/components/profile/ProfileSettingsRow';
import { WorkerProfileHero } from '@/components/worker/WorkerProfileHero';
import { DetailHeroSkeleton } from '@/components/ui/skeletons/DetailHeroSkeleton';
import { PUBLIC_LEGAL_PATHS } from '@/constants/legal';
import { useAuth } from '@/contexts/AuthContext';
import { useWorkerProfile } from '@/contexts/WorkerProfileContext';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';
import {
  getAccountSubtitle,
  getApplicationKitSubtitle,
  getNotificationsSubtitle,
  getProfessionalBackgroundSubtitle,
  getSupportSubtitle,
} from '@/lib/profileHubSubtitles';
import {
  WORKER_HOME,
  WORKER_PROFILE_ACCOUNT,
  WORKER_PROFILE_APPLICATION_KIT,
  WORKER_PROFILE_NOTIFICATIONS,
  WORKER_PROFILE_PROFESSIONAL,
} from '@/lib/routing';
import { useTheme, useThemedStyles } from '@/theme';

export default function WorkerProfileScreen() {
  const { profile, user } = useAuth();
  const { workerProfile, isWorkerProfileReady } = useWorkerProfile();
  const { isCompact } = useResponsiveLayout();
  const { colors } = useTheme();

  const styles = useThemedStyles(({ spacing }) => ({
    content: { gap: spacing.xl },
  }));

  if (!isWorkerProfileReady) {
    return (
      <ProfileDetailScreen
        onBack={() => router.replace(WORKER_HOME)}
        headerRight={<SignOutHeaderButton />}>
        <DetailHeroSkeleton />
      </ProfileDetailScreen>
    );
  }

  return (
    <ProfileDetailScreen
      onBack={() => router.replace(WORKER_HOME)}
      headerRight={<SignOutHeaderButton />}>
      <View style={styles.content}>
        <WorkerProfileHero
          displayName={profile?.display_name}
          profile={workerProfile}
          editable
        />

        <ProfileSettingsGroup>
          <ProfileSettingsRow
            icon="briefcase-outline"
            title="Professional background"
            subtitle={getProfessionalBackgroundSubtitle(workerProfile)}
            iconColor={colors.primary}
            iconBackgroundColor={colors.primarySubtle}
            onPress={() => router.push(WORKER_PROFILE_PROFESSIONAL)}
          />
          <ProfileSettingsRow
            icon="folder-outline"
            title="Application profile"
            subtitle={getApplicationKitSubtitle(workerProfile)}
            iconColor={colors.secondary}
            iconBackgroundColor={colors.secondarySubtle}
            onPress={() => router.push(WORKER_PROFILE_APPLICATION_KIT)}
          />
          <ProfileSettingsRow
            icon="notifications-outline"
            title="Notifications"
            subtitle={getNotificationsSubtitle(workerProfile)}
            iconColor={colors.info}
            iconBackgroundColor={`${colors.info}18`}
            onPress={() => router.push(WORKER_PROFILE_NOTIFICATIONS)}
          />
          {isCompact ? (
            <ProfileSettingsRow
              icon="help-circle-outline"
              title="Support"
              subtitle={getSupportSubtitle()}
              iconColor={colors.success}
              iconBackgroundColor={`${colors.success}18`}
              onPress={() => router.push(PUBLIC_LEGAL_PATHS.support)}
            />
          ) : null}
          <ProfileSettingsRow
            icon="person-circle-outline"
            title="Account"
            subtitle={getAccountSubtitle(user?.email)}
            iconColor={colors.warning}
            iconBackgroundColor={`${colors.warning}18`}
            onPress={() => router.push(WORKER_PROFILE_ACCOUNT)}
          />
        </ProfileSettingsGroup>
      </View>
    </ProfileDetailScreen>
  );
}
