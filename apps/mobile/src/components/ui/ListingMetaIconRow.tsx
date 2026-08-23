import type { ComponentProps } from 'react';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { Text, View } from 'react-native';

import { useTheme, useThemedStyles } from '@/theme';

type IoniconName = ComponentProps<typeof Ionicons>['name'];

type ListingMetaIconRowProps = {
  icon: IoniconName;
  label: string;
  numberOfLines?: number;
};

export function ListingMetaIconRow({
  icon,
  label,
  numberOfLines = 1,
}: ListingMetaIconRowProps) {
  const { colors } = useTheme();
  const styles = useThemedStyles(({ colors, spacing }) => ({
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      minWidth: 0,
    },
    label: {
      flex: 1,
      minWidth: 0,
      fontSize: 14,
      lineHeight: 20,
      color: colors.labelSecondary,
    },
  }));

  return (
    <View style={styles.row}>
      <Ionicons name={icon} size={16} color={colors.labelTertiary} />
      <Text style={styles.label} numberOfLines={numberOfLines}>
        {label}
      </Text>
    </View>
  );
}

type ListingClinicSubtitleProps = {
  name: string;
  /** Dental group accounts use the three-person groups glyph; single clinics use business-outline. */
  isGroup?: boolean;
};

export function ListingClinicSubtitle({ name, isGroup = false }: ListingClinicSubtitleProps) {
  const { colors } = useTheme();
  const styles = useThemedStyles(({ colors, spacing }) => ({
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
      minWidth: 0,
    },
    label: {
      flex: 1,
      minWidth: 0,
      fontSize: 14,
      lineHeight: 20,
      color: colors.labelSecondary,
    },
  }));

  return (
    <View style={styles.row}>
      {isGroup ? (
        <MaterialIcons name="groups" size={16} color={colors.labelTertiary} />
      ) : (
        <Ionicons name="business-outline" size={14} color={colors.labelTertiary} />
      )}
      <Text style={styles.label} numberOfLines={1}>
        {name}
      </Text>
    </View>
  );
}
