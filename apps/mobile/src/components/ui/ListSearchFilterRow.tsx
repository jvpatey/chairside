import type { ReactNode } from 'react';
import { View } from 'react-native';

import { WorkerBrowseSearchBar } from '@/components/worker/WorkerBrowseSearchBar';
import { useThemedStyles } from '@/theme';

type ListSearchFilterRowProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  accessibilityLabel?: string;
  disabled?: boolean;
  filter?: ReactNode;
};

export function ListSearchFilterRow({
  value,
  onChange,
  placeholder = 'Search',
  accessibilityLabel = 'Search',
  disabled = false,
  filter,
}: ListSearchFilterRowProps) {
  const styles = useThemedStyles(({ spacing }) => ({
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    searchField: {
      flex: 1,
      minWidth: 0,
    },
  }));

  return (
    <View style={styles.row}>
      <View style={styles.searchField}>
        <WorkerBrowseSearchBar
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          accessibilityLabel={accessibilityLabel}
          disabled={disabled}
        />
      </View>
      {filter}
    </View>
  );
}
