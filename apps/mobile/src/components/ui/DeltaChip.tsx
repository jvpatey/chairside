import { Ionicons } from '@expo/vector-icons';
import { Text, View } from 'react-native';

import { fontSemibold, useTheme, useThemedStyles } from '@/theme';

type DeltaChipProps = {
  delta: number;
};

/** Week-over-week change chip — mint up, neutral down. */
export function DeltaChip({ delta }: DeltaChipProps) {
  const { colors } = useTheme();
  const isUp = delta > 0;
  const isDown = delta < 0;
  const magnitude = Math.abs(delta);

  const styles = useThemedStyles(({ colors, radii, spacing }) => ({
    chip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 2,
      paddingHorizontal: spacing.xs + 2,
      paddingVertical: 2,
      borderRadius: radii.pill,
      backgroundColor: isUp
        ? colors.tertiarySubtle
        : isDown
          ? colors.fillSubtle
          : colors.fillSubtle,
    },
    label: {
      fontSize: 11,
      lineHeight: 14,
      fontFamily: fontSemibold,
      fontWeight: '600',
      color: isUp ? colors.tertiary : isDown ? colors.labelSecondary : colors.labelSecondary,
    },
  }));

  if (delta === 0) return null;

  return (
    <View style={styles.chip} accessibilityLabel={`${isUp ? 'Up' : 'Down'} ${magnitude} this week`}>
      <Ionicons
        name={isUp ? 'arrow-up' : 'arrow-down'}
        size={10}
        color={isUp ? colors.tertiary : colors.labelSecondary}
      />
      <Text style={styles.label}>{magnitude}</Text>
    </View>
  );
}
