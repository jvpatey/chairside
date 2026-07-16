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
import {
  getClinicMembershipRoleLabel,
  resolveClinicMemberDisplayName,
} from '@/hooks/useClinicActingContext';
import { useClinicMemberPhoto } from '@/hooks/useClinicMemberPhoto';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';
import {
  getAccountSubtitle,
  getClinicAboutSubtitle,
  getClinicBillingSubtitle,
  getClinicMemberProfileSubtitle,
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
  CLINIC_PROFILE_MEMBER,
  CLINIC_PROFILE_MESSAGING,
  CLINIC_PROFILE_NOTIFICATIONS,
  CLINIC_PROFILE_PRACTICE,
  CLINIC_PROFILE_TEAM,
} from '@/lib/routing';
import { useTheme, useThemedStyles } from '@/theme';
import { getClinicPlanLabel, useClinicBilling } from '@/contexts/ClinicBillingContext';
import { isClinicGroupsEnabled } from '@chairside/api';

export default function ClinicAccountProfileScreen() {
  const { user, profile: authProfile } = useAuth();
  const {
    clinicProfile,
    isClinicProfileReady,
    isGroup,
    isOwner,
    locations,
    organization,
    membership,
  } = useClinicProfile();
  const { photoUri: memberPhotoUri, hasPhoto: hasMemberPhoto } = useClinicMemberPhoto();
  const { billing } = useClinicBilling();
  const { isCompact } = useResponsiveLayout();
  const { colors } = useTheme();
  const groupsEnabled = isClinicGroupsEnabled();
  const groupDisplayName =
    organization?.name?.trim() || clinicProfile?.clinic_name?.trim() || 'Dental group';
  const memberName = resolveClinicMemberDisplayName({
    displayName: membership?.display_name,
    fallbackDisplayName: authProfile?.display_name,
  });
  const memberRoleLabel = getClinicMembershipRoleLabel(membership?.role, isOwner);
  // Groups: person title, then "Owner · Dental Group"
  const groupIdentityLine = isGroup
    ? `${memberRoleLabel} · ${groupDisplayName}`
    : null;

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

  const openMemberProfile = () => router.push(CLINIC_PROFILE_MEMBER);

  return (
    <ProfileDetailScreen
      onBack={() => router.replace(CLINIC_HOME)}
      headerRight={<SignOutHeaderButton />}>
      <View style={styles.content}>
        <ClinicProfileHero
          email={user?.email}
          profile={clinicProfile}
          displayName={isGroup ? memberName || 'Your profile' : null}
          identityLine={groupIdentityLine}
          editable
          plan={billing?.plan ?? 'free'}
          memberPhotoUri={isGroup ? memberPhotoUri : null}
          memberDisplayName={isGroup ? memberName || 'Your profile' : null}
          onAvatarPress={isGroup ? openMemberProfile : undefined}
          hideClinicMeta={isGroup}
        />

        <ProfileSettingsGroup>
          {groupsEnabled && isGroup ? (
            <ProfileSettingsRow
              icon="person-outline"
              title="Your profile"
              subtitle={getClinicMemberProfileSubtitle({
                displayName: membership?.display_name,
                title: membership?.title,
                hasPhoto: hasMemberPhoto,
                hasBio: Boolean(membership?.bio?.trim()),
              })}
              iconColor={colors.primary}
              iconBackgroundColor={colors.primarySubtle}
              onPress={openMemberProfile}
            />
          ) : null}
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
          {!isGroup || isOwner ? (
            <ProfileSettingsRow
              icon="document-text-outline"
              title="About"
              subtitle={getClinicAboutSubtitle(clinicProfile)}
              iconColor={colors.secondary}
              iconBackgroundColor={colors.secondarySubtle}
              onPress={() => router.push(CLINIC_PROFILE_ABOUT)}
            />
          ) : null}
          {groupsEnabled && isGroup ? (
            <ProfileSettingsRow
              icon="business-outline"
              title="Locations"
              subtitle={
                isOwner
                  ? locations.filter((location) => location.is_active).length > 0
                    ? `${locations.filter((location) => location.is_active).length} location${
                        locations.filter((location) => location.is_active).length === 1 ? '' : 's'
                      }`
                    : 'Add clinic locations'
                  : 'Clinics you manage'
              }
              iconColor={colors.primary}
              iconBackgroundColor={colors.primarySubtle}
              onPress={() => router.push(CLINIC_PROFILE_LOCATIONS)}
            />
          ) : null}
          {groupsEnabled && isGroup ? (
            <ProfileSettingsRow
              icon="people-outline"
              title="Team & access"
              subtitle={
                isOwner
                  ? `Manage access for ${groupDisplayName}`
                  : 'Your manager access'
              }
              iconColor={colors.info}
              iconBackgroundColor={`${colors.info}18`}
              onPress={() => router.push(CLINIC_PROFILE_TEAM)}
            />
          ) : null}
          <ProfileSettingsRow
            icon="notifications-outline"
            title="Notifications"
            subtitle={getClinicNotificationsSubtitle({
              isGroupOwner: isGroup && isOwner,
            })}
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
