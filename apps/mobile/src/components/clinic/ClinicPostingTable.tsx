import {
  Children,
  isValidElement,
  type ReactNode,
} from 'react';
import { Platform, StyleSheet, Text, View, type TextStyle, type ViewStyle } from 'react-native';

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
      borderColor: colorWithAlpha(colors.labelPrimary, isDark ? 0.08 : 0.06),
      overflow: 'hidden',
    },
    header: {
      paddingHorizontal: spacing.lg,
      paddingVertical: 10,
      backgroundColor: colors.backgroundGrouped,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colorWithAlpha(colors.labelPrimary, isDark ? 0.06 : 0.05),
      ...webOnlyStyle({
        display: 'grid',
        gridTemplateColumns: gridTemplate,
        alignItems: 'center',
        columnGap: spacing.lg,
        position: 'sticky',
        top: 0,
        zIndex: 1,
      } as const),
    },
    headerLabel: {
      fontSize: 11,
      fontWeight: '600',
      letterSpacing: 0.3,
      textTransform: 'uppercase',
      color: colors.labelTertiary,
      minWidth: 0,
    },
    headerStart: webOnlyStyle({ justifySelf: 'start', textAlign: 'left' } as ViewStyle),
    headerEnd: webOnlyStyle({ justifySelf: 'end', textAlign: 'right' } as ViewStyle),
    item: {
      alignSelf: 'stretch',
    },
  }));

  return (
    <View style={styles.group}>
      {showHeader && Platform.OS === 'web' ? (
        <View accessibilityRole="header" style={styles.header}>
          {columns.map((column) =>
            column.label ? (
              <Text
                key={column.key}
                style={[
                  styles.headerLabel,
                  (column.align === 'end' ? styles.headerEnd : styles.headerStart) as TextStyle,
                ]}
                numberOfLines={1}
              >
                {column.label}
              </Text>
            ) : (
              <View key={column.key || 'actions'} />
            ),
          )}
        </View>
      ) : null}
      {items.map((child, index) => (
        <View
          key={isValidElement(child) && child.key != null ? child.key : index}
          style={styles.item}>
          {isValidElement(child) ? child : child}
          {index < items.length - 1 ? <ListGroupItemSeparator inset={20} /> : null}
        </View>
      ))}
    </View>
  );
}
