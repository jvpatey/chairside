import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

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
  onPress: () => void;
};

type ActionMenuSheetProps = {
  visible: boolean;
  title?: string;
  message?: string;
  actions: ActionMenuSheetItem[];
  onClose: () => void;
};

export function ActionMenuSheet({
  visible,
  title,
  message,
  actions,
  onClose,
}: ActionMenuSheetProps) {
  const insets = useSafeAreaInsets();

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
      backgroundColor: colors.surface,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
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
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <View style={styles.root}>
        <Pressable
          style={styles.backdrop}
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Close menu"
        />
        <View style={styles.sheet}>
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
                <Text
                  style={[
                    styles.actionLabel,
                    action.destructive && styles.actionDestructive,
                  ]}
                >
                  {action.label}
                </Text>
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
        </View>
      </View>
    </Modal>
  );
}
