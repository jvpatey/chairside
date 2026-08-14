import {
  Children,
  isValidElement,
  type ReactNode,
} from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';

import { ListGroupItemSeparator } from '@/components/ui/ListGroupItemSeparator';
import { cardShellRadii } from '@/components/ui/cardLayout';
import {
  clinicPostingTableGridTemplate,
  type ClinicPostingTableColumn,
} from '@/lib/clinicPostingListDisplay';
import { webOnlyStyle } from '@/lib/webPressableStyles';
import { colorWithAlpha, useThemedStyles } from '@/theme';

type ClinicPostingTableProps = {
  columns: readonly ClinicPostingTableColumn[];
  showHeader?: boolean;
  children: ReactNode;
};

export function ClinicPostingTable({
  columns,
  showHeader = false,
  children,
}: ClinicPostingTableProps) {
  const items = Children.toArray(children).filter(Boolean);
  const gridTemplate = clinicPostingTableGridTemplate(columns);

  const styles = useThemedStyles(({ colors, spacing, isDark }) => ({
    group: {
      backgroundColor: colors.surface,
      borderRadius: cardShellRadii.group,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colorWithAlpha(colors.labelPrimary, isDark ? 0.06 : 0.05),
      overflow: 'hidden',
    },
    header: {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      backgroundColor: colors.backgroundGrouped,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colorWithAlpha(colors.labelPrimary, isDark ? 0.06 : 0.05),
      ...webOnlyStyle({
        display: 'grid',
        gridTemplateColumns: gridTemplate,
        alignItems: 'center',
        justifyItems: 'start',
        gap: spacing.md,
        position: 'sticky',
        top: 0,
        zIndex: 1,
      } as const),
    },
    headerLabel: {
      fontSize: 11,
      fontWeight: '600',
      letterSpacing: 0.4,
      textTransform: 'uppercase',
      color: colors.labelTertiary,
    },
    item: {
      alignSelf: 'stretch',
    },
  }));

  return (
    <View style={styles.group}>
      {showHeader && Platform.OS === 'web' ? (
        <View accessibilityRole="header" style={styles.header}>
          {columns.map((column) => (
            <Text key={column.key || 'actions'} style={styles.headerLabel} numberOfLines={1}>
              {column.label}
            </Text>
          ))}
        </View>
      ) : null}
      {items.map((child, index) => (
        <View
          key={isValidElement(child) && child.key != null ? child.key : index}
          style={styles.item}>
          {isValidElement(child) ? child : child}
          {index < items.length - 1 ? <ListGroupItemSeparator /> : null}
        </View>
      ))}
    </View>
  );
}
