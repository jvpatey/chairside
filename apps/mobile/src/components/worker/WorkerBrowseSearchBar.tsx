import { Ionicons } from '@expo/vector-icons';
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
  placeholder = 'Search',
  accessibilityLabel = 'Search',
}: WorkerBrowseSearchBarProps) {
  const { colors } = useTheme();
  const styles = useThemedStyles(({ spacing, typography, colors }) => ({
    searchWrap: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      backgroundColor: colors.surface,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.separator,
      paddingHorizontal: spacing.md,
      minHeight: 44,
    },
    searchInput: {
      flex: 1,
      minWidth: 0,
      ...typography.body,
      color: colors.labelPrimary,
      padding: 0,
    },
  }));

  return (
    <View style={styles.searchWrap}>
      <Ionicons name="search-outline" size={18} color={colors.labelTertiary} />
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
