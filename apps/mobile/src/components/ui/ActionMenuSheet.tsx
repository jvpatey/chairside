import { Ionicons } from '@expo/vector-icons';
import type { ReactNode } from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { SheetSurface } from '@/components/ui/SheetSurface';
import { SHEET_ENTER } from '@/components/ui/sheetAnimations';
import { useWebEscapeKey } from '@/hooks/useWebEscapeKey';
import {
  webHover,
  webListRowHoverStyles,
  webPointer,
  webTextLinkHoverStyles,
} from '@/lib/webPressableStyles';
import { colorWithAlpha, useTheme, useThemedStyles } from '@/theme';

/** One line in a checklist-style confirm (e.g. missing profile fields). */
export type ActionMenuSheetDetail = {
  label: string;
  /** Plain-language reason shown under the label. */
  hint?: string;
};

export type ActionMenuSheetItem = {
  label: string;
  /** Quiet trailing status (e.g. Text alerts · On). */
  detail?: string;
  /** Optional color for `detail` (e.g. success when Text alerts are on). */
  detailColor?: string;
  destructive?: boolean;
  /** Starts a new visual group above this action (e.g. sign out below navigation). */
  sectionBreakBefore?: boolean;
  icon?: ReactNode;
  onPress: () => void;
};

export type ActionMenuSheetProps = {
  visible: boolean;
  title?: string;
  message?: string;
  /** Checklist rows shown under the message (confirm dialogs). */
  details?: ActionMenuSheetDetail[];
  /** Replaces title/message when set (e.g. account summary header). */
  headerContent?: ReactNode;
  actions: ActionMenuSheetItem[];
  onClose: () => void;
};

/** Splits actions into groups at each `sectionBreakBefore`; shared by the native sheet and web dialog. */
export function groupActionItems(actions: ActionMenuSheetItem[]): ActionMenuSheetItem[][] {
  const groups: ActionMenuSheetItem[][] = [];
  actions.forEach((action, index) => {
    if (index === 0 || action.sectionBreakBefore) {
      groups.push([action]);
    } else {
      groups[groups.length - 1].push(action);
    }
  });
  return groups;
}

/** Checklist of details still needed; shared by the native sheet and web dialog. */
export function ActionMenuDetailList({ items }: { items: ActionMenuSheetDetail[] }) {
  const styles = useThemedStyles(({ colors }) => ({
    list: {
      marginTop: 12,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.separator,
      backgroundColor: colors.surface,
      overflow: 'hidden' as const,
    },
    row: {
      flexDirection: 'row' as const,
      alignItems: 'flex-start' as const,
      gap: 12,
      paddingVertical: 12,
      paddingHorizontal: 14,
    },
    rowDivider: {
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.separator,
    },
    bullet: {
      width: 22,
      height: 22,
      borderRadius: 11,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      backgroundColor: colors.primarySubtle,
      marginTop: 1,
    },
    copy: {
      flex: 1,
      minWidth: 0,
      gap: 2,
    },
    label: {
      fontSize: 15,
      fontWeight: '600' as const,
      color: colors.labelPrimary,
    },
    hint: {
      fontSize: 13,
      lineHeight: 18,
      color: colors.labelSecondary,
    },
  }));
  const { colors } = useTheme();

  return (
    <View style={styles.list} accessibilityRole="list">
      {items.map((item, index) => (
        <View
          key={item.label}
          accessibilityRole="listitem"
          style={[styles.row, index > 0 && styles.rowDivider]}>
          <View style={styles.bullet}>
            <Ionicons name="ellipse" size={7} color={colors.primary} />
          </View>
          <View style={styles.copy}>
            <Text style={styles.label}>{item.label}</Text>
            {item.hint ? <Text style={styles.hint}>{item.hint}</Text> : null}
          </View>
        </View>
      ))}
    </View>
  );
}

/** Bottom-anchored action sheet — native and mobile web. */
export function ActionMenuSheetBottom({
  visible,
  title,
  message,
  details,
  headerContent,
  actions,
  onClose,
}: ActionMenuSheetProps) {
  const insets = useSafeAreaInsets();
  useWebEscapeKey(onClose, visible);

  const styles = useThemedStyles(({ colors, spacing, typography, isDark }) => ({
    root: {
      flex: 1,
      justifyContent: 'flex-end',
    },
    backdrop: {
      ...StyleSheet.absoluteFill,
      backgroundColor: 'rgba(0,0,0,0.45)',
    },
    sheet: {
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.md,
      paddingBottom: Math.max(insets.bottom, spacing.lg),
    },
    handle: {
      alignSelf: 'center',
      width: 36,
      height: 4,
      borderRadius: 999,
      backgroundColor: colors.separator,
      marginBottom: spacing.md,
    },
    header: {
      marginBottom: spacing.md,
      paddingBottom: spacing.md,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colorWithAlpha(colors.labelPrimary, isDark ? 0.12 : 0.1),
      gap: spacing.xs,
    },
    title: {
      ...typography.body,
      fontSize: 17,
      fontWeight: '600',
      color: colors.labelPrimary,
    },
    message: {
      ...typography.subtitle,
      fontSize: 14,
      lineHeight: 20,
    },
    actionGroups: {
      gap: spacing.sm,
    },
    actions: {
      borderRadius: 12,
      overflow: 'hidden',
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colorWithAlpha(colors.labelPrimary, isDark ? 0.14 : 0.12),
    },
    action: {
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.md,
      alignItems: 'center',
      ...webPointer(),
    },
    actionContent: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'flex-start',
      gap: spacing.sm,
      width: '100%' as const,
    },
    actionIcon: {
      width: 22,
      alignItems: 'center',
    },
    actionLabelWrap: {
      flex: 1,
      minWidth: 0,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: spacing.sm,
    },
    actionHovered: webListRowHoverStyles(colors),
    actionPressed: {
      opacity: 0.88,
    },
    actionDivider: {
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.separator,
    },
    actionLabel: {
      fontSize: 17,
      fontWeight: '500',
      color: colors.labelPrimary,
      flexShrink: 1,
    },
    actionDetail: {
      fontSize: 15,
      fontWeight: '500',
      color: colors.labelTertiary,
      flexShrink: 0,
    },
    actionDestructive: {
      color: colors.destructive,
    },
    cancel: {
      marginTop: spacing.sm,
      paddingVertical: spacing.md,
      alignItems: 'center',
      borderRadius: 10,
      ...webPointer(),
    },
    cancelHovered: webTextLinkHoverStyles(colors),
    cancelPressed: {
      opacity: 0.88,
    },
    cancelLabel: {
      fontSize: 17,
      fontWeight: '600',
      color: colors.labelSecondary,
    },
  }));

  return (
    <Modal visible={visible} animationType="none" transparent onRequestClose={onClose}>
      <View style={styles.root}>
        <Pressable
          style={styles.backdrop}
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Close menu"
        />
        {visible ? (
          <Animated.View entering={SHEET_ENTER}>
            <SheetSurface borderRadius={20} style={styles.sheet}>
              <View style={styles.handle} />
              {headerContent ? (
                <View style={styles.header}>{headerContent}</View>
              ) : title || message || (details && details.length > 0) ? (
                <View style={styles.header}>
                  {title ? <Text style={styles.title}>{title}</Text> : null}
                  {message ? <Text style={styles.message}>{message}</Text> : null}
                  {details && details.length > 0 ? <ActionMenuDetailList items={details} /> : null}
                </View>
              ) : null}
              <View style={styles.actionGroups}>
                {groupActionItems(actions).map((group, groupIndex) => (
                <View key={groupIndex} style={styles.actions}>
                {group.map((action, index) => (
                  <Pressable
                    key={action.label}
                    accessibilityRole="button"
                    onPress={() => {
                      onClose();
                      action.onPress();
                    }}
                    style={({ pressed, hovered }) => [
                      styles.action,
                      index > 0 && styles.actionDivider,
                      webHover(hovered, pressed, styles.actionHovered),
                      pressed && styles.actionPressed,
                    ]}
                  >
                    <View style={styles.actionContent}>
                      {action.icon ? <View style={styles.actionIcon}>{action.icon}</View> : null}
                      <View style={styles.actionLabelWrap}>
                        <Text
                          style={[
                            styles.actionLabel,
                            action.destructive && styles.actionDestructive,
                          ]}
                          numberOfLines={1}>
                          {action.label}
                        </Text>
                        {action.detail ? (
                          <Text
                            style={[
                              styles.actionDetail,
                              action.detailColor ? { color: action.detailColor } : null,
                            ]}
                            numberOfLines={1}>
                            {action.detail}
                          </Text>
                        ) : null}
                      </View>
                    </View>
                  </Pressable>
                ))}
                </View>
                ))}
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Cancel"
                onPress={onClose}
                style={({ pressed, hovered }) => [
                  styles.cancel,
                  webHover(hovered, pressed, styles.cancelHovered),
                  pressed && styles.cancelPressed,
                ]}
              >
                <Text style={styles.cancelLabel}>Cancel</Text>
              </Pressable>
            </SheetSurface>
          </Animated.View>
        ) : null}
      </View>
    </Modal>
  );
}

export function ActionMenuSheet(props: ActionMenuSheetProps) {
  return <ActionMenuSheetBottom {...props} />;
}
