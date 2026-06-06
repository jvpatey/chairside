import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';

import { useTheme, useThemedStyles } from '@/theme';

type FilterTriggerButtonProps = {
  activeCount: number;
  onPress: () => void;
  accessibilityLabel?: string;
};

export function FilterTriggerButton({
  activeCount,
  onPress,
  accessibilityLabel = 'Filter',
}: FilterTriggerButtonProps) {
  const { colors } = useTheme();
  const styles = useThemedStyles(({ colors, spacing }) => ({
    button: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: activeCount > 0 ? colors.primary : colors.separator,
      backgroundColor: activeCount > 0 ? colors.primarySubtle : colors.surface,
      paddingHorizontal: spacing.sm + 2,
      paddingVertical: 8,
      minWidth: 44,
      minHeight: 36,
      justifyContent: 'center',
    },
    badge: {
      minWidth: 18,
      height: 18,
      borderRadius: 9,
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 4,
    },
    badgeText: {
      fontSize: 11,
      fontWeight: '700',
      color: colors.primaryOnPrimary,
    },
  }));

  return (
    <Pressable
      style={styles.button}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
    >
      <Ionicons
        name="options-outline"
        size={16}
        color={activeCount > 0 ? colors.primary : colors.labelPrimary}
      />
      {activeCount > 0 ? (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{activeCount}</Text>
        </View>
      ) : null}
    </Pressable>
  );
}
