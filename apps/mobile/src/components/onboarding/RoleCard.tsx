import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Pressable, Text, View } from 'react-native';

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
  const styles = useThemedStyles(({ colors, spacing, typography }) => ({
    card: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      backgroundColor: colors.surface,
      borderRadius: 12,
      borderWidth: 2,
      borderColor: colors.separator,
      padding: spacing.lg,
      minHeight: 96,
    },
    cardSelected: {
      backgroundColor: colors.primarySubtle,
      borderColor: colors.primary,
    },
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

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={`${title}. ${description}`}
      onPress={handlePress}
      style={({ pressed }) => [
        styles.card,
        selected && styles.cardSelected,
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
        <Text style={styles.description} numberOfLines={2}>
          {description}
        </Text>
      </View>
    </Pressable>
  );
}
