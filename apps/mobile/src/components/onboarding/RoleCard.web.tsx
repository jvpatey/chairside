import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Pressable, Text, View, type ViewStyle } from 'react-native';

import { webCardLiftBase, webOnlyStyle, webPointer } from '@/lib/webPressableStyles';
import { useTheme, useThemedStyles } from '@/theme';
import { getWebShadow } from '@/theme/web';

type RoleCardProps = {
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  selected: boolean;
  onPress: () => void;
  variant?: 'list' | 'tile';
};

export function RoleCard({
  title,
  description,
  icon,
  selected,
  onPress,
  variant = 'tile',
}: RoleCardProps) {
  const { colors } = useTheme();
  const isTile = variant === 'tile';

  const styles = useThemedStyles(({ colors, spacing, typography, isDark }) => ({
    card: {
      flexDirection: isTile ? ('column' as const) : ('row' as const),
      alignItems: isTile ? ('stretch' as const) : ('flex-start' as const),
      gap: isTile ? spacing.md : spacing.md,
      backgroundColor: colors.surface,
      borderRadius: 16,
      borderWidth: 2,
      borderColor: colors.separator,
      padding: spacing.lg,
      minHeight: isTile ? 168 : 44,
      flex: isTile ? 1 : undefined,
      minWidth: isTile ? 0 : undefined,
      ...webPointer(),
      ...webCardLiftBase(),
    },
    cardSelected: {
      backgroundColor: colors.primarySubtle,
      borderColor: colors.primary,
      ...webOnlyStyle({
        backgroundImage: isDark
          ? 'linear-gradient(135deg, rgba(74, 154, 255, 0.14) 0%, rgba(28, 28, 30, 0.95) 100%)'
          : 'linear-gradient(135deg, rgba(26, 111, 212, 0.1) 0%, rgba(255, 255, 255, 1) 100%)',
        boxShadow: getWebShadow(isDark, 'subtle'),
      } as ViewStyle),
    },
    cardHovered: webOnlyStyle({
      borderColor: colors.labelTertiary,
      boxShadow: getWebShadow(isDark, 'subtle'),
    } as ViewStyle),
    cardSelectedHovered: webOnlyStyle({
      borderColor: colors.primary,
      boxShadow: isDark
        ? '0 8px 24px rgba(74, 154, 255, 0.2)'
        : '0 8px 24px rgba(26, 111, 212, 0.16)',
    } as ViewStyle),
    topRow: {
      flexDirection: 'row' as const,
      alignItems: 'flex-start' as const,
      justifyContent: 'space-between' as const,
      gap: spacing.sm,
    },
    content: {
      flex: isTile ? undefined : 1,
      minWidth: 0,
      gap: spacing.xs,
    },
    titleRow: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: spacing.sm,
    },
    title: {
      ...typography.body,
      fontSize: isTile ? 18 : 17,
      lineHeight: isTile ? 24 : 24,
      fontWeight: '600',
      color: colors.labelPrimary,
      flex: isTile ? undefined : 1,
    },
    description: {
      ...typography.subtitle,
      fontSize: 15,
      lineHeight: 22,
    },
    check: {
      width: 24,
      height: 24,
      borderRadius: 12,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      backgroundColor: colors.primary,
      flexShrink: 0,
    },
    checkPlaceholder: {
      width: 24,
      height: 24,
      flexShrink: 0,
    },
  }));

  const handlePress = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  const iconColor = selected ? colors.primary : colors.labelSecondary;
  const checkNode = selected ? (
    <View style={styles.check}>
      <Ionicons name="checkmark" size={15} color={colors.primaryOnPrimary} />
    </View>
  ) : (
    <View style={styles.checkPlaceholder} />
  );

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={`${title}. ${description}`}
      onPress={handlePress}
      style={({ pressed, hovered }) => [
        styles.card,
        selected && styles.cardSelected,
        hovered && !pressed && (selected ? styles.cardSelectedHovered : styles.cardHovered),
        pressed && { opacity: 0.88 },
      ]}
    >
      {isTile ? (
        <>
          <View style={styles.topRow}>
            <Ionicons name={icon} size={24} color={iconColor} />
            {checkNode}
          </View>
          <View style={styles.content}>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.description}>{description}</Text>
          </View>
        </>
      ) : (
        <>
          <View style={styles.content}>
            <View style={styles.titleRow}>
              <Ionicons name={icon} size={22} color={iconColor} />
              <Text style={styles.title}>{title}</Text>
            </View>
            <Text style={styles.description}>{description}</Text>
          </View>
          {checkNode}
        </>
      )}
    </Pressable>
  );
}
