import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';

import { RowDivider } from '@/components/clinic/DetailCard';
import {
  webFullBleedRowInsets,
  webHover,
  webListRowHoverStyles,
  webPointer,
} from '@/lib/webPressableStyles';
import { useTheme, useThemedStyles } from '@/theme';

type AccountSessionActionsProps = {
  isSigningOut: boolean;
  isDeleting: boolean;
  onSignOut: () => void;
  onDeleteAccount: () => void;
  deleteDescription: string;
};

type AccountActionRowProps = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  loading?: boolean;
  disabled?: boolean;
  destructive?: boolean;
  onPress: () => void;
};

function AccountActionRow({
  icon,
  label,
  loading,
  disabled,
  destructive,
  onPress,
  bleedPadding,
}: AccountActionRowProps & { bleedPadding?: number }) {
  const { colors } = useTheme();
  const styles = useThemedStyles(({ colors, spacing, typography }) => ({
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      paddingVertical: spacing.sm + 4,
      minHeight: 52,
      borderRadius: 10,
      ...(bleedPadding != null ? webFullBleedRowInsets(bleedPadding) : null),
      ...webPointer(disabled || loading ? 'default' : 'pointer'),
    },
    rowHovered: webListRowHoverStyles(colors),
    rowPressed: {
      opacity: 0.65,
    },
    iconWrap: {
      width: 36,
      height: 36,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: destructive ? `${colors.destructive}14` : colors.fillSubtle,
    },
    label: {
      flex: 1,
      ...typography.body,
      fontSize: 16,
      fontWeight: '500',
      color: destructive ? colors.destructive : colors.labelPrimary,
    },
  }));

  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled || loading}
      onPress={onPress}
      style={({ pressed, hovered }) => [
        styles.row,
        webHover(hovered, pressed, styles.rowHovered, disabled || loading),
        pressed && !disabled && !loading && styles.rowPressed,
      ]}>
      <View style={styles.iconWrap}>
        {loading ? (
          <ActivityIndicator size="small" color={destructive ? colors.destructive : colors.primary} />
        ) : (
          <Ionicons
            name={icon}
            size={20}
            color={destructive ? colors.destructive : colors.primary}
          />
        )}
      </View>
      <Text style={styles.label}>{label}</Text>
      {!loading ? (
        <Ionicons
          name="chevron-forward"
          size={18}
          color={destructive ? colors.destructive : colors.labelTertiary}
        />
      ) : null}
    </Pressable>
  );
}

export function AccountSessionActions({
  isSigningOut,
  isDeleting,
  onSignOut,
  onDeleteAccount,
  deleteDescription,
}: AccountSessionActionsProps) {
  const { spacing } = useTheme();
  const styles = useThemedStyles(({ colors, spacing, typography }) => ({
    card: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.separator,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.xs,
    },
    dangerBlock: {
      gap: spacing.sm,
      paddingVertical: spacing.sm + 4,
    },
    dangerTitle: {
      fontSize: 15,
      fontWeight: '600',
      color: colors.destructive,
    },
    dangerBody: {
      ...typography.subtitle,
      fontSize: 14,
      lineHeight: 20,
    },
  }));

  const busy = isSigningOut || isDeleting;

  return (
    <View style={styles.card}>
      <AccountActionRow
        icon="log-out-outline"
        label={isSigningOut ? 'Signing out…' : 'Sign out'}
        loading={isSigningOut}
        disabled={busy}
        bleedPadding={spacing.lg}
        onPress={onSignOut}
      />
      <RowDivider />
      <View style={styles.dangerBlock}>
        <Text style={styles.dangerTitle}>Delete account</Text>
        <Text style={styles.dangerBody}>{deleteDescription}</Text>
        <AccountActionRow
          icon="trash-outline"
          label={isDeleting ? 'Deleting account…' : 'Delete account'}
          loading={isDeleting}
          disabled={busy}
          destructive
          bleedPadding={spacing.lg}
          onPress={onDeleteAccount}
        />
      </View>
    </View>
  );
}
