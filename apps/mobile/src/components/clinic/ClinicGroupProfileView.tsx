import type { ClinicLocation, ClinicProfile } from '@chairside/api';
import { Alert, Linking, Pressable, Text, View } from 'react-native';

import { DetailProse } from '@/components/clinic/DetailCard';
import { PracticeDoctorFieldValue } from '@/components/clinic/PracticeDoctorList';
import { ClinicIdentityHeroCard } from '@/components/clinic/ClinicProfileHero';
import {
  FieldBlock,
  FieldDivider,
  FieldValue,
  ProfileDetailStack,
  ProfileEmptyState,
  SectionPanel,
  profileSettingsHintStyle,
} from '@/components/profile/ProfileDetailBlocks';
import { CardInfoPanel, CardInfoPanelText } from '@/components/ui/CardInfoPanel';
import { webHover, webPointer, webTextLinkHoverStyles } from '@/lib/webPressableStyles';
import { useThemedStyles } from '@/theme';

type ClinicGroupProfileViewProps = {
  profile: ClinicProfile | null;
  groupName?: string | null;
  locations?: ClinicLocation[];
};

function normalizeWebsiteUrl(url: string): string {
  const trimmed = url.trim();
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

function WebsiteField({ url }: { url: string | null | undefined }) {
  const trimmed = url?.trim();

  const styles = useThemedStyles(({ colors }) => ({
    linkPressable: {
      alignSelf: 'flex-start' as const,
      borderRadius: 8,
      ...webPointer(),
    },
    linkHovered: webTextLinkHoverStyles(colors),
    link: {
      fontSize: 15,
      lineHeight: 22,
      color: colors.primary,
    },
  }));

  const handlePress = async () => {
    if (!trimmed) return;
    try {
      await Linking.openURL(normalizeWebsiteUrl(trimmed));
    } catch {
      Alert.alert('Cannot open link', 'Please check the website URL and try again.');
    }
  };

  if (!trimmed) {
    return <FieldValue value={null} />;
  }

  return (
    <Pressable
      accessibilityRole="link"
      onPress={handlePress}
      style={({ pressed, hovered }) => [
        styles.linkPressable,
        webHover(hovered, pressed, styles.linkHovered),
        pressed && { opacity: 0.75 },
      ]}>
      <Text style={styles.link}>{trimmed.replace(/^https?:\/\//i, '')}</Text>
    </Pressable>
  );
}

/** Combined group identity + about content for the Group profile settings screen. */
export function ClinicGroupProfileView({
  profile,
  groupName,
  locations = [],
}: ClinicGroupProfileViewProps) {
  const styles = useThemedStyles(({ colors, spacing, typography }) => ({
    hint: profileSettingsHintStyle({ typography, colors }),
    doctorsBlock: { gap: spacing.sm },
  }));

  if (!profile) {
    return (
      <ProfileEmptyState
        icon="business-outline"
        title="Add your group profile"
        description="Add your group name, phone, description, and website so candidates know who they are working with."
      />
    );
  }

  const displayName = groupName?.trim() || profile.clinic_name?.trim() || 'Your group';
  const description = profile.description?.trim() || null;
  const practiceDoctors = profile.practice_doctors ?? [];
  const doctorLocations = locations
    .filter((location) => location.is_active)
    .map((location) => ({ id: location.id, name: location.name }));
  const activeLocationCount = locations.filter((location) => location.is_active).length;
  const locationLabel =
    activeLocationCount > 0
      ? `${activeLocationCount} location${activeLocationCount === 1 ? '' : 's'}`
      : null;

  return (
    <ProfileDetailStack>
      <ClinicIdentityHeroCard
        clinicName={displayName}
        logoUri={null}
        specialtyLabel={null}
        locationLabel={locationLabel}
        emptyMetaFallback="Add a group description and website so candidates can learn about your team."
      />

      <CardInfoPanel variant="info" icon="information-circle-outline" title="What candidates see">
        <CardInfoPanelText>
          Your group name appears on postings and messages. Description, website, and doctors give
          candidates context before they apply. Location-specific details live under Locations.
        </CardInfoPanelText>
      </CardInfoPanel>

      <SectionPanel icon="business-outline" title="Group identity">
        <Text style={styles.hint}>The brand name and contact phone for your clinic group.</Text>
        <FieldBlock label="Group name">
          <FieldValue value={profile.clinic_name} />
        </FieldBlock>
        <FieldDivider />
        <FieldBlock label="Group phone">
          <FieldValue value={profile.phone} />
        </FieldBlock>
      </SectionPanel>

      <SectionPanel icon="document-text-outline" title="Description">
        <Text style={styles.hint}>
          The full story candidates can read on your public clinic profile.
        </Text>
        <FieldBlock label="Description">
          {description ? <DetailProse text={description} /> : <FieldValue value={null} />}
        </FieldBlock>
      </SectionPanel>

      <SectionPanel icon="link-outline" title="Website">
        <Text style={styles.hint}>
          Optional link to your practice website for candidates who want to learn more.
        </Text>
        <FieldBlock label="Website">
          <WebsiteField url={profile.website} />
        </FieldBlock>
      </SectionPanel>

      <SectionPanel icon="medkit-outline" title="Practice doctors">
        <Text style={styles.hint}>Doctors assigned to your clinic locations.</Text>
        <FieldBlock label="Doctors">
          {practiceDoctors.length > 0 ? (
            <View style={styles.doctorsBlock}>
              <PracticeDoctorFieldValue doctors={practiceDoctors} locations={doctorLocations} />
            </View>
          ) : (
            <FieldValue value={null} />
          )}
        </FieldBlock>
      </SectionPanel>
    </ProfileDetailStack>
  );
}
