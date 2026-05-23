import type { ClinicProfile } from '@chairside/api';
import { SPECIALTY_OPTIONS, getTeamSizeRangeLabel } from '@chairside/config';
import type { ReactNode } from 'react';
import { Alert, Linking, Pressable, Text, View } from 'react-native';

import { useThemedStyles } from '@/theme';

function normalizeWebsiteUrl(url: string): string {
  const trimmed = url.trim();
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

function ProfileHero({
  clinicName,
  specialtyLabel,
}: {
  clinicName: string;
  specialtyLabel: string;
}) {
  const styles = useThemedStyles(({ colors, spacing, typography }) => ({
    hero: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.separator,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.lg,
      gap: spacing.sm,
    },
    overline: {
      fontSize: 12,
      fontWeight: '600',
      letterSpacing: 0.6,
      textTransform: 'uppercase',
      color: colors.primary,
      opacity: 0.9,
    },
    clinicName: {
      ...typography.title,
      fontSize: 24,
      lineHeight: 30,
      color: colors.labelPrimary,
    },
    badge: {
      alignSelf: 'flex-start',
      backgroundColor: colors.secondarySubtle,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: colors.secondary,
      paddingHorizontal: spacing.md,
      paddingVertical: 5,
      marginTop: spacing.xs,
    },
    badgeText: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.secondary,
    },
  }));

  return (
    <View style={styles.hero}>
      <Text style={styles.overline}>Your practice</Text>
      <Text style={styles.clinicName}>{clinicName}</Text>
      <View style={styles.badge}>
        <Text style={styles.badgeText}>{specialtyLabel}</Text>
      </View>
    </View>
  );
}

function ProfileSection({ title, children }: { title: string; children: ReactNode }) {
  const styles = useThemedStyles(({ spacing, typography }) => ({
    section: {
      gap: spacing.sm,
    },
    title: {
      ...typography.body,
      fontSize: 13,
      fontWeight: '600',
      letterSpacing: 0.4,
      textTransform: 'uppercase',
      color: typography.subtitle.color,
      marginBottom: spacing.xs,
    },
  }));

  return (
    <View style={styles.section}>
      <Text style={styles.title}>{title}</Text>
      {children}
    </View>
  );
}

function ProfileField({ label, value }: { label: string; value: string | null | undefined }) {
  const display = value?.trim() || '—';

  const styles = useThemedStyles(({ spacing, typography }) => ({
    field: {
      gap: spacing.xs,
    },
    label: {
      fontSize: 13,
      fontWeight: '600',
      color: typography.subtitle.color,
    },
    value: {
      ...typography.body,
      lineHeight: 22,
    },
  }));

  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{display}</Text>
    </View>
  );
}

function ProfileLinkField({ label, url }: { label: string; url: string | null | undefined }) {
  const trimmed = url?.trim();

  const styles = useThemedStyles(({ spacing, typography, colors }) => ({
    field: {
      gap: spacing.xs,
    },
    label: {
      fontSize: 13,
      fontWeight: '600',
      color: typography.subtitle.color,
    },
    link: {
      ...typography.body,
      lineHeight: 22,
      color: colors.primary,
      fontWeight: '600',
    },
    empty: {
      ...typography.body,
      lineHeight: 22,
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
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      {trimmed ? (
        <Pressable accessibilityRole="link" onPress={handlePress}>
          <Text style={styles.link}>{trimmed}</Text>
        </Pressable>
      ) : (
        <Text style={styles.empty}>—</Text>
      )}
    </View>
  );
}

function SoftwareBadges({ items }: { items: string[] }) {
  const styles = useThemedStyles(({ colors, spacing, typography }) => ({
    wrap: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.sm,
    },
    chip: {
      backgroundColor: colors.fillSubtle,
      borderRadius: 999,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.xs,
    },
    chipText: {
      ...typography.body,
      fontSize: 14,
      color: colors.labelPrimary,
    },
    empty: {
      ...typography.body,
      lineHeight: 22,
    },
  }));

  if (items.length === 0) {
    return <Text style={styles.empty}>—</Text>;
  }

  return (
    <View style={styles.wrap}>
      {items.map((item) => (
        <View key={item} style={styles.chip}>
          <Text style={styles.chipText}>{item}</Text>
        </View>
      ))}
    </View>
  );
}

type ClinicProfileViewProps = {
  profile: ClinicProfile | null;
};

export function ClinicProfileView({ profile }: ClinicProfileViewProps) {
  const specialtyLabel =
    SPECIALTY_OPTIONS.find((item) => item.value === profile?.specialty)?.label ??
    'General dentistry';

  const styles = useThemedStyles(({ colors, spacing, typography }) => ({
    container: {
      gap: spacing.lg,
    },
    sectionCard: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.separator,
      padding: spacing.lg,
      gap: spacing.md,
    },
    softwareLabel: {
      fontSize: 13,
      fontWeight: '600',
      color: typography.subtitle.color,
      marginBottom: spacing.xs,
    },
    addressLine: {
      ...typography.body,
      lineHeight: 22,
    },
  }));

  const addressLines = [
    profile?.address_line1,
    profile?.address_line2,
    [profile?.city, profile?.province, profile?.postal_code].filter(Boolean).join(', '),
  ].filter((line) => line?.trim());

  return (
    <View style={styles.container}>
      <ProfileHero
        clinicName={profile?.clinic_name?.trim() || 'Your practice'}
        specialtyLabel={specialtyLabel}
      />

      <ProfileSection title="Contact">
        <View style={styles.sectionCard}>
          <ProfileField label="Contact name" value={profile?.contact_name} />
          <ProfileField label="Phone" value={profile?.phone} />
        </View>
      </ProfileSection>

      <ProfileSection title="Location">
        <View style={styles.sectionCard}>
          {addressLines.length > 0 ? (
            addressLines.map((line, index) => (
              <Text key={`${line}-${index}`} style={styles.addressLine}>
                {line}
              </Text>
            ))
          ) : (
            <ProfileField label="Address" value={null} />
          )}
        </View>
      </ProfileSection>

      <ProfileSection title="Practice">
        <View style={styles.sectionCard}>
          <ProfileField
            label="Operatories"
            value={profile?.operatories_count?.toString() ?? null}
          />
          <ProfileField
            label="Team size"
            value={getTeamSizeRangeLabel(profile?.team_size_range ?? null)}
          />
          <View>
            <Text style={styles.softwareLabel}>Software</Text>
            <SoftwareBadges items={profile?.software_used ?? []} />
          </View>
        </View>
      </ProfileSection>

      <ProfileSection title="About">
        <View style={styles.sectionCard}>
          <ProfileField label="Description" value={profile?.description} />
          <ProfileLinkField label="Website" url={profile?.website} />
        </View>
      </ProfileSection>
    </View>
  );
}
