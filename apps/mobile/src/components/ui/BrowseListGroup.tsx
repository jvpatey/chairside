import {
  Children,
  cloneElement,
  isValidElement,
  type ReactElement,
  type ReactNode,
} from 'react';
import { StyleSheet, View } from 'react-native';

import { ListGroupItemSeparator } from '@/components/ui/ListGroupItemSeparator';
import { cardShellRadii } from '@/components/ui/cardLayout';
import { browseListRowTextInset } from '@/components/ui/listLayout';
import { colorWithAlpha, spacing, useThemedStyles } from '@/theme';

type BrowseListGroupProps = {
  children: ReactNode;
};

export function BrowseListGroup({ children }: BrowseListGroupProps) {
  const items = Children.toArray(children).filter(Boolean);

  const styles = useThemedStyles(({ colors, isDark }) => ({
    group: {
      backgroundColor: colors.surface,
      borderRadius: cardShellRadii.group,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colorWithAlpha(colors.separator, isDark ? 0.65 : 0.55),
      overflow: 'hidden',
    },
    item: {
      alignSelf: 'stretch',
    },
  }));

  return (
    <View style={styles.group}>
      {items.map((child, index) => (
        <View
          key={isValidElement(child) && child.key != null ? child.key : index}
          style={styles.item}>
          {isValidElement(child) ? child : child}
          {index < items.length - 1 ? (
            <ListGroupItemSeparator inset={browseListRowTextInset(spacing.md)} />
          ) : null}
        </View>
      ))}
    </View>
  );
}
