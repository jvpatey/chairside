import { router } from 'expo-router';
import { Platform, View } from 'react-native';

import { ClinicProfileHero } from '@/components/clinic/ClinicProfileHero';
import { DetailHeroSkeleton } from '@/components/ui/skeletons/DetailHeroSkeleton';
import { SignOutHeaderButton } from '@/components/navigation/SignOutHeaderButton';
import { ProfileDetailScreen } from '@/components/profile/ProfileDetailScreen';
import { ProfileSettingsGroup } from '@/components/profile/ProfileSettingsGroup';
import { ProfileSettingsRow } from '@/components/profile/ProfileSettingsRow';
import { useAuth } from '@/contexts/AuthContext';
import { useClinicProfile } from '@/contexts/ClinicProfileContext';
import { useClinicMemberPhoto } from '@/hooks/useClinicMemberPhoto';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';
import { isPlatformAdminEmail } from '@/lib/platformAdmin';
import {
  getAccountSubtitle,
  getClinicLocationsSubtitle,
  getClinicNotificationsSubtitle,
  getClinicPracticeSubtitle,
  getSupportSubtitle,
} from '@/lib/profileHubSubtitles';
import {
  CLINIC_ADMIN,
  CLINIC_HOME,
  CLINIC_PROFILE_ACCOUNT,
  CLINIC_PROFILE_LOCATIONS,
  CLINIC_PROFILE_NOTIFICATIONS,
  CLINIC_PROFILE_PRACTICE,
  CLINIC_PROFILE_SUPPORT,
  CLINIC_PROFILE_TEXT_ALERTS,
} from '@/lib/routing';
import { getClinicTextAlertsSubtitle, isClinicTextPhoneVerified } from '@/lib/clinicTextAlerts';
import { colorWithAlpha, useTheme, useThemedStyles } from '@/theme';
import { isClinicGroupsEnabled } from '@chairside/api';

export default function ClinicAccountProfileScreen() {
  const { user } = useAuth();
  const {
    clinicProfile,
    isClinicProfileReady,
    isGroup,
    isOwner,
    locations,
  } = useClinicProfile();
  const { photoUri: memberPhotoUri } = useClinicMemberPhoto();
  const { isCompact, isTablet } = useResponsiveLayout();
  const { colors } = useTheme();
  const showAdminEntry =
    Platform.OS === 'web' && !isTablet && isPlatformAdminEmail(user?.email);
  const groupsEnabled = isClinicGroupsEnabled();

  const styles = useThemedStyles(({ spacing }) => ({
    content: { gap: spacing.lg },
  }));

  if (!isClinicProfileReady) {
    return (
      <ProfileDetailScreen
        onBack={() => router.replace(CLINIC_HOME)}
        headerRight={<SignOutHeaderButton />}>
        <DetailHeroSkeleton />
      </ProfileDetailScreen>
    );
  }

  const openMemberProfile = () => router.push(CLINIC_PROFILE_LOCATIONS);

  return (
    <ProfileDetailScreen
      onBack={() => router.replace(CLINIC_HOME)}
      headerRight={<SignOutHeaderButton />}>
      <View style={styles.content}>
        <ClinicProfileHero
          email={user?.email}
          profile={clinicProfile}
          editable
          memberPhotoUri={isGroup ? memberPhotoUri : null}
          onAvatarPress={isGroup ? openMemberProfile : undefined}
          hideClinicMeta={isGroup}
          isGroup={isGroup}
        />

        <ProfileSettingsGroup>
          {!isGroup ? (
            <ProfileSettingsRow
              icon="business-outline"
              title="Practice details"
              subtitle={getClinicPracticeSubtitle(clinicProfile)}
              iconColor={colors.primary}
              iconBackgroundColor={colors.primarySubtle}
              onPress={() => router.push(CLINIC_PROFILE_PRACTICE)}
            />
          ) : null}
          {groupsEnabled && (isOwner || isGroup) ? (
            <ProfileSettingsRow
              icon="business-outline"
              title={isGroup ? 'Group & clinics' : 'Clinics'}
              subtitle={getClinicLocationsSubtitle({
                locations,
                activeCount: locations.filter((location) => location.is_active).length,
              })}
              iconColor={colors.primary}
              iconBackgroundColor={colors.primarySubtle}
              onPress={() => router.push(CLINIC_PROFILE_LOCATIONS)}
            />
          ) : null}
          <ProfileSettingsRow
            icon="chatbubble-ellipses-outline"
            title="Text alerts"
            subtitle={getClinicTextAlertsSubtitle({
              storedPhone: clinicProfile?.phone,
              verified: isClinicTextPhoneVerified(user, clinicProfile?.phone),
            })}
            iconColor={colors.primary}
            iconBackgroundColor={colors.primarySubtle}
            onPress={() => router.push(CLINIC_PROFILE_TEXT_ALERTS)}
          />
          <ProfileSettingsRow
            icon="notifications-outline"
            title="Notifications"
            subtitle={getClinicNotificationsSubtitle()}
            iconColor={colors.info}
            iconBackgroundColor={colorWithAlpha(colors.info, 0.094)}
            onPress={() => router.push(CLINIC_PROFILE_NOTIFICATIONS)}
          />
          {isCompact ? (
            <ProfileSettingsRow
              icon="help-circle-outline"
              title="Support"
              subtitle={getSupportSubtitle()}
              onPress={() => router.push(CLINIC_PROFILE_SUPPORT)}
            />
          ) : null}
          {showAdminEntry ? (
            <ProfileSettingsRow
              icon="stats-chart-outline"
              title="Admin"
              subtitle="Platform stats and directories"
              iconColor={colors.primary}
              iconBackgroundColor={colors.primarySubtle}
              onPress={() => router.push(CLINIC_ADMIN)}
            />
          ) : null}
          <ProfileSettingsRow
            icon="person-circle-outline"
            title="Account"
            subtitle={getAccountSubtitle(user?.email)}
            onPress={() => router.push(CLINIC_PROFILE_ACCOUNT)}
          />
        </ProfileSettingsGroup>
      </View>
    </ProfileDetailScreen>
  );
}
