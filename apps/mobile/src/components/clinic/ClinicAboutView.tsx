import type { ClinicProfile } from '@chairside/api';
import { Alert, Linking, Pressable, Text } from 'react-native';

import { DetailProse } from '@/components/clinic/DetailCard';
import {
  FieldBlock,
  FieldDivider,
  FieldValue,
  ProfileDetailStack,
  ProfileEmptyState,
  SectionPanel,
} from '@/components/profile/ProfileDetailBlocks';
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
  const description = profile?.description?.trim() || null;

  if (!profile) {
    return (
      <ProfileEmptyState
        icon="document-text-outline"
        title="Tell candidates about your practice"
        description="Add a description and website so candidates can learn about your practice."
      />
    );
  }

  return (
    <ProfileDetailStack>
      <SectionPanel icon="document-text-outline" title="About your practice">
        <FieldBlock label="Description">
          {description ? <DetailProse text={description} /> : <FieldValue value={null} />}
        </FieldBlock>
        <FieldDivider />
        <FieldBlock label="Website">
          <WebsiteField url={profile.website} />
        </FieldBlock>
      </SectionPanel>
    </ProfileDetailStack>
  );
}
