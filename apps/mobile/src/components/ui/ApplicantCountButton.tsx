import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { webHover, webListRowHoverStyles, webPointer } from '@/lib/webPressableStyles';
import { useTheme, useThemedStyles } from '@/theme';

type ApplicantCountButtonProps = {
  label: string;
  highlighted?: boolean;
  onPress?: () => void;
  accessibilityLabel?: string;
  showChevron?: boolean;
};

export function ApplicantCountButton({
  label,
  highlighted = false,
  onPress,
  accessibilityLabel,
  showChevron = true,
}: ApplicantCountButtonProps) {
  const { colors } = useTheme();

  const styles = useThemedStyles(({ colors, spacing }) => ({
    pressable: {
      borderRadius: 999,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: highlighted ? `${colors.primary}55` : colors.separator,
      backgroundColor: highlighted ? colors.primary : colors.primarySubtle,
      paddingVertical: spacing.xs + 1,
      paddingLeft: spacing.sm + 2,
      paddingRight: showChevron && onPress ? spacing.xs + 2 : spacing.sm + 2,
      minHeight: 30,
      alignSelf: 'flex-start',
      ...webPointer(onPress ? 'pointer' : 'default'),
    },
    pressableHovered: webListRowHoverStyles(colors),
    pressablePressed: {
      opacity: 0.88,
    },
    content: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
    },
    label: {
      fontSize: 13,
      fontWeight: '600',
      lineHeight: 18,
      color: highlighted ? colors.primaryOnPrimary : colors.primary,
    },
  }));

  const chevronColor = highlighted ? colors.primaryOnPrimary : colors.labelTertiary;

  const inner = (
    <View style={styles.content}>
      <Text style={styles.label} numberOfLines={1}>
        {label}
      </Text>
      {showChevron && onPress ? (
        <Ionicons name="chevron-forward" size={14} color={chevronColor} />
      ) : null}
    </View>
  );

  if (!onPress) {
    return <View style={styles.pressable}>{inner}</View>;
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      onPress={(event) => {
        event.stopPropagation?.();
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress();
      }}
      style={({ pressed, hovered }) => [
        styles.pressable,
        webHover(hovered, pressed, styles.pressableHovered),
        pressed && styles.pressablePressed,
      ]}>
      {inner}
    </Pressable>
  );
}
