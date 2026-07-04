import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { ProgressRing } from '@/components/dashboard/ProgressRing';
import type { GetStartedChecklistItem } from '@/lib/getStartedChecklist';
import {
  webFullBleedRowInsets,
  webHover,
  webListRowHoverStyles,
  webPointer,
} from '@/lib/webPressableStyles';
import { colorWithAlpha, fontBold, fontRegular, useTheme, useThemedStyles } from '@/theme';

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
  const [expanded, setExpanded] = useState(false);
  const completedCount = useMemo(() => items.filter((item) => item.complete).length, [items]);
  const nextItem = useMemo(
    () => items.find((item) => !item.complete) ?? items[0],
    [items],
  );

  const styles = useThemedStyles(({ colors, spacing, typography, radii, isDark }) => ({
    card: {
      backgroundColor: colors.surface,
      borderRadius: radii.lg,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: isDark
        ? colorWithAlpha(colors.primary, 0.2)
        : colorWithAlpha(colors.primary, 0.12),
      overflow: 'hidden',
    },
    collapsed: {
      padding: spacing.md,
      gap: spacing.sm,
    },
    collapsedRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
    },
    collapsedText: {
      flex: 1,
      minWidth: 0,
      gap: 2,
    },
    title: {
      ...typography.body,
      fontWeight: '700',
      fontSize: 16,
    },
    subtitle: {
      ...typography.subtitle,
      fontSize: 13,
      lineHeight: 18,
    },
    nextTitle: {
      fontSize: 14,
      lineHeight: 20,
      fontFamily: fontBold,
      fontWeight: '600',
      color: colors.primary,
    },
    controls: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
    },
    iconButton: {
      width: 32,
      height: 32,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.fillSubtle,
      ...webPointer(),
    },
    expandedHeader: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      gap: spacing.md,
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.lg,
      paddingBottom: spacing.sm,
    },
    items: {
      gap: spacing.xs,
      paddingHorizontal: spacing.sm,
      paddingBottom: spacing.lg,
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
    itemTitle: { ...typography.body, fontWeight: '600', fontSize: 15 },
    itemTitlePrimary: {
      color: colors.primary,
    },
    itemBody: { ...typography.subtitle, fontSize: 13, lineHeight: 18 },
  }));

  if (!nextItem) return null;

  return (
    <View style={styles.card}>
      {expanded ? (
        <>
          <View style={styles.expandedHeader}>
            <View style={{ flex: 1, gap: 4 }}>
              <Text style={styles.title}>Get started</Text>
              <Text style={styles.subtitle}>{subtitle}</Text>
            </View>
            <View style={styles.controls}>
              <ProgressRing completed={completedCount} total={items.length} />
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Collapse getting started checklist"
                onPress={() => setExpanded(false)}
                style={styles.iconButton}>
                <Ionicons name="chevron-up" size={18} color={colors.labelSecondary} />
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Dismiss getting started checklist"
                onPress={onDismiss}
                hitSlop={8}
                style={styles.iconButton}>
                <Ionicons name="close" size={18} color={colors.labelSecondary} />
              </Pressable>
            </View>
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
        </>
      ) : (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Getting started. ${completedCount} of ${items.length} complete. Next: ${nextItem.title}`}
          onPress={() => setExpanded(true)}
          style={({ pressed }) => [styles.collapsed, pressed && { opacity: 0.92 }]}>
          <View style={styles.collapsedRow}>
            <ProgressRing completed={completedCount} total={items.length} />
            <View style={styles.collapsedText}>
              <Text style={styles.title}>
                {completedCount} of {items.length} complete
              </Text>
              <Text style={styles.nextTitle} numberOfLines={1}>
                Next: {nextItem.title}
              </Text>
              <Text style={styles.subtitle} numberOfLines={1}>
                {subtitle}
              </Text>
            </View>
            <View style={styles.controls}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Dismiss getting started checklist"
                onPress={(event) => {
                  event.stopPropagation();
                  onDismiss();
                }}
                hitSlop={8}
                style={styles.iconButton}>
                <Ionicons name="close" size={18} color={colors.labelSecondary} />
              </Pressable>
              <Ionicons name="chevron-down" size={18} color={colors.labelSecondary} />
            </View>
          </View>
        </Pressable>
      )}
    </View>
  );
}
