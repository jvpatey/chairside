import type { ClinicProfile } from '@chairside/api';
import { SPECIALTY_OPTIONS, getProvinceLabel } from '@chairside/config';
import { Alert, Linking, Pressable, Text } from 'react-native';

import { DetailProse } from '@/components/clinic/DetailCard';
import { ClinicIdentityHeroCard } from '@/components/clinic/ClinicProfileHero';
import {
  FieldBlock,
  FieldValue,
  ProfileDetailStack,
  ProfileEmptyState,
  SectionPanel,
  profileSettingsHintStyle,
} from '@/components/profile/ProfileDetailBlocks';
import { CardInfoPanel, CardInfoPanelText } from '@/components/ui/CardInfoPanel';
import { useClinicLogo } from '@/hooks/useClinicLogo';
import { webHover, webPointer, webTextLinkHoverStyles } from '@/lib/webPressableStyles';
import { useThemedStyles } from '@/theme';

type ClinicAboutViewProps = {
  profile: ClinicProfile | null;
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
      alignSelf: 'flex-start',
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

export function ClinicAboutView({ profile }: ClinicAboutViewProps) {
  const { logoUri } = useClinicLogo();
  const styles = useThemedStyles(({ colors, typography }) => ({
    hint: profileSettingsHintStyle({ typography, colors }),
  }));

  if (!profile) {
    return (
      <ProfileEmptyState
        icon="document-text-outline"
        title="Tell candidates about your practice"
        description="Add a description and website so candidates can learn about your practice."
      />
    );
  }

  const clinicName = profile.clinic_name?.trim() || 'Your practice';
  const description = profile.description?.trim() || null;
  const specialtyLabel =
    SPECIALTY_OPTIONS.find((item) => item.value === profile.specialty)?.label ?? null;
  const locationLabel = [profile.city, profile.province ? getProvinceLabel(profile.province) : null]
    .filter(Boolean)
    .join(', ');

  return (
    <ProfileDetailStack>
      <ClinicIdentityHeroCard
        clinicName={clinicName}
        logoUri={logoUri}
        specialtyLabel={specialtyLabel}
        locationLabel={locationLabel || null}
        emptyMetaFallback="Add a description and website so candidates can learn about your team."
      />

      <CardInfoPanel
        variant="info"
        icon="information-circle-outline"
        title="How candidates learn about you">
        <CardInfoPanelText>
          Your description and website give candidates context about your team, culture, and
          practice before they apply or message you.
        </CardInfoPanelText>
      </CardInfoPanel>

      <SectionPanel icon="document-text-outline" title="Practice description">
        <Text style={styles.hint}>
          The full practice story candidates can read on your public clinic profile.
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
    </ProfileDetailStack>
  );
}
