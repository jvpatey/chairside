import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';

import {
  webHover,
  webListRowHoverStyles,
  webPointer,
} from '@/lib/webPressableStyles';
import { fontSemibold, useTheme, useThemedStyles } from '@/theme';

type ClinicLocationMapCalloutProps = {
  clinicName: string;
  address?: string | null;
  specialtyLabel?: string | null;
  onGetDirections: () => void;
};

export function ClinicLocationMapCallout({
  clinicName,
  address,
  specialtyLabel,
  onGetDirections,
}: ClinicLocationMapCalloutProps) {
  const { colors } = useTheme();

  const styles = useThemedStyles(({ colors, spacing, typography, elevation }) => ({
    card: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.separator,
      padding: spacing.sm,
      gap: spacing.xs,
      ...elevation('subtle'),
    },
    clinicName: {
      ...typography.body,
      fontFamily: fontSemibold,
      fontSize: 15,
      lineHeight: 20,
      fontWeight: '600',
      color: colors.labelPrimary,
    },
    detail: {
      ...typography.subtitle,
      fontSize: 13,
      lineHeight: 18,
    },
    directionsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
      alignSelf: 'flex-start',
      marginTop: spacing.xs,
      paddingVertical: 2,
      borderRadius: 6,
      ...webPointer(),
    },
    directionsRowHovered: webListRowHoverStyles(colors),
    directionsRowPressed: {
      opacity: 0.88,
    },
    directionsLabel: {
      fontSize: 14,
      lineHeight: 18,
      fontWeight: '600',
      color: colors.primary,
    },
  }));

  return (
    <View style={styles.card} accessibilityRole="summary">
      <Text style={styles.clinicName} numberOfLines={2}>
        {clinicName}
      </Text>
      {address ? (
        <Text style={styles.detail} numberOfLines={2}>
          {address}
        </Text>
      ) : null}
      {specialtyLabel ? (
        <Text style={styles.detail} numberOfLines={1}>
          {specialtyLabel}
        </Text>
      ) : null}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Get directions"
        onPress={onGetDirections}
        style={({ pressed, hovered }) => [
          styles.directionsRow,
          webHover(hovered, pressed, styles.directionsRowHovered),
          pressed && styles.directionsRowPressed,
        ]}>
        <Text style={styles.directionsLabel}>Get directions</Text>
        <Ionicons name="open-outline" size={14} color={colors.primary} />
      </Pressable>
    </View>
  );
}
