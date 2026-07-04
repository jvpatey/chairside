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

import { LiquidGlassSurface } from '@/components/ui/LiquidGlassSurface';
import { SHEET_ENTER } from '@/components/ui/sheetAnimations';
import { useWebEscapeKey } from '@/hooks/useWebEscapeKey';
import {
  webHover,
  webListRowHoverStyles,
  webPointer,
  webTextLinkHoverStyles,
} from '@/lib/webPressableStyles';
import { useThemedStyles } from '@/theme';

export type ActionMenuSheetItem = {
  label: string;
  destructive?: boolean;
  icon?: ReactNode;
  onPress: () => void;
};

export type ActionMenuSheetProps = {
  visible: boolean;
  title?: string;
  message?: string;
  actions: ActionMenuSheetItem[];
  onClose: () => void;
};

/** Bottom-anchored action sheet — native and mobile web. */
export function ActionMenuSheetBottom({
  visible,
  title,
  message,
  actions,
  onClose,
}: ActionMenuSheetProps) {
  const insets = useSafeAreaInsets();
  useWebEscapeKey(onClose, visible);

  const styles = useThemedStyles(({ colors, spacing, typography }) => ({
    root: {
      flex: 1,
      justifyContent: 'flex-end',
    },
    backdrop: {
      ...StyleSheet.absoluteFillObject,
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
      borderBottomColor: colors.separator,
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
    actions: {
      borderRadius: 12,
      overflow: 'hidden',
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.separator,
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
      justifyContent: 'center',
      gap: spacing.sm,
    },
    actionIcon: {
      width: 22,
      alignItems: 'center',
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
      color: colors.primary,
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
            <LiquidGlassSurface borderRadius={20} style={styles.sheet}>
              <View style={styles.handle} />
              {title || message ? (
                <View style={styles.header}>
                  {title ? <Text style={styles.title}>{title}</Text> : null}
                  {message ? <Text style={styles.message}>{message}</Text> : null}
                </View>
              ) : null}
              <View style={styles.actions}>
                {actions.map((action, index) => (
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
                      <Text
                        style={[
                          styles.actionLabel,
                          action.destructive && styles.actionDestructive,
                        ]}
                      >
                        {action.label}
                      </Text>
                    </View>
                  </Pressable>
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
            </LiquidGlassSurface>
          </Animated.View>
        ) : null}
      </View>
    </Modal>
  );
}

export function ActionMenuSheet(props: ActionMenuSheetProps) {
  return <ActionMenuSheetBottom {...props} />;
}
