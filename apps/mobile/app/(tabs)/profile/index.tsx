import { router } from 'expo-router';
import { Platform, View } from 'react-native';

import { ProfileDetailScreen } from '@/components/profile/ProfileDetailScreen';
import { SignOutHeaderButton } from '@/components/navigation/SignOutHeaderButton';
import { ProfileSettingsGroup } from '@/components/profile/ProfileSettingsGroup';
import { ProfileSettingsRow } from '@/components/profile/ProfileSettingsRow';
import { WorkerProfileHero } from '@/components/worker/WorkerProfileHero';
import { DetailHeroSkeleton } from '@/components/ui/skeletons/DetailHeroSkeleton';
import { useAuth } from '@/contexts/AuthContext';
import { useWorkerProfile } from '@/contexts/WorkerProfileContext';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';
import { getFillInSmsStatus } from '@/lib/fillInAvailabilitySummary';
import { isPlatformAdminEmail } from '@/lib/platformAdmin';
import {
  getAccountSubtitle,
  getOtherAlertsSubtitle,
  getProfessionalBackgroundSubtitle,
  getSupportSubtitle,
  getTextAlertsSubtitle,
} from '@/lib/profileHubSubtitles';
import {
  getWorkerFillInAvailabilityRoute,
  WORKER_ADMIN,
  WORKER_HOME,
  WORKER_PROFILE_ACCOUNT,
  WORKER_PROFILE_NOTIFICATIONS,
  WORKER_PROFILE_PROFESSIONAL,
  WORKER_PROFILE_SUPPORT,
} from '@/lib/routing';
import { colorWithAlpha, useTheme, useThemedStyles } from '@/theme';

export default function WorkerProfileScreen() {
  const { profile, user } = useAuth();
  const { workerProfile, isWorkerProfileReady } = useWorkerProfile();
  const { isCompact, isTablet } = useResponsiveLayout();
  const { colors, isDark } = useTheme();
  const showAdminEntry =
    Platform.OS === 'web' && !isTablet && isPlatformAdminEmail(user?.email);
  const smsActive = getFillInSmsStatus(workerProfile).smsActive;

  const styles = useThemedStyles(({ spacing }) => ({
    content: { gap: spacing.lg },
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
            icon="chatbubble-ellipses-outline"
            title="Text alerts"
            subtitle={getTextAlertsSubtitle(workerProfile)}
            iconColor={smsActive ? colors.success : colors.primary}
            iconBackgroundColor={
              smsActive
                ? colorWithAlpha(colors.success, isDark ? 0.18 : 0.1)
                : colors.primarySubtle
            }
            onPress={() =>
              router.push(getWorkerFillInAvailabilityRoute('profile'))
            }
          />
          <ProfileSettingsRow
            icon="person-outline"
            title="Profile"
            subtitle={getProfessionalBackgroundSubtitle(workerProfile)}
            iconColor={colors.primary}
            iconBackgroundColor={colors.primarySubtle}
            onPress={() => router.push(WORKER_PROFILE_PROFESSIONAL)}
          />
          <ProfileSettingsRow
            icon="notifications-outline"
            title="Notifications"
            subtitle={getOtherAlertsSubtitle()}
            iconColor={colors.info}
            iconBackgroundColor={colorWithAlpha(colors.info, 0.094)}
            onPress={() => router.push(WORKER_PROFILE_NOTIFICATIONS)}
          />
          <ProfileSettingsRow
            icon="person-circle-outline"
            title="Account"
            subtitle={getAccountSubtitle(user?.email)}
            onPress={() => router.push(WORKER_PROFILE_ACCOUNT)}
          />
          {isCompact ? (
            <ProfileSettingsRow
              icon="help-circle-outline"
              title="Support"
              subtitle={getSupportSubtitle()}
              iconColor={colors.success}
              iconBackgroundColor={colorWithAlpha(colors.success, 0.094)}
              onPress={() => router.push(WORKER_PROFILE_SUPPORT)}
            />
          ) : null}
          {showAdminEntry ? (
            <ProfileSettingsRow
              icon="stats-chart-outline"
              title="Admin"
              subtitle="Platform stats and directories"
              iconColor={colors.primary}
              iconBackgroundColor={colors.primarySubtle}
              onPress={() => router.push(WORKER_ADMIN)}
            />
          ) : null}
        </ProfileSettingsGroup>
      </View>
    </ProfileDetailScreen>
  );
}
