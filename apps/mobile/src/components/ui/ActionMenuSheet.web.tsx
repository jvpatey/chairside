import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';

import { OnboardingButton } from '@/components/onboarding/OnboardingButton';
import { WebDialogShell } from '@/components/ui/WebDialogShell.web';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';
import {
  webHover,
  webListRowHoverStyles,
  webPointer,
} from '@/lib/webPressableStyles';
import { radii } from '@/theme/tokens';
import { useTheme, useThemedStyles } from '@/theme';
import { webTypography } from '@/theme/web';

import {
  ActionMenuSheetBottom,
  type ActionMenuSheetProps,
} from './ActionMenuSheet.tsx';

function ActionMenuDialog({
  visible,
  title,
  message,
  actions,
  onClose,
}: ActionMenuSheetProps) {
  const { colors } = useTheme();
  const isConfirmDialog = Boolean(title && actions.length === 1);
  const confirmAction = actions[0];
  const isDestructiveConfirm = Boolean(confirmAction?.destructive);

  const styles = useThemedStyles(({ colors, spacing }) => ({
    header: {
      gap: spacing.sm,
      paddingRight: spacing.xl,
    },
    iconWrap: {
      width: 44,
      height: 44,
      borderRadius: radii.pill,
      alignItems: 'center',
      justifyContent: 'center',
      alignSelf: 'flex-start',
      backgroundColor: isDestructiveConfirm ? `${colors.destructive}18` : colors.primarySubtle,
      marginBottom: spacing.xs,
    },
    title: {
      ...webTypography.title,
      fontSize: 20,
      lineHeight: 26,
      letterSpacing: -0.35,
      color: colors.labelPrimary,
    },
    message: {
      ...webTypography.bodyLg,
      color: colors.labelSecondary,
    },
    actionList: {
      gap: spacing.xs,
      width: '100%' as const,
    },
    action: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.md,
      borderRadius: radii.md,
      width: '100%' as const,
      ...webPointer(),
    },
    actionHovered: webListRowHoverStyles(colors),
    actionPressed: {
      opacity: 0.88,
    },
    actionLabel: {
      fontSize: 15,
      fontWeight: '500',
      color: colors.labelPrimary,
    },
    actionDestructive: {
      color: colors.destructive,
    },
    confirmActions: {
      flexDirection: 'row',
      gap: spacing.sm,
      marginTop: spacing.xs,
      width: '100%' as const,
    },
    confirmButtonWrap: {
      flex: 1,
      minWidth: 0,
    },
    menuHeader: {
      gap: spacing.xs,
      paddingBottom: spacing.sm,
      borderBottomWidth: 1,
      borderBottomColor: colors.separator,
      marginBottom: spacing.xs,
    },
    menuTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.labelPrimary,
    },
    menuMessage: {
      fontSize: 14,
      lineHeight: 20,
      color: colors.labelSecondary,
    },
  }));

  return (
    <WebDialogShell
      visible={visible}
      onClose={onClose}
      maxWidth={isConfirmDialog ? 480 : 400}
      showCloseButton={!isConfirmDialog}
      backdropLabel="Close menu"
    >
      {isConfirmDialog && confirmAction ? (
        <>
          <View style={styles.header}>
            <View style={styles.iconWrap}>
              <Ionicons
                name={isDestructiveConfirm ? 'alert-circle-outline' : 'help-circle-outline'}
                size={22}
                color={isDestructiveConfirm ? colors.destructive : colors.primary}
              />
            </View>
            {title ? <Text style={styles.title}>{title}</Text> : null}
            {message ? <Text style={styles.message}>{message}</Text> : null}
          </View>
          <View style={styles.confirmActions}>
            <View style={styles.confirmButtonWrap}>
              <OnboardingButton
                label="Cancel"
                variant="secondary"
                onPress={onClose}
              />
            </View>
            <View style={styles.confirmButtonWrap}>
              <OnboardingButton
                label={confirmAction.label}
                variant={confirmAction.destructive ? 'destructive' : 'primary'}
                onPress={() => {
                  onClose();
                  confirmAction.onPress();
                }}
              />
            </View>
          </View>
        </>
      ) : (
        <>
          {title || message ? (
            <View style={styles.menuHeader}>
              {title ? <Text style={styles.menuTitle}>{title}</Text> : null}
              {message ? <Text style={styles.menuMessage}>{message}</Text> : null}
            </View>
          ) : null}
          <View style={styles.actionList}>
            {actions.map((action) => (
              <Pressable
                key={action.label}
                accessibilityRole="button"
                onPress={() => {
                  onClose();
                  action.onPress();
                }}
                style={({ pressed, hovered }) => [
                  styles.action,
                  webHover(hovered, pressed, styles.actionHovered),
                  pressed && styles.actionPressed,
                ]}
              >
                {action.icon ?? null}
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
        </>
      )}
    </WebDialogShell>
  );
}

/** Web: bottom sheet below tablet width, centered dialog at tablet+. */
export function ActionMenuSheet(props: ActionMenuSheetProps) {
  const { isTablet } = useResponsiveLayout();

  if (!isTablet) {
    return <ActionMenuSheetBottom {...props} />;
  }

  return <ActionMenuDialog {...props} />;
}

export type { ActionMenuSheetItem, ActionMenuSheetProps } from './ActionMenuSheet.tsx';
