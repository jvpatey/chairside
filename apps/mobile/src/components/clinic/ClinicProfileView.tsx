import type { ClinicProfile } from '@chairside/api';
import { SPECIALTY_OPTIONS, getTeamSizeRangeLabel } from '@chairside/config';
import { Ionicons } from '@expo/vector-icons';
import { Alert, Linking, Pressable, Text, View } from 'react-native';

import {
  DetailProse,
  DetailRow,
  DetailSection,
  DetailSectionDivider,
  RowDivider,
} from '@/components/clinic/DetailCard';
import { useTheme, useThemedStyles } from '@/theme';

function normalizeWebsiteUrl(url: string): string {
  const trimmed = url.trim();
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

function ProfileLinkRow({ label, url }: { label: string; url: string | null | undefined }) {
  const trimmed = url?.trim();

  const styles = useThemedStyles(({ spacing, colors }) => ({
    row: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      gap: spacing.md,
      paddingVertical: spacing.sm + 2,
    },
    label: {
      flex: 1,
      fontSize: 15,
      lineHeight: 20,
      color: colors.labelSecondary,
    },
    link: {
      flex: 1,
      fontSize: 15,
      lineHeight: 20,
      color: colors.primary,
      textAlign: 'right',
    },
    empty: {
      flex: 1,
      fontSize: 15,
      lineHeight: 20,
      color: colors.labelTertiary,
      textAlign: 'right',
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

  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      {trimmed ? (
        <Pressable accessibilityRole="link" onPress={handlePress} style={{ flex: 1 }}>
          <Text style={styles.link} numberOfLines={2}>
            {trimmed.replace(/^https?:\/\//i, '')}
          </Text>
        </Pressable>
      ) : (
        <Text style={styles.empty}>—</Text>
      )}
    </View>
  );
}

type ClinicProfileViewProps = {
  profile: ClinicProfile | null;
  isProfileComplete?: boolean;
};

export function ClinicProfileView({ profile, isProfileComplete = true }: ClinicProfileViewProps) {
  const { colors } = useTheme();

  const specialtyLabel =
    SPECIALTY_OPTIONS.find((item) => item.value === profile?.specialty)?.label ??
    'General dentistry';

  const teamSizeLabel = getTeamSizeRangeLabel(profile?.team_size_range ?? null);
  const softwareUsed = profile?.software_used ?? [];
  const softwareLabel = softwareUsed.length > 0 ? softwareUsed.join(' · ') : null;
  const description = profile?.description?.trim() || null;

  const addressLines = [
    profile?.address_line1,
    profile?.address_line2,
    [profile?.city, profile?.province, profile?.postal_code].filter(Boolean).join(', '),
  ].filter((line) => line?.trim());

  const styles = useThemedStyles(({ colors, spacing, typography }) => ({
    wrap: {
      gap: spacing.lg,
    },
    hero: {
      position: 'relative',
      backgroundColor: colors.surface,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.separator,
      padding: spacing.lg,
      gap: spacing.md,
    },
    heroTop: {
      gap: spacing.xs,
      paddingRight: isProfileComplete ? 0 : 88,
    },
    overline: {
      fontSize: 12,
      fontWeight: '600',
      letterSpacing: 0.6,
      textTransform: 'uppercase',
      color: colors.primary,
    },
    title: {
      ...typography.title,
      fontSize: 26,
      lineHeight: 32,
      letterSpacing: -0.4,
    },
    addressRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: spacing.sm,
    },
    addressIcon: {
      marginTop: 2,
    },
    addressText: {
      flex: 1,
      fontSize: 15,
      lineHeight: 21,
      color: colors.labelSecondary,
    },
    setupBadge: {
      position: 'absolute',
      top: spacing.lg,
      right: spacing.lg,
      borderRadius: 999,
      paddingHorizontal: spacing.sm,
      paddingVertical: 4,
      backgroundColor: `${colors.warning}1A`,
      borderWidth: 1,
      borderColor: `${colors.warning}40`,
      zIndex: 1,
    },
    setupBadgeText: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.warning,
    },
    card: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.separator,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
      gap: spacing.lg,
    },
  }));

  return (
    <View style={styles.wrap}>
      <View style={styles.hero}>
        {!isProfileComplete ? (
          <View style={styles.setupBadge}>
            <Text style={styles.setupBadgeText}>Incomplete</Text>
          </View>
        ) : null}

        <View style={styles.heroTop}>
          <Text style={styles.overline}>Your clinic</Text>
          <Text style={styles.title}>{profile?.clinic_name?.trim() || 'Your practice'}</Text>
        </View>

        {addressLines.length > 0 ? (
          <View style={styles.addressRow}>
            <Ionicons
              name="location-outline"
              size={16}
              color={colors.labelTertiary}
              style={styles.addressIcon}
            />
            <Text style={styles.addressText}>{addressLines.join('\n')}</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.card}>
        <DetailSection title="Contact">
          <DetailRow label="Contact name" value={profile?.contact_name} />
          <RowDivider />
          <DetailRow label="Phone" value={profile?.phone} />
        </DetailSection>

        <DetailSectionDivider>
          <DetailSection title="Practice">
            <DetailRow label="Specialty" value={specialtyLabel} />
            <RowDivider />
            <DetailRow label="Software" value={softwareLabel} />
            <RowDivider />
            <DetailRow label="Operatories" value={profile?.operatories_count?.toString() ?? null} />
            <RowDivider />
            <DetailRow label="Team size" value={teamSizeLabel} />
          </DetailSection>
        </DetailSectionDivider>

        <DetailSectionDivider>
          <DetailSection title="About">
            {description ? <DetailProse text={description} /> : null}
            {description ? <RowDivider /> : null}
            <ProfileLinkRow label="Website" url={profile?.website} />
          </DetailSection>
        </DetailSectionDivider>
      </View>
    </View>
  );
}
