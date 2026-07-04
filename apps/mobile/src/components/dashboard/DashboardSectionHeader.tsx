import * as Haptics from 'expo-haptics';
import { Pressable, Text, View } from 'react-native';

import { fontSemibold, useThemedStyles } from '@/theme';
import { webHover, webListRowHoverStyles, webPointer } from '@/lib/webPressableStyles';

type DashboardSectionHeaderProps = {
  title: string;
  /** When true, uses tighter spacing for nested subsections inside overview panels. */
  compact?: boolean;
  actionLabel?: string;
  onActionPress?: () => void;
};

export function DashboardSectionHeader({
  title,
  compact = false,
  actionLabel,
  onActionPress,
}: DashboardSectionHeaderProps) {
  const styles = useThemedStyles(({ spacing, typography, colors }) => ({
    header: {
      marginBottom: compact ? spacing.xs : spacing.sm,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: spacing.sm,
    },
    title: {
      ...typography.label,
      fontFamily: fontSemibold,
      fontSize: compact ? 13 : 15,
      color: typography.subtitle.color,
      flex: 1,
    },
    actionPressable: {
      borderRadius: 8,
      paddingHorizontal: 4,
      paddingVertical: 2,
      ...webPointer(),
    },
    actionHovered: webListRowHoverStyles(colors),
    action: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.primary,
    },
  }));

  return (
    <View style={styles.header}>
      <Text style={styles.title}>{title}</Text>
      {actionLabel && onActionPress ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={actionLabel}
          onPress={() => {
            void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onActionPress();
          }}
          style={({ pressed, hovered }) => [
            styles.actionPressable,
            webHover(hovered, pressed, styles.actionHovered),
          ]}>
          <Text style={styles.action}>{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}
