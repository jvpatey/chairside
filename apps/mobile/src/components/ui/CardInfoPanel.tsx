import type { ComponentProps, ReactNode } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { useTheme, useThemedStyles } from '@/theme';

import { cardShellRadii } from './cardLayout';

export type CardInfoPanelVariant = 'default' | 'info' | 'warning' | 'success';

type CardInfoPanelProps = {
  children: ReactNode;
  variant?: CardInfoPanelVariant;
  icon?: ComponentProps<typeof Ionicons>['name'];
  title?: string;
};

export function CardInfoPanel({
  children,
  variant = 'default',
  icon,
  title,
}: CardInfoPanelProps) {
  const { colors } = useTheme();

  const styles = useThemedStyles(({ colors, spacing, typography }) => ({
    panel: {
      borderRadius: cardShellRadii.inner,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.separator,
      paddingHorizontal: spacing.sm + 2,
      paddingVertical: spacing.sm,
      gap: spacing.xs,
    },
    panelDefault: {
      backgroundColor: colors.backgroundGrouped,
    },
    panelInfo: {
      backgroundColor: colors.secondarySubtle,
    },
    panelWarning: {
      backgroundColor: `${colors.warning}14`,
      borderColor: `${colors.warning}30`,
    },
    panelSuccess: {
      backgroundColor: `${colors.success}12`,
      borderColor: `${colors.success}30`,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    title: {
      ...typography.subtitle,
      fontSize: 14,
      fontWeight: '600',
      color: colors.labelPrimary,
      flex: 1,
    },
    body: {
      gap: spacing.xs,
    },
    bodyText: {
      ...typography.subtitle,
      fontSize: 14,
      lineHeight: 20,
    },
  }));

  const variantStyle =
    variant === 'info'
      ? styles.panelInfo
      : variant === 'warning'
        ? styles.panelWarning
        : variant === 'success'
          ? styles.panelSuccess
          : styles.panelDefault;

  const iconColor =
    variant === 'warning'
      ? colors.warning
      : variant === 'success'
        ? colors.success
        : variant === 'info'
          ? colors.info
          : colors.labelSecondary;

  return (
    <View style={[styles.panel, variantStyle]}>
      {title || icon ? (
        <View style={styles.header}>
          {icon ? <Ionicons name={icon} size={16} color={iconColor} /> : null}
          {title ? <Text style={styles.title}>{title}</Text> : null}
        </View>
      ) : null}
      <View style={styles.body}>{children}</View>
    </View>
  );
}

export function CardInfoPanelText({ children }: { children: ReactNode }) {
  const styles = useThemedStyles(({ typography }) => ({
    text: {
      ...typography.subtitle,
      fontSize: 14,
      lineHeight: 20,
    },
  }));

  return <Text style={styles.text}>{children}</Text>;
}
