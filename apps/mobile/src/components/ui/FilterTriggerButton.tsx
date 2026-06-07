import { Ionicons } from '@expo/vector-icons';
import { Platform, Pressable, Text, View } from 'react-native';

import { webPointer } from '@/lib/webPressableStyles';
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
      ...webPointer(),
    },
    buttonHovered: {
      backgroundColor: activeCount > 0 ? colors.primarySubtle : colors.backgroundGrouped,
      borderColor: activeCount > 0 ? colors.primary : colors.labelTertiary,
    },
    buttonPressed: {
      opacity: 0.85,
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

  const isWeb = Platform.OS === 'web';

  return (
    <Pressable
      style={({ pressed, hovered }) => [
        styles.button,
        isWeb && hovered && !pressed && styles.buttonHovered,
        isWeb && pressed && styles.buttonPressed,
      ]}
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
