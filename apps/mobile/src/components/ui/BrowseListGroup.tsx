import { Children, cloneElement, isValidElement, type ReactElement, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { useThemedStyles } from '@/theme';

type BrowseListGroupChildProps = {
  isLast?: boolean;
};

type BrowseListGroupProps = {
  children: ReactNode;
};

export function BrowseListGroup({ children }: BrowseListGroupProps) {
  const items = Children.toArray(children).filter(Boolean);

  const styles = useThemedStyles(({ colors }) => ({
    group: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.separator,
      overflow: 'hidden',
    },
  }));

  return (
    <View style={styles.group}>
      {items.map((child, index) => {
        if (!isValidElement(child)) return child;
        return cloneElement(child as ReactElement<BrowseListGroupChildProps>, {
          isLast: index === items.length - 1,
        });
      })}
    </View>
  );
}
