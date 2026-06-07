import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Platform, Pressable, Text, View, type ViewStyle } from 'react-native';

import { webOnlyStyle, webPointer } from '@/lib/webPressableStyles';
import { useTheme, useThemedStyles } from '@/theme';

type RoleCardProps = {
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  selected: boolean;
  onPress: () => void;
};

export function RoleCard({
  title,
  description,
  icon,
  selected,
  onPress,
}: RoleCardProps) {
  const { colors } = useTheme();
  const styles = useThemedStyles(({ colors, spacing, typography, isDark }) => ({
    card: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      backgroundColor: colors.surface,
      borderRadius: 12,
      borderWidth: 2,
      borderColor: colors.separator,
      padding: spacing.lg,
      minHeight: 44,
      ...webPointer(),
    },
    cardSelected: {
      backgroundColor: colors.primarySubtle,
      borderColor: colors.primary,
    },
    cardHovered: webOnlyStyle({
      backgroundColor: colors.backgroundGrouped,
      borderColor: colors.labelTertiary,
      boxShadow: isDark
        ? '0 6px 18px rgba(0, 0, 0, 0.22)'
        : '0 4px 14px rgba(0, 0, 0, 0.08)',
    } as ViewStyle),
    cardSelectedHovered: webOnlyStyle({
      borderColor: colors.primary,
      boxShadow: isDark
        ? '0 6px 18px rgba(74, 154, 255, 0.18)'
        : '0 4px 14px rgba(26, 111, 212, 0.14)',
    } as ViewStyle),
    iconWrap: {
      width: 40,
      height: 40,
      borderRadius: 10,
      backgroundColor: colors.fillSubtle,
      alignItems: 'center',
      justifyContent: 'center',
    },
    iconWrapSelected: {
      backgroundColor: colors.primary,
    },
    textBlock: {
      flex: 1,
      gap: spacing.xs,
    },
    title: {
      ...typography.body,
      fontWeight: '600',
      color: colors.labelPrimary,
    },
    description: {
      ...typography.subtitle,
      minHeight: typography.subtitle.lineHeight * 2,
    },
  }));

  const handlePress = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  const isWeb = Platform.OS === 'web';

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={`${title}. ${description}`}
      onPress={handlePress}
      style={({ pressed, hovered }) => [
        styles.card,
        selected && styles.cardSelected,
        isWeb && hovered && !pressed && (selected ? styles.cardSelectedHovered : styles.cardHovered),
        pressed && { opacity: 0.85 },
      ]}>
      <View style={[styles.iconWrap, selected && styles.iconWrapSelected]}>
        <Ionicons
          name={icon}
          size={22}
          color={selected ? colors.primaryOnPrimary : colors.labelSecondary}
        />
      </View>
      <View style={styles.textBlock}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.description}>{description}</Text>
      </View>
    </Pressable>
  );
}
