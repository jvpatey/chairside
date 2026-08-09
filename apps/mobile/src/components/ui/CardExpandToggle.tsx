import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import {
  webHover,
  webListRowHoverStyles,
  webPointer,
} from '@/lib/webPressableStyles';
import { useTabAtmosphereAccent } from '@/contexts/TabAtmosphereContext';
import { radii, useTheme, useThemedStyles, type GradientAccent } from '@/theme';

type CardExpandToggleProps = {
  expanded: boolean;
  onPress: () => void;
  /** Horizontal inset for label row — matches card body padding. */
  contentPadding?: number;
  /** Rounds the footer control to the card bottom when it is the last row. */
  roundedBottom?: boolean;
  /** When true, skip row hover styling. */
  suppressHover?: boolean;
  accent?: GradientAccent;
};

export function CardExpandToggle({
  expanded,
  onPress,
  contentPadding,
  roundedBottom = false,
  suppressHover = false,
  accent,
}: CardExpandToggleProps) {
  const { colors } = useTheme();
  const tabAccent = useTabAtmosphereAccent();
  const resolvedAccent = accent ?? tabAccent;
  const brandColor = resolvedAccent === 'secondary' ? colors.secondary : colors.primary;

  const styles = useThemedStyles(({ spacing, colors }) => ({
    footer: {
      alignSelf: 'stretch',
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.separator,
      overflow: 'hidden',
      ...(roundedBottom
        ? {
            borderBottomLeftRadius: radii.lg,
            borderBottomRightRadius: radii.lg,
          }
        : null),
    },
    toggle: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.xs,
      minHeight: 44,
      paddingHorizontal: contentPadding ?? spacing.md,
      paddingVertical: spacing.sm + 2,
      alignSelf: 'stretch',
      ...(roundedBottom
        ? {
            borderBottomLeftRadius: radii.lg,
            borderBottomRightRadius: radii.lg,
          }
        : null),
      ...webPointer(),
    },
    toggleHovered: webListRowHoverStyles(colors),
    togglePressed: {
      opacity: 0.88,
    },
    toggleText: {
      fontSize: 14,
      fontWeight: '600',
      color: brandColor,
    },
  }));

  return (
    <View style={styles.footer}>
      <Pressable
        style={({ pressed, hovered }) => [
          styles.toggle,
          !suppressHover && webHover(hovered, pressed, styles.toggleHovered),
          pressed && styles.togglePressed,
        ]}
        accessibilityRole="button"
        accessibilityState={{ expanded }}
        onPress={() => {
          void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onPress();
        }}>
        <Text style={styles.toggleText}>{expanded ? 'Hide details' : 'View details'}</Text>
        <Ionicons
          name={expanded ? 'chevron-up' : 'chevron-down'}
          size={18}
          color={brandColor}
        />
      </Pressable>
    </View>
  );
}
