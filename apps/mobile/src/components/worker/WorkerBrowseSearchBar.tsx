import { TextInput, View } from 'react-native';

import { useTheme, useThemedStyles } from '@/theme';

type WorkerBrowseSearchBarProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  accessibilityLabel?: string;
};

export function WorkerBrowseSearchBar({
  value,
  onChange,
  placeholder = 'Search by clinic, role, city, or pay',
  accessibilityLabel = 'Search listings',
}: WorkerBrowseSearchBarProps) {
  const { colors } = useTheme();
  const styles = useThemedStyles(({ spacing, typography, colors }) => ({
    searchWrap: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.separator,
      paddingHorizontal: spacing.md,
      minHeight: 44,
      justifyContent: 'center',
    },
    searchInput: {
      ...typography.body,
      color: colors.labelPrimary,
      padding: 0,
    },
  }));

  return (
    <View style={styles.searchWrap}>
      <TextInput
        accessibilityLabel={accessibilityLabel}
        placeholder={placeholder}
        placeholderTextColor={colors.labelTertiary}
        style={styles.searchInput}
        value={value}
        onChangeText={onChange}
        autoCapitalize="none"
        autoCorrect={false}
        clearButtonMode="while-editing"
      />
    </View>
  );
}
