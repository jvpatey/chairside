import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Platform, Pressable, Text, View, type ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

import { webOnlyStyle, webPointer } from '@/lib/webPressableStyles';
import { useTheme, useThemedStyles, type GradientAccent } from '@/theme';

const PRESS_SPRING = { damping: 15, stiffness: 400 } as const;

type RoleCardProps = {
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  selected: boolean;
  onPress: () => void;
  variant?: 'list' | 'tile';
  /** Brand accent when selected — clinics use primary, professionals secondary. */
  accent?: GradientAccent;
};

export function RoleCard({
  title,
  description,
  icon,
  selected,
  onPress,
  variant: _variant = 'list',
  accent = 'primary',
}: RoleCardProps) {
  const { colors } = useTheme();
  const scale = useSharedValue(1);
  const accentColor = accent === 'secondary' ? colors.secondary : colors.primary;
  const accentSubtle = accent === 'secondary' ? colors.secondarySubtle : colors.primarySubtle;
  const accentOn = accent === 'secondary' ? colors.secondaryOnSecondary : colors.primaryOnPrimary;

  const styles = useThemedStyles(({ colors, spacing, typography, radii, isDark }) => ({
    card: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: spacing.md,
      backgroundColor: colors.surface,
      borderRadius: radii.lg,
      borderWidth: 2,
      borderColor: colors.separator,
      padding: spacing.lg,
      minHeight: 44,
      ...webPointer(),
    },
    cardSelected: {
      backgroundColor: accentSubtle,
      borderColor: accentColor,
    },
    cardHovered: webOnlyStyle({
      backgroundColor: colors.backgroundGrouped,
      borderColor: colors.labelTertiary,
      boxShadow: isDark
        ? '0 6px 18px rgba(0, 0, 0, 0.22)'
        : '0 4px 14px rgba(0, 0, 0, 0.08)',
    } as ViewStyle),
    cardSelectedHovered: webOnlyStyle({
      borderColor: accentColor,
      boxShadow: isDark
        ? '0 6px 18px rgba(74, 154, 255, 0.18)'
        : '0 4px 14px rgba(26, 111, 212, 0.14)',
    } as ViewStyle),
    iconWrap: {
      width: 44,
      height: 44,
      borderRadius: radii.md,
      backgroundColor: colors.fillSubtle,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
    },
    iconWrapSelected: {
      backgroundColor: accentColor,
    },
    textBlock: {
      flex: 1,
      gap: spacing.xs,
    },
    title: {
      ...typography.body,
      fontWeight: '600' as const,
      color: colors.labelPrimary,
    },
    description: {
      ...typography.subtitle,
      minHeight: typography.subtitle.lineHeight * 2,
    },
    check: {
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: accentColor,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
    },
    checkPlaceholder: {
      width: 24,
      height: 24,
      borderRadius: 12,
      borderWidth: 2,
      borderColor: colors.separator,
    },
  }));

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePress = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  const isWeb = Platform.OS === 'web';

  return (
    <Animated.View style={animatedStyle}>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ selected }}
        accessibilityLabel={`${title}. ${description}`}
        onPress={handlePress}
        onPressIn={() => {
          scale.value = withSpring(0.98, PRESS_SPRING);
        }}
        onPressOut={() => {
          scale.value = withSpring(1, PRESS_SPRING);
        }}
        style={({ pressed, hovered }) => [
          styles.card,
          selected && styles.cardSelected,
          isWeb &&
            hovered &&
            !pressed &&
            (selected ? styles.cardSelectedHovered : styles.cardHovered),
        ]}>
        <View style={[styles.iconWrap, selected && styles.iconWrapSelected]}>
          <Ionicons
            name={icon}
            size={22}
            color={selected ? accentOn : colors.labelSecondary}
          />
        </View>
        <View style={styles.textBlock}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.description}>{description}</Text>
        </View>
        {selected ? (
          <View style={styles.check}>
            <Ionicons name="checkmark" size={15} color={accentOn} />
          </View>
        ) : (
          <View style={styles.checkPlaceholder} />
        )}
      </Pressable>
    </Animated.View>
  );
}
