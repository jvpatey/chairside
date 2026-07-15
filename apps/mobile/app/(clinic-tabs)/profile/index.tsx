import { router } from 'expo-router';
import { View } from 'react-native';

import { ClinicProfileHero } from '@/components/clinic/ClinicProfileHero';
import { DetailHeroSkeleton } from '@/components/ui/skeletons/DetailHeroSkeleton';
import { SignOutHeaderButton } from '@/components/navigation/SignOutHeaderButton';
import { ProfileDetailScreen } from '@/components/profile/ProfileDetailScreen';
import { ProfileSettingsGroup } from '@/components/profile/ProfileSettingsGroup';
import { ProfileSettingsRow } from '@/components/profile/ProfileSettingsRow';
import { PUBLIC_LEGAL_PATHS } from '@/constants/legal';
import { useAuth } from '@/contexts/AuthContext';
import { useClinicProfile } from '@/contexts/ClinicProfileContext';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';
import {
  getAccountSubtitle,
  getClinicAboutSubtitle,
  getClinicBillingSubtitle,
  getClinicMessagingSubtitle,
  getClinicNotificationsSubtitle,
  getClinicPracticeSubtitle,
  getSupportSubtitle,
} from '@/lib/profileHubSubtitles';
import {
  CLINIC_HOME,
  CLINIC_PROFILE_ABOUT,
  CLINIC_PROFILE_ACCOUNT,
  CLINIC_PROFILE_BILLING,
  CLINIC_PROFILE_LOCATIONS,
  CLINIC_PROFILE_MESSAGING,
  CLINIC_PROFILE_NOTIFICATIONS,
  CLINIC_PROFILE_PRACTICE,
  CLINIC_PROFILE_TEAM,
} from '@/lib/routing';
import { useTheme, useThemedStyles } from '@/theme';
import { getClinicPlanLabel, useClinicBilling } from '@/contexts/ClinicBillingContext';
import { isClinicGroupsEnabled } from '@chairside/api';

export default function ClinicAccountProfileScreen() {
  const { user } = useAuth();
  const { clinicProfile, isClinicProfileReady, isGroup, isOwner, locations } = useClinicProfile();
  const { billing } = useClinicBilling();
  const { isCompact } = useResponsiveLayout();
  const { colors } = useTheme();
  const groupsEnabled = isClinicGroupsEnabled();

  const styles = useThemedStyles(({ spacing }) => ({
    content: { gap: spacing.xl },
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

  return (
    <ProfileDetailScreen
      onBack={() => router.replace(CLINIC_HOME)}
      headerRight={<SignOutHeaderButton />}>
      <View style={styles.content}>
        <ClinicProfileHero
          email={user?.email}
          profile={clinicProfile}
          editable
          plan={billing?.plan ?? 'free'}
        />

        <ProfileSettingsGroup>
          <ProfileSettingsRow
            icon="business-outline"
            title="Practice details"
            subtitle={getClinicPracticeSubtitle(clinicProfile)}
            iconColor={colors.primary}
            iconBackgroundColor={colors.primarySubtle}
            onPress={() => router.push(CLINIC_PROFILE_PRACTICE)}
          />
          <ProfileSettingsRow
            icon="document-text-outline"
            title="About"
            subtitle={getClinicAboutSubtitle(clinicProfile)}
            iconColor={colors.secondary}
            iconBackgroundColor={colors.secondarySubtle}
            onPress={() => router.push(CLINIC_PROFILE_ABOUT)}
          />
          {groupsEnabled ? (
            <ProfileSettingsRow
              icon="business-outline"
              title="Locations"
              subtitle={
                locations.filter((location) => location.is_active).length > 0
                  ? `${locations.filter((location) => location.is_active).length} location${
                      locations.filter((location) => location.is_active).length === 1 ? '' : 's'
                    }`
                  : 'Add clinic locations'
              }
              iconColor={colors.primary}
              iconBackgroundColor={colors.primarySubtle}
              onPress={() => router.push(CLINIC_PROFILE_LOCATIONS)}
            />
          ) : null}
          {groupsEnabled && (isGroup || isOwner) ? (
            <ProfileSettingsRow
              icon="people-outline"
              title="Team & access"
              subtitle={isOwner ? 'Invite managers and assign locations' : 'Your manager access'}
              iconColor={colors.info}
              iconBackgroundColor={`${colors.info}18`}
              onPress={() => router.push(CLINIC_PROFILE_TEAM)}
            />
          ) : null}
          <ProfileSettingsRow
            icon="notifications-outline"
            title="Notifications"
            subtitle={getClinicNotificationsSubtitle()}
            iconColor={colors.info}
            iconBackgroundColor={`${colors.info}18`}
            onPress={() => router.push(CLINIC_PROFILE_NOTIFICATIONS)}
          />
          <ProfileSettingsRow
            icon="chatbubbles-outline"
            title="Messaging"
            subtitle={getClinicMessagingSubtitle(clinicProfile)}
            iconColor={colors.success}
            iconBackgroundColor={`${colors.success}18`}
            onPress={() => router.push(CLINIC_PROFILE_MESSAGING)}
          />
          <ProfileSettingsRow
            icon="card-outline"
            title="Plans & billing"
            subtitle={getClinicBillingSubtitle(getClinicPlanLabel(billing?.plan ?? 'free'))}
            iconColor={colors.warning}
            iconBackgroundColor={`${colors.warning}18`}
            onPress={() => router.push(CLINIC_PROFILE_BILLING)}
          />
          {isCompact ? (
            <ProfileSettingsRow
              icon="help-circle-outline"
              title="Support"
              subtitle={getSupportSubtitle()}
              onPress={() => router.push(PUBLIC_LEGAL_PATHS.support)}
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
