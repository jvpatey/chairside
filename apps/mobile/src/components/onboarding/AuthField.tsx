import { useRef, useState, type ReactNode } from 'react';
import {
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
  type NativeSyntheticEvent,
  type TextInputFocusEventData,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useFormScroll } from '@/components/onboarding/OnboardingShell';
import {
  webHover,
  webIconButtonHoverStyles,
  webPointer,
} from '@/lib/webPressableStyles';
import { useTheme, useThemedStyles } from '@/theme';

type AuthFieldProps = {
  label: string;
  placeholder: string;
  value: string;
  onChangeText: (text: string) => void;
  secureTextEntry?: boolean;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  autoComplete?: 'email' | 'password' | 'username' | 'current-password' | 'new-password' | 'off';
  keyboardType?: 'default' | 'email-address' | 'phone-pad' | 'numeric' | 'number-pad' | 'url';
  editable?: boolean;
  multiline?: boolean;
  onFocus?: (event: NativeSyntheticEvent<TextInputFocusEventData>) => void;
  onBlur?: () => void;
  validated?: boolean;
  invalid?: boolean;
  enablePasswordVisibilityToggle?: boolean;
  trailingAccessory?: ReactNode;
};

export function AuthField({
  label,
  placeholder,
  value,
  onChangeText,
  secureTextEntry,
  autoCapitalize = 'none',
  autoComplete,
  keyboardType = 'default',
  editable = true,
  multiline = false,
  onFocus,
  onBlur,
  validated = false,
  invalid = false,
  enablePasswordVisibilityToggle = false,
  trailingAccessory,
}: AuthFieldProps) {
  const { colors } = useTheme();
  const [passwordVisible, setPasswordVisible] = useState(false);
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
      ...(Platform.OS === 'web' ? { overflow: 'hidden' as const } : {}),
    },
    inputRowValidated: {
      borderColor: colors.success,
    },
    inputRowInvalid: {
      borderColor: colors.destructive,
    },
    input: {
      flex: 1,
      fontSize: typography.body.fontSize,
      fontWeight: '400',
      paddingHorizontal: spacing.md,
      paddingVertical: Platform.OS === 'ios' ? 14 : 10,
      color: colors.labelPrimary,
      minHeight: multiline ? 120 : 50,
      ...(Platform.OS === 'web'
        ? {
            backgroundColor: 'transparent',
            outlineStyle: 'none' as const,
            borderWidth: 0,
          }
        : {}),
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
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      paddingRight: spacing.md,
    },
    visibilityButton: {
      minWidth: 44,
      minHeight: 44,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 8,
      ...webPointer(),
    },
    visibilityButtonHovered: webIconButtonHoverStyles(colors),
  }));

  const isSecure = Boolean(secureTextEntry) && !passwordVisible;

  const handleFocus = (event: NativeSyntheticEvent<TextInputFocusEventData>) => {
    onFocus?.(event);
    scrollWrapIntoView(wrapRef.current);
  };

  const visibilityToggle =
    enablePasswordVisibilityToggle && secureTextEntry ? (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={passwordVisible ? 'Hide password' : 'Show password'}
        hitSlop={8}
        style={({ pressed, hovered }) => [
          styles.visibilityButton,
          webHover(hovered, pressed, styles.visibilityButtonHovered),
          pressed && { opacity: 0.75 },
        ]}
        onPress={() => setPasswordVisible((visible) => !visible)}>
        <Ionicons
          name={passwordVisible ? 'eye-off-outline' : 'eye-outline'}
          size={22}
          color={colors.labelSecondary}
        />
      </Pressable>
    ) : null;

  const statusIcon = invalid ? (
    <Ionicons
      name="close-circle"
      size={22}
      color={colors.destructive}
      accessibilityLabel="Invalid"
    />
  ) : validated ? (
    <Ionicons
      name="checkmark-circle"
      size={22}
      color={colors.success}
      accessibilityLabel="Valid"
    />
  ) : null;

  const hasStatus = invalid || validated;
  const trailing =
    trailingAccessory ??
    (visibilityToggle || hasStatus ? (
      <View style={styles.accessory}>
        {visibilityToggle}
        {statusIcon}
      </View>
    ) : null);

  const showTrailing = Boolean(trailing);

  return (
    <View ref={wrapRef} style={styles.wrap} collapsable={false}>
      <Text style={styles.label}>{label}</Text>
      <View
        style={[
          styles.inputRow,
          validated && styles.inputRowValidated,
          invalid && styles.inputRowInvalid,
          !editable && styles.inputRowDisabled,
        ]}>
        <TextInput
          style={[styles.input, !editable && styles.inputDisabled]}
          placeholder={placeholder}
          placeholderTextColor={colors.labelTertiary}
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={isSecure}
          autoCapitalize={autoCapitalize}
          autoComplete={autoComplete}
          keyboardType={keyboardType}
          editable={editable}
          multiline={multiline}
          onFocus={handleFocus}
          onBlur={onBlur}
          accessibilityLabel={label}
        />
        {showTrailing ? trailing : null}
      </View>
    </View>
  );
}
