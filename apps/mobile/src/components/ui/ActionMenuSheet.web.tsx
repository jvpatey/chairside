import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';

import { OnboardingButton } from '@/components/onboarding/OnboardingButton';
import { SurfaceCard } from '@/components/ui/SurfaceCard';
import { WebDialogShell } from '@/components/ui/WebDialogShell.web';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';
import {
  webHover,
  webListRowHoverStyles,
  webPointer,
} from '@/lib/webPressableStyles';
import { radii } from '@/theme/tokens';
import { fontSemibold, useTheme, useThemedStyles } from '@/theme';
import { webTypography } from '@/theme/web';

import {
  ActionMenuSheetBottom,
  type ActionMenuSheetProps,
} from './ActionMenuSheet.tsx';

function ActionMenuDialog({
  visible,
  title,
  message,
  headerContent,
  actions,
  onClose,
}: ActionMenuSheetProps) {
  const { colors } = useTheme();
  const isConfirmDialog = Boolean(title && actions.length === 1);
  const confirmAction = actions[0];
  const isDestructiveConfirm = Boolean(confirmAction?.destructive);
  const hasRichHeader = Boolean(headerContent);
  const stackConfirmActions = Boolean(
    isConfirmDialog && confirmAction && confirmAction.label.trim().length > 18,
  );

  const styles = useThemedStyles(({ colors, spacing }) => ({
    header: {
      gap: spacing.sm,
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
    actionRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      paddingVertical: spacing.sm + 4,
      paddingHorizontal: spacing.md,
      minHeight: 44,
      width: '100%' as const,
      borderBottomWidth: 1,
      borderBottomColor: colors.separator,
      ...webPointer(),
    },
    actionRowLast: {
      borderBottomWidth: 0,
    },
    actionCard: {
      overflow: 'hidden',
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
      alignItems: 'stretch',
      gap: spacing.sm,
      marginTop: spacing.xs,
      width: '100%' as const,
    },
    confirmActionsStacked: {
      flexDirection: 'column',
    },
    menuHeaderRich: {
      gap: spacing.xs,
    },
    menuHeaderWithTitle: {
      borderBottomWidth: 1,
      borderBottomColor: colors.separator,
      paddingBottom: spacing.sm,
    },
    sectionEyebrow: {
      fontSize: 11,
      lineHeight: 14,
      fontFamily: fontSemibold,
      fontWeight: '600',
      letterSpacing: 0.6,
      textTransform: 'uppercase' as const,
      color: colors.labelTertiary,
      paddingHorizontal: spacing.xs,
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
      maxWidth={isConfirmDialog ? 480 : hasRichHeader ? 440 : 400}
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
          <View
            style={[
              styles.confirmActions,
              stackConfirmActions && styles.confirmActionsStacked,
            ]}>
            {stackConfirmActions ? (
              <>
                <OnboardingButton
                  label={confirmAction.label}
                  variant={confirmAction.destructive ? 'destructive' : 'primary'}
                  onPress={() => {
                    onClose();
                    confirmAction.onPress();
                  }}
                />
                <OnboardingButton
                  label="Cancel"
                  variant="secondary"
                  onPress={onClose}
                />
              </>
            ) : (
              <>
                <OnboardingButton
                  label="Cancel"
                  variant="secondary"
                  split
                  onPress={onClose}
                />
                <OnboardingButton
                  label={confirmAction.label}
                  variant={confirmAction.destructive ? 'destructive' : 'primary'}
                  split
                  onPress={() => {
                    onClose();
                    confirmAction.onPress();
                  }}
                />
              </>
            )}
          </View>
        </>
      ) : (
        <>
          {headerContent ? (
            <View style={styles.menuHeaderRich}>{headerContent}</View>
          ) : title || message ? (
            <View style={[styles.menuHeaderRich, styles.menuHeaderWithTitle]}>
              {title ? <Text style={styles.menuTitle}>{title}</Text> : null}
              {message ? <Text style={styles.menuMessage}>{message}</Text> : null}
            </View>
          ) : null}
          <View>
            {hasRichHeader ? <Text style={styles.sectionEyebrow}>Menu</Text> : null}
            <SurfaceCard padding="none" style={styles.actionCard} elevationLevel="subtle">
              {actions.map((action, index) => (
                <Pressable
                  key={action.label}
                  accessibilityRole="button"
                  onPress={() => {
                    onClose();
                    action.onPress();
                  }}
                  style={({ pressed, hovered }) => [
                    styles.actionRow,
                    index === actions.length - 1 && styles.actionRowLast,
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
            </SurfaceCard>
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
