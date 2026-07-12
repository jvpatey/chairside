import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text } from 'react-native';

import { webHover, webListRowHoverStyles, webPointer } from '@/lib/webPressableStyles';
import { useTheme, useThemedStyles } from '@/theme';

type ClinicDiscoverBrowseLinkProps = {
  title: string;
  onPress: () => void;
};

export function ClinicDiscoverBrowseLink({ title, onPress }: ClinicDiscoverBrowseLinkProps) {
  const { colors } = useTheme();
  const styles = useThemedStyles(({ colors, spacing, typography }) => ({
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
      paddingVertical: spacing.xs,
      borderRadius: 8,
      ...webPointer(),
    },
    rowHovered: webListRowHoverStyles(colors),
    rowPressed: {
      opacity: 0.7,
    },
    label: {
      ...typography.subtitle,
      flex: 1,
      fontSize: 14,
      lineHeight: 18,
      fontWeight: '500',
      color: colors.labelSecondary,
    },
  }));

  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => {
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress();
      }}
      style={({ pressed, hovered }) => [
        styles.row,
        webHover(hovered, pressed, styles.rowHovered),
        pressed && styles.rowPressed,
      ]}>
      <Ionicons name="compass-outline" size={15} color={colors.labelTertiary} />
      <Text style={styles.label} numberOfLines={1}>
        {title}
      </Text>
      <Ionicons name="chevron-forward" size={14} color={colors.labelTertiary} />
    </Pressable>
  );
}
