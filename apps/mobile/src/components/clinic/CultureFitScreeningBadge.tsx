import { Ionicons } from '@expo/vector-icons';
import { Text, View, type ViewStyle } from 'react-native';

import { useTheme, useThemedStyles } from '@/theme';

type CultureFitScreeningBadgeProps = {
  /** Shorter label for list cards */
  compact?: boolean;
  style?: ViewStyle;
};

export function CultureFitScreeningBadge({
  compact = false,
  style,
}: CultureFitScreeningBadgeProps) {
  const { colors } = useTheme();
  const label = compact ? 'Screening' : 'Screening questions';

  const styles = useThemedStyles(({ colors, spacing }) => ({
    badge: {
      flexDirection: 'row',
      alignItems: 'center',
      alignSelf: 'flex-start',
      gap: 4,
      backgroundColor: colors.primarySubtle,
      borderRadius: 999,
      paddingHorizontal: spacing.sm,
      paddingVertical: 4,
      borderWidth: 1,
      borderColor: `${colors.primary}33`,
    },
    text: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.primary,
    },
  }));

  return (
    <View style={[styles.badge, style]} accessibilityLabel={label}>
      <Ionicons name="clipboard-outline" size={13} color={colors.primary} />
      <Text style={styles.text}>{label}</Text>
    </View>
  );
}
