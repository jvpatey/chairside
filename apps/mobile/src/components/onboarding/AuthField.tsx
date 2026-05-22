import { Text, TextInput, View } from 'react-native';

import { useTheme, useThemedStyles } from '@/theme';

type AuthFieldProps = {
  label: string;
  placeholder: string;
  secureTextEntry?: boolean;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  keyboardType?: 'default' | 'email-address';
  /** When false, field is visible but not editable until auth is wired. */
  editable?: boolean;
};

export function AuthField({
  label,
  placeholder,
  secureTextEntry,
  autoCapitalize = 'none',
  keyboardType = 'default',
  editable = false,
}: AuthFieldProps) {
  const { colors } = useTheme();
  const styles = useThemedStyles(({ colors, spacing, typography }) => ({
    wrap: {
      gap: spacing.xs,
    },
    label: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.labelSecondary,
    },
    input: {
      ...typography.body,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.separator,
      borderRadius: 12,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.md,
      color: colors.labelPrimary,
      minHeight: 50,
    },
    inputDisabled: {
      color: colors.labelTertiary,
      backgroundColor: colors.fillSubtle,
    },
  }));

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={[styles.input, !editable && styles.inputDisabled]}
        placeholder={placeholder}
        placeholderTextColor={colors.labelTertiary}
        secureTextEntry={secureTextEntry}
        autoCapitalize={autoCapitalize}
        keyboardType={keyboardType}
        editable={editable}
        accessibilityLabel={label}
      />
    </View>
  );
}
