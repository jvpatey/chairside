import { Ionicons } from '@expo/vector-icons';
import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { dashboardWidgetTokens } from '@/components/dashboard/dashboardTokens';
import {
  DashboardWidgetIconBadge,
  type DashboardWidgetAccent,
} from '@/components/dashboard/DashboardWidgetIconBadge';
import { useDashboardAsideCompact } from '@/components/dashboard/DashboardAsideCompactContext';
import { fontSemibold, useThemedStyles } from '@/theme';

type DashboardWidgetHeaderProps = {
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  accent?: DashboardWidgetAccent;
  trailing?: ReactNode;
};

/** Consistent header row for dashboard aside widgets. */
export function DashboardWidgetHeader({
  title,
  icon,
  accent = 'primary',
  trailing,
}: DashboardWidgetHeaderProps) {
  const compact = useDashboardAsideCompact();
  const { fontSize, lineHeight } = dashboardWidgetTokens.headerTitle;

  const styles = useThemedStyles(({ colors, spacing }) => ({
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: spacing.sm,
      paddingHorizontal: compact ? spacing.md : spacing.lg,
      paddingVertical: compact ? spacing.sm : spacing.md,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.separator,
    },
    headerLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      flex: 1,
      minWidth: 0,
      flexShrink: 1,
    },
    title: {
      fontSize,
      lineHeight,
      fontFamily: fontSemibold,
      fontWeight: '600',
      color: colors.labelPrimary,
      flexShrink: 1,
    },
    trailing: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      flexShrink: 0,
      marginLeft: spacing.sm,
    },
  }));

  return (
    <View style={styles.header}>
      <View style={styles.headerLeft}>
        <DashboardWidgetIconBadge icon={icon} accent={accent} />
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
      </View>
      {trailing ? <View style={styles.trailing}>{trailing}</View> : null}
    </View>
  );
}
