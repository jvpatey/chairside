import { Ionicons } from '@expo/vector-icons';
import { Platform, Pressable, Text, View } from 'react-native';

import { useTabAtmosphereAccent } from '@/contexts/TabAtmosphereContext';
import { resolveAccentColor, resolveAccentOnColor, resolveAccentSubtle } from '@/lib/accentColors';
import { webPointer } from '@/lib/webPressableStyles';
import { useTheme, useThemedStyles, type GradientAccent } from '@/theme';

type FilterTriggerButtonProps = {
  activeCount: number;
  onPress: () => void;
  accessibilityLabel?: string;
  accent?: GradientAccent;
  disabled?: boolean;
};

export function FilterTriggerButton({
  activeCount,
  onPress,
  accessibilityLabel = 'Filter',
  accent,
  disabled = false,
}: FilterTriggerButtonProps) {
  const { colors } = useTheme();
  const tabAccent = useTabAtmosphereAccent();
  const resolvedAccent = accent ?? tabAccent;
  const brandColor = resolveAccentColor(colors, resolvedAccent);
  const brandSubtle = resolveAccentSubtle(colors, resolvedAccent);
  const brandOn = resolveAccentOnColor(colors, resolvedAccent);
  const isActive = activeCount > 0;

  const styles = useThemedStyles(({ colors }) => ({
    button: {
      position: 'relative',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.separator,
      backgroundColor: colors.surface,
      width: 44,
      height: 44,
      flexShrink: 0,
      ...webPointer(),
    },
    buttonHovered: {
      backgroundColor: colors.backgroundGrouped,
      borderColor: colors.labelTertiary,
    },
    buttonPressed: {
      opacity: 0.85,
    },
    buttonActive: {
      borderColor: brandColor,
      backgroundColor: brandSubtle,
    },
    buttonActiveHovered: {
      backgroundColor: brandSubtle,
      borderColor: brandColor,
    },
    buttonDisabled: {
      opacity: 0.45,
    },
    badge: {
      position: 'absolute',
      top: -4,
      right: -4,
      minWidth: 18,
      height: 18,
      borderRadius: 9,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 4,
      borderWidth: 2,
      borderColor: colors.surface,
    },
    badgeText: {
      fontSize: 11,
      fontWeight: '700',
    },
  }));

  const isWeb = Platform.OS === 'web';

  return (
    <Pressable
      disabled={disabled}
      style={({ pressed, hovered }) => [
        styles.button,
        isActive && styles.buttonActive,
        disabled && styles.buttonDisabled,
        !disabled &&
          isWeb &&
          hovered &&
          !pressed &&
          (isActive ? styles.buttonActiveHovered : styles.buttonHovered),
        !disabled && isWeb && pressed && styles.buttonPressed,
      ]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      accessibilityLabel={
        isActive ? `${accessibilityLabel}, ${activeCount} active` : accessibilityLabel
      }
    >
      <Ionicons
        name="options-outline"
        size={20}
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
