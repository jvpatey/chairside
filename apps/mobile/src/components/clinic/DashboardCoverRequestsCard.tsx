import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';

import { webHover, webListRowHoverStyles, webPointer } from '@/lib/webPressableStyles';
import { useTheme, useThemedStyles } from '@/theme';

type DashboardCoverRequestsCardProps = {
  pendingCount: number;
  onPress: () => void;
};

export function DashboardCoverRequestsCard({
  pendingCount,
  onPress,
}: DashboardCoverRequestsCardProps) {
  const { colors } = useTheme();

  const styles = useThemedStyles(({ colors, spacing, typography }) => ({
    card: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.separator,
      overflow: 'hidden',
      ...webPointer(),
    },
    cardHovered: webListRowHoverStyles(colors),
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
      backgroundColor: colors.primarySubtle,
    },
    title: {
      ...typography.body,
      fontWeight: '600',
      color: colors.primary,
      flex: 1,
    },
    chevron: {
      padding: spacing.xs,
    },
  }));

  if (pendingCount <= 0) return null;

  const label =
    pendingCount === 1 ? '1 cover request needs review' : `${pendingCount} cover requests need review`;

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed, hovered }) => [
        styles.card,
        webHover(hovered, pressed, styles.cardHovered),
        pressed && { opacity: 0.92 },
      ]}>
      <View style={styles.row}>
        <Ionicons name="calendar" size={18} color={colors.primary} />
        <Text style={styles.title}>{label}</Text>
        <Ionicons name="chevron-forward" size={18} color={colors.primary} style={styles.chevron} />
      </View>
    </Pressable>
  );
}
