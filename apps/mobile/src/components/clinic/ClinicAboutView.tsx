import type { ClinicProfile } from '@chairside/api';
import { Alert, Linking, Pressable, Text, View } from 'react-native';

import { DetailProse, RowDivider } from '@/components/clinic/DetailCard';
import { useThemedStyles } from '@/theme';

type ClinicAboutViewProps = {
  profile: ClinicProfile | null;
};

function normalizeWebsiteUrl(url: string): string {
  const trimmed = url.trim();
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

function WebsiteRow({ url }: { url: string | null | undefined }) {
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
      <Text style={styles.label}>Website</Text>
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

export function ClinicAboutView({ profile }: ClinicAboutViewProps) {
  const description = profile?.description?.trim() || null;

  const styles = useThemedStyles(({ colors, spacing }) => ({
    card: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.separator,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
      gap: spacing.sm,
    },
    emptyCard: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.separator,
      padding: spacing.lg,
    },
    emptyText: {
      fontSize: 15,
      lineHeight: 22,
      color: colors.labelSecondary,
      textAlign: 'center',
    },
    descriptionField: { gap: spacing.xs, paddingVertical: spacing.sm + 2 },
    descriptionLabel: {
      fontSize: 15,
      lineHeight: 20,
      color: colors.labelSecondary,
    },
    descriptionEmpty: {
      fontSize: 15,
      lineHeight: 22,
      color: colors.labelTertiary,
    },
  }));

  if (!profile) {
    return (
      <View style={styles.emptyCard}>
        <Text style={styles.emptyText}>Add a description and website so candidates can learn about your practice.</Text>
      </View>
    );
  }

  return (
    <View style={styles.card}>
      <View style={styles.descriptionField}>
        <Text style={styles.descriptionLabel}>Description</Text>
        {description ? (
          <DetailProse text={description} />
        ) : (
          <Text style={styles.descriptionEmpty}>—</Text>
        )}
      </View>
      <RowDivider />
      <WebsiteRow url={profile.website} />
    </View>
  );
}
