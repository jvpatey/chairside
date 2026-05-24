import { useRef, type ReactNode } from 'react';
import {
  Platform,
  Text,
  TextInput,
  View,
  type NativeSyntheticEvent,
  type TextInputFocusEventData,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

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
  onBlur?: () => void;
  validated?: boolean;
  trailingAccessory?: ReactNode;
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
  onBlur,
  validated = false,
  trailingAccessory,
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
    inputRow: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.separator,
      borderRadius: 12,
      minHeight: multiline ? 120 : 50,
    },
    inputRowValidated: {
      borderColor: colors.success,
    },
    input: {
      flex: 1,
      fontSize: typography.body.fontSize,
      fontWeight: '400',
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
    },
    inputRowDisabled: {
      backgroundColor: colors.fillSubtle,
    },
    accessory: {
      paddingRight: spacing.md,
    },
    validatedIcon: {
      paddingRight: spacing.md,
    },
  }));

  const handleFocus = (event: NativeSyntheticEvent<TextInputFocusEventData>) => {
    onFocus?.(event);
    scrollWrapIntoView(wrapRef.current);
  };

  const trailing =
    trailingAccessory ??
    (validated ? (
      <Ionicons
        name="checkmark-circle"
        size={22}
        color={colors.success}
        accessibilityLabel="Saved"
      />
    ) : null);

  return (
    <View ref={wrapRef} style={styles.wrap} collapsable={false}>
      <Text style={styles.label}>{label}</Text>
      <View
        style={[
          styles.inputRow,
          validated && styles.inputRowValidated,
          !editable && styles.inputRowDisabled,
        ]}>
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
          onBlur={onBlur}
          accessibilityLabel={label}
        />
        {trailing ? (
          <View style={validated ? styles.validatedIcon : styles.accessory}>{trailing}</View>
        ) : null}
      </View>
    </View>
  );
}
