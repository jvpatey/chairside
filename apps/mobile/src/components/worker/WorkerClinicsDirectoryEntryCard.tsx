import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Platform, Pressable, Text, View } from 'react-native';

import { IS_WEB, webPointer, webTextLinkHoverStyles } from '@/lib/webPressableStyles';
import { useTheme, useThemedStyles } from '@/theme';

type WorkerClinicsDirectoryIconButtonProps = {
  onPress: () => void;
};

export function WorkerClinicsDirectoryIconButton({ onPress }: WorkerClinicsDirectoryIconButtonProps) {
  const { colors } = useTheme();

  const styles = useThemedStyles(({ colors }) => ({
    button: {
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
  }));

  const handlePress = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Message a clinic"
      accessibilityHint="Browse clinics you can message without an open role"
      onPress={handlePress}
      style={({ pressed, hovered }) => [
        styles.button,
        IS_WEB && hovered && !pressed && styles.buttonHovered,
        pressed && styles.buttonPressed,
      ]}>
      <Ionicons name="business-outline" size={20} color={colors.labelPrimary} />
    </Pressable>
  );
}

type WorkerClinicsDirectoryEntryCardProps = {
  onPress: () => void;
  variant?: 'prominent' | 'subtle';
};

export function WorkerClinicsDirectoryEntryCard({
  onPress,
  variant = 'prominent',
}: WorkerClinicsDirectoryEntryCardProps) {
  const { colors } = useTheme();
  const isSubtle = variant === 'subtle';

  const styles = useThemedStyles(({ colors, spacing, typography }) => ({
    card: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.separator,
      overflow: 'hidden',
      ...webPointer(),
    },
    cardHovered: {
      borderColor: colors.separator,
      ...webTextLinkHoverStyles(colors),
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      padding: spacing.md,
    },
    rowPressed: { opacity: 0.92 },
    iconWrap: {
      width: 40,
      height: 40,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.primarySubtle,
      flexShrink: 0,
    },
    textWrap: {
      flex: 1,
      minWidth: 0,
      gap: spacing.xs,
    },
    title: {
      ...typography.body,
      fontSize: 16,
      lineHeight: 21,
      fontWeight: '600',
      color: colors.labelPrimary,
    },
    body: {
      ...typography.subtitle,
      fontSize: 13,
      lineHeight: 18,
      color: colors.labelSecondary,
    },
    subtlePressable: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'flex-end',
      gap: spacing.xs,
      alignSelf: 'stretch',
      paddingVertical: spacing.xs,
      borderRadius: 8,
      ...webPointer(),
    },
    subtlePressableHovered: webTextLinkHoverStyles(colors),
    subtleLabel: {
      ...typography.subtitle,
      fontSize: 13,
      lineHeight: 18,
      color: colors.labelSecondary,
    },
  }));

  const handlePress = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  if (isSubtle) {
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Message a clinic"
        accessibilityHint="Opens clinics you can message without an open role"
        onPress={handlePress}
        style={({ pressed, hovered }) => [
          styles.subtlePressable,
          IS_WEB && hovered && !pressed && styles.subtlePressableHovered,
          pressed && styles.rowPressed,
        ]}>
        <Text style={styles.subtleLabel}>Message a clinic</Text>
        <Ionicons name="chevron-forward" size={14} color={colors.labelTertiary} />
      </Pressable>
    );
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Message a clinic. Reach out even without an open role."
      onPress={handlePress}
      style={({ pressed, hovered }) => [
        styles.card,
        IS_WEB && hovered && !pressed && styles.cardHovered,
        pressed && styles.rowPressed,
      ]}>
      <View style={styles.row}>
        <View style={styles.iconWrap}>
          <Ionicons name="business-outline" size={20} color={colors.primary} />
        </View>
        <View style={styles.textWrap}>
          <Text style={styles.title}>Message a clinic</Text>
          <Text style={styles.body}>
            Reach out to clinics in your province, even if they do not have a role posted right now.
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={colors.labelTertiary} />
      </View>
    </Pressable>
  );
}
