import type { ClinicProfile } from '@chairside/api';
import { LinearGradient } from 'expo-linear-gradient';
import { Alert, Linking, Pressable, StyleSheet, Text, View } from 'react-native';

import { DetailProse } from '@/components/clinic/DetailCard';
import {
  FieldBlock,
  FieldValue,
  ProfileDetailStack,
  ProfileEmptyState,
  ProfileSummaryBanner,
  SectionPanel,
  profileSettingsHintStyle,
} from '@/components/profile/ProfileDetailBlocks';
import { webHover, webPointer, webTextLinkHoverStyles } from '@/lib/webPressableStyles';
import { getHeroBandGradient, useTheme, useThemedStyles } from '@/theme';

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

function AboutHeroCard({
  clinicName,
  description,
  website,
}: {
  clinicName: string;
  description: string | null;
  website: string | null;
}) {
  const { colors, isDark } = useTheme();
  const heroGradient = getHeroBandGradient(colors, isDark, 'secondary');
  const websiteLabel = website?.trim().replace(/^https?:\/\//i, '') || null;

  const styles = useThemedStyles(({ colors, spacing, typography, radii, elevation, isDark }) => ({
    card: {
      borderRadius: radii.hero,
      overflow: 'hidden',
      borderWidth: isDark ? 1 : 0,
      borderColor: colors.separator,
      position: 'relative',
      ...elevation('subtle'),
    },
    gradient: {
      ...StyleSheet.absoluteFillObject,
    },
    content: {
      padding: spacing.lg,
      alignItems: 'center',
      gap: spacing.sm,
    },
    eyebrow: {
      fontSize: 12,
      fontWeight: '700',
      letterSpacing: 0.5,
      textTransform: 'uppercase',
      color: colors.secondary,
      textAlign: 'center',
    },
    title: {
      ...typography.title,
      fontSize: 26,
      lineHeight: 32,
      fontWeight: '700',
      textAlign: 'center',
      color: colors.labelPrimary,
      width: '100%',
    },
    description: {
      fontSize: 15,
      lineHeight: 22,
      textAlign: 'center',
      color: colors.labelPrimary,
      width: '100%',
    },
    empty: {
      ...typography.body,
      fontSize: 16,
      lineHeight: 24,
      textAlign: 'center',
      color: colors.labelSecondary,
      fontStyle: 'italic',
      width: '100%',
    },
    websitePressable: {
      borderRadius: 8,
      ...webPointer(),
    },
    websitePressableHovered: webTextLinkHoverStyles(colors),
    website: {
      fontSize: 15,
      lineHeight: 22,
      textAlign: 'center',
      color: colors.primary,
      fontWeight: '600',
    },
    websiteEmpty: {
      fontSize: 15,
      lineHeight: 22,
      textAlign: 'center',
      color: colors.labelTertiary,
      fontStyle: 'italic',
      width: '100%',
    },
  }));

  const handleWebsitePress = async () => {
    const trimmed = website?.trim();
    if (!trimmed) return;

    try {
      await Linking.openURL(normalizeWebsiteUrl(trimmed));
    } catch {
      Alert.alert('Cannot open link', 'Please check the website URL and try again.');
    }
  };

  return (
    <View style={styles.card}>
      <LinearGradient
        colors={heroGradient}
        locations={[0, 0.35, 0.65, 0.85, 1]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={styles.gradient}
        pointerEvents="none"
      />
      <View style={styles.content}>
        <Text style={styles.eyebrow}>About</Text>
        <Text style={styles.title}>{clinicName}</Text>
        {description ? (
          <Text style={styles.description}>{description}</Text>
        ) : (
          <Text style={styles.empty}>
            Add a short description so candidates can learn about your team and culture.
          </Text>
        )}
        {websiteLabel ? (
          <Pressable
            accessibilityRole="link"
            onPress={() => void handleWebsitePress()}
            style={({ pressed, hovered }) => [
              styles.websitePressable,
              webHover(hovered, pressed, styles.websitePressableHovered),
              pressed && { opacity: 0.75 },
            ]}>
            <Text style={styles.website}>{websiteLabel}</Text>
          </Pressable>
        ) : (
          <Text style={styles.websiteEmpty}>No website added yet</Text>
        )}
      </View>
    </View>
  );
}

export function ClinicAboutView({ profile }: ClinicAboutViewProps) {
  const styles = useThemedStyles(({ colors, typography }) => ({
    hint: profileSettingsHintStyle({ typography, colors }),
    intro: profileSettingsHintStyle({ typography, colors }),
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

  return (
    <ProfileDetailStack>
      <ProfileSummaryBanner icon="information-circle-outline" title="How candidates learn about you">
        <Text style={styles.intro}>
          Your description and website give candidates context about your team, culture, and
          practice before they apply or message you.
        </Text>
      </ProfileSummaryBanner>

      <AboutHeroCard
        clinicName={clinicName}
        description={description}
        website={profile.website}
      />

      <SectionPanel stepNumber={1} stepAccent="secondary" title="Practice description">
        <Text style={styles.hint}>
          The full practice story candidates can read on your public clinic profile.
        </Text>
        <FieldBlock label="Description">
          {description ? <DetailProse text={description} /> : <FieldValue value={null} />}
        </FieldBlock>
      </SectionPanel>

      <SectionPanel stepNumber={2} stepAccent="primary" title="Website">
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
