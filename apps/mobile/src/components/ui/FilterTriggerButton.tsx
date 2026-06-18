import { Ionicons } from '@expo/vector-icons';
import { Platform, Pressable, Text, View } from 'react-native';

import { useTabAtmosphereAccent } from '@/contexts/TabAtmosphereContext';
import { webPointer } from '@/lib/webPressableStyles';
import { useTheme, useThemedStyles, type GradientAccent } from '@/theme';

type FilterTriggerButtonProps = {
  activeCount: number;
  onPress: () => void;
  accessibilityLabel?: string;
  accent?: GradientAccent;
};

export function FilterTriggerButton({
  activeCount,
  onPress,
  accessibilityLabel = 'Filter',
  accent,
}: FilterTriggerButtonProps) {
  const { colors } = useTheme();
  const tabAccent = useTabAtmosphereAccent();
  const resolvedAccent = accent ?? tabAccent;
  const brandColor = resolvedAccent === 'secondary' ? colors.secondary : colors.primary;
  const brandSubtle = resolvedAccent === 'secondary' ? colors.secondarySubtle : colors.primarySubtle;
  const brandOn = resolvedAccent === 'secondary' ? colors.secondaryOnSecondary : colors.primaryOnPrimary;
  const isActive = activeCount > 0;

  const styles = useThemedStyles(({ colors, spacing }) => ({
    button: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: colors.separator,
      backgroundColor: colors.surface,
      paddingHorizontal: spacing.sm + 2,
      paddingVertical: 8,
      minWidth: 44,
      minHeight: 36,
      justifyContent: 'center',
      ...webPointer(),
    },
    buttonHovered: {
      backgroundColor: colors.backgroundGrouped,
      borderColor: colors.labelTertiary,
    },
    buttonPressed: {
      opacity: 0.85,
    },
    badge: {
      minWidth: 18,
      height: 18,
      borderRadius: 9,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 4,
    },
    badgeText: {
      fontSize: 11,
      fontWeight: '700',
    },
  }));

  const activeButtonStyle = isActive
    ? {
        borderColor: brandColor,
        backgroundColor: brandSubtle,
      }
    : null;
  const activeButtonHoveredStyle = isActive
    ? {
        backgroundColor: brandSubtle,
        borderColor: brandColor,
      }
    : null;

  const isWeb = Platform.OS === 'web';

  return (
    <Pressable
      style={({ pressed, hovered }) => [
        styles.button,
        activeButtonStyle,
        isWeb && hovered && !pressed && (activeButtonHoveredStyle ?? styles.buttonHovered),
        isWeb && pressed && styles.buttonPressed,
      ]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
    >
      <Ionicons
        name="options-outline"
        size={16}
        color={isActive ? brandColor : colors.labelPrimary}
      />
      {isActive ? (
        <View style={[styles.badge, { backgroundColor: brandColor }]}>
          <Text style={[styles.badgeText, { color: brandOn }]}>{activeCount}</Text>
        </View>
      ) : null}
    </Pressable>
  );
}
