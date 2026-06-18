import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { GetStartedChecklistItem } from '@/lib/getStartedChecklist';
import {
  webFullBleedRowInsets,
  webHover,
  webListRowHoverStyles,
  webPointer,
} from '@/lib/webPressableStyles';
import { colorWithAlpha, useTheme, useThemedStyles } from '@/theme';

type GetStartedChecklistCardProps = {
  subtitle: string;
  items: GetStartedChecklistItem[];
  onDismiss: () => void;
};

export function GetStartedChecklistCard({
  subtitle,
  items,
  onDismiss,
}: GetStartedChecklistCardProps) {
  const { colors } = useTheme();
  const styles = useThemedStyles(({ colors, spacing, typography, isDark }) => ({
    card: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: isDark
        ? colorWithAlpha(colors.primary, 0.18)
        : colorWithAlpha(colors.primary, 0.12),
      padding: spacing.lg,
      gap: spacing.md,
    },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      gap: spacing.md,
    },
    headerText: {
      flex: 1,
      gap: spacing.xs,
    },
    title: { ...typography.body, fontWeight: '700', fontSize: 17 },
    subtitle: typography.subtitle,
    dismissButton: {
      width: 32,
      height: 32,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.fillSubtle,
      ...webPointer(),
    },
    dismissButtonPressed: {
      opacity: 0.75,
    },
    items: {
      gap: spacing.xs,
    },
    item: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: spacing.md,
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.sm,
      borderRadius: 12,
      ...webFullBleedRowInsets(spacing.lg),
      ...webPointer(),
    },
    itemPrimary: {
      backgroundColor: colorWithAlpha(colors.primary, isDark ? 0.08 : 0.05),
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colorWithAlpha(colors.primary, isDark ? 0.2 : 0.12),
    },
    itemHovered: webListRowHoverStyles(colors),
    itemPressed: {
      opacity: 0.88,
    },
    iconWrap: {
      width: 28,
      height: 28,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.fillSubtle,
      marginTop: 1,
    },
    iconWrapComplete: {
      backgroundColor: colorWithAlpha(colors.primary, 0.1),
    },
    textBlock: { flex: 1, gap: 2 },
    itemTitle: { ...typography.body, fontWeight: '600' },
    itemTitlePrimary: {
      color: colors.primary,
    },
    itemBody: { ...typography.subtitle, fontSize: 13, lineHeight: 18 },
  }));

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <View style={styles.headerText}>
          <Text style={styles.title}>Get started</Text>
          <Text style={styles.subtitle}>{subtitle}</Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Dismiss getting started checklist"
          onPress={onDismiss}
          hitSlop={8}
          style={({ pressed }) => [styles.dismissButton, pressed && styles.dismissButtonPressed]}>
          <Ionicons name="close" size={18} color={colors.labelSecondary} />
        </Pressable>
      </View>

      <View style={styles.items}>
        {items.map((item) => {
          const iconName = item.complete
            ? 'checkmark-circle'
            : item.primary
              ? 'alert-circle-outline'
              : 'ellipse-outline';
          const iconColor = item.complete
            ? colors.primary
            : item.primary
              ? colors.primary
              : colors.labelSecondary;

          return (
            <Pressable
              key={item.id}
              style={({ pressed, hovered }) => [
                styles.item,
                item.primary && !item.complete ? styles.itemPrimary : null,
                webHover(hovered, pressed, styles.itemHovered),
                pressed && styles.itemPressed,
              ]}
              onPress={item.onPress}>
              <View style={[styles.iconWrap, item.complete ? styles.iconWrapComplete : null]}>
                <Ionicons name={iconName} size={16} color={iconColor} />
              </View>
              <View style={styles.textBlock}>
                <Text
                  style={[
                    styles.itemTitle,
                    item.primary && !item.complete ? styles.itemTitlePrimary : null,
                  ]}>
                  {item.title}
                </Text>
                <Text style={styles.itemBody}>{item.body}</Text>
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
