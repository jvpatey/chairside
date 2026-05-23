import { useRef } from 'react';
import {
  Platform,
  Text,
  TextInput,
  View,
  type NativeSyntheticEvent,
  type TextInputFocusEventData,
} from 'react-native';

import { useFormScroll } from '@/components/onboarding/OnboardingShell';
import { useTheme, useThemedStyles } from '@/theme';

type AuthFieldProps = {
  label: string;
  placeholder: string;
  value: string;
  onChangeText: (text: string) => void;
  secureTextEntry?: boolean;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  keyboardType?: 'default' | 'email-address' | 'phone-pad' | 'numeric' | 'number-pad' | 'url';
  editable?: boolean;
  multiline?: boolean;
  onFocus?: (event: NativeSyntheticEvent<TextInputFocusEventData>) => void;
};

export function AuthField({
  label,
  placeholder,
  value,
  onChangeText,
  secureTextEntry,
  autoCapitalize = 'none',
  keyboardType = 'default',
  editable = true,
  multiline = false,
  onFocus,
}: AuthFieldProps) {
  const { colors } = useTheme();
  const wrapRef = useRef<View>(null);
  const { scrollWrapIntoView } = useFormScroll();
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
      fontSize: typography.body.fontSize,
      fontWeight: '400',
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.separator,
      borderRadius: 12,
      paddingHorizontal: spacing.md,
      paddingVertical: Platform.OS === 'ios' ? 14 : 10,
      color: colors.labelPrimary,
      minHeight: multiline ? 120 : 50,
      ...(multiline
        ? { textAlignVertical: 'top' as const, paddingTop: Platform.OS === 'ios' ? 14 : 12 }
        : Platform.OS === 'android'
          ? { textAlignVertical: 'center' as const }
          : {}),
    },
    inputDisabled: {
      color: colors.labelTertiary,
      backgroundColor: colors.fillSubtle,
    },
  }));

  const handleFocus = (event: NativeSyntheticEvent<TextInputFocusEventData>) => {
    onFocus?.(event);
    if (multiline) {
      scrollWrapIntoView(wrapRef.current);
    }
  };

  return (
    <View ref={wrapRef} style={styles.wrap} collapsable={false}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={[styles.input, !editable && styles.inputDisabled]}
        placeholder={placeholder}
        placeholderTextColor={colors.labelTertiary}
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={secureTextEntry}
        autoCapitalize={autoCapitalize}
        keyboardType={keyboardType}
        editable={editable}
        multiline={multiline}
        onFocus={handleFocus}
        accessibilityLabel={label}
      />
    </View>
  );
}
