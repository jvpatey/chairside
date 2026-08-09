import { useRef, useState, type ReactNode } from 'react';
import {
  Pressable,
  Text,
  TextInput,
  View,
  type NativeSyntheticEvent,
  type TextInputFocusEventData,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useFormScroll } from '@/components/onboarding/OnboardingShell';
import { FormFieldLabel } from '@/components/ui/FormFieldLabel';
import { FormSectionHeader } from '@/components/ui/FormSectionHeader';
import {
  webHover,
  webIconButtonHoverStyles,
  webPointer,
} from '@/lib/webPressableStyles';
import {
  formFieldInputRowFocusedStyle,
  formFieldInputRowStyle,
  formFieldInputStyle,
} from '@/theme/formFieldTokens';
import { useTheme, useThemedStyles } from '@/theme';

type AuthFieldProps = {
  label: string;
  placeholder: string;
  value: string;
  onChangeText: (text: string) => void;
  required?: boolean;
  icon?: React.ComponentProps<typeof Ionicons>['name'];
  hint?: string;
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
  /** Inside ProfileSettingsCard — card header carries the label. */
  embedded?: boolean;
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
  required = false,
  icon,
  hint,
  enablePasswordVisibilityToggle = false,
  trailingAccessory,
  embedded = false,
}: AuthFieldProps) {
  const { colors } = useTheme();
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const wrapRef = useRef<View>(null);
  const { scrollWrapIntoView } = useFormScroll();
  const styles = useThemedStyles((theme) => ({
    wrap: {
      gap: theme.spacing.xs,
    },
    inputRow: formFieldInputRowStyle(theme, { multiline }),
    inputRowValidated: {
      borderColor: theme.colors.success,
    },
    inputRowInvalid: {
      borderColor: theme.colors.destructive,
    },
    inputRowFocused: formFieldInputRowFocusedStyle(theme),
    input: formFieldInputStyle(theme, { multiline, editable }),
    inputDisabled: {
      color: theme.colors.labelTertiary,
    },
    inputRowDisabled: {
      backgroundColor: theme.colors.fillSubtle,
    },
    accessory: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.sm,
      paddingRight: theme.spacing.md,
    },
    visibilityButton: {
      minWidth: 44,
      minHeight: 44,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 8,
      ...webPointer(),
    },
    visibilityButtonHovered: webIconButtonHoverStyles(theme.colors),
  }));

  const isSecure = Boolean(secureTextEntry) && !passwordVisible;

  const handleFocus = (event: NativeSyntheticEvent<TextInputFocusEventData>) => {
    setIsFocused(true);
    onFocus?.(event);
    scrollWrapIntoView(wrapRef.current);
  };

  const handleBlur = () => {
    setIsFocused(false);
    onBlur?.();
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
      {!embedded ? (
        icon ? (
          <FormSectionHeader icon={icon} label={label} required={required} hint={hint} />
        ) : (
          <FormFieldLabel label={label} required={required} />
        )
      ) : null}
      <View
        style={[
          styles.inputRow,
          isFocused && !invalid && !validated && styles.inputRowFocused,
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
          onBlur={handleBlur}
          accessibilityLabel={label}
        />
        {showTrailing ? trailing : null}
      </View>
    </View>
  );
}
