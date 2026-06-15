import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Pressable, Text, View } from 'react-native';

import { GradientHairline } from '@/components/ui/GradientHairline';
import {
  webFullBleedRowInsets,
  webHover,
  webListRowHoverStyles,
  webPointer,
} from '@/lib/webPressableStyles';
import { useTabAtmosphereAccent } from '@/contexts/TabAtmosphereContext';
import { useTheme, useThemedStyles, type GradientAccent } from '@/theme';

type CardExpandToggleProps = {
  expanded: boolean;
  onPress: () => void;
  bleedPadding?: number;
  /** When true, skip row hover styling (parent card owns hover). */
  suppressHover?: boolean;
  accent?: GradientAccent;
};

export function CardExpandToggle({
  expanded,
  onPress,
  bleedPadding,
  suppressHover = false,
  accent,
}: CardExpandToggleProps) {
  const { colors } = useTheme();
  const tabAccent = useTabAtmosphereAccent();
  const resolvedAccent = accent ?? tabAccent;
  const brandColor = resolvedAccent === 'secondary' ? colors.secondary : colors.primary;

  const styles = useThemedStyles(({ spacing, colors }) => ({
    toggleWrap: {
      marginTop: spacing.xs,
      gap: spacing.xs,
    },
    toggle: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.xs,
      paddingTop: spacing.xs,
      paddingBottom: spacing.xs,
      borderRadius: 10,
      ...(bleedPadding != null ? webFullBleedRowInsets(bleedPadding) : null),
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
    <View style={styles.toggleWrap}>
      <GradientHairline />
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
