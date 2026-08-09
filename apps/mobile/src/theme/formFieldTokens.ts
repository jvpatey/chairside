import { Platform, StyleSheet, type TextStyle, type ViewStyle } from 'react-native';

import { fontSemibold } from '@/theme/fonts';
import { radii } from '@/theme/tokens';
import type { Colors } from '@/theme/colors';
import type { GradientAccent } from '@/theme';
import { webOnlyStyle } from '@/lib/webPressableStyles';

export const FORM_CONTENT_MAX_WIDTH = 640;
export const FORM_CONTENT_NARROW_MAX_WIDTH = 560;

type FormFieldTheme = {
  colors: Colors;
  spacing: { xs: number; sm: number; md: number; lg: number };
  typography: { body: TextStyle; label: TextStyle };
};

/** Shared label style — uppercase eyebrow for form field groups. */
export function formFieldLabelStyle({ colors, typography }: FormFieldTheme): TextStyle {
  return {
    ...typography.label,
    fontFamily: fontSemibold,
    fontSize: 13,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    color: colors.labelSecondary,
  };
}

/** Sentence-case label for auth/onboarding forms. */
export function formFieldLabelStylePlain({ colors }: FormFieldTheme): TextStyle {
  return {
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '600',
    fontFamily: fontSemibold,
    color: colors.labelSecondary,
  };
}

export function formFieldInputRowStyle(
  { colors, spacing }: FormFieldTheme,
  options?: { multiline?: boolean },
): ViewStyle {
  return {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.separator,
    borderRadius: radii.md,
    minHeight: options?.multiline ? 120 : 50,
    ...(Platform.OS === 'web' ? { overflow: 'hidden' as const } : {}),
  };
}

export function formAccentColors(colors: Colors, accent: GradientAccent = 'primary') {
  return accent === 'secondary'
    ? { border: colors.secondary, ring: colors.secondarySubtle }
    : { border: colors.primary, ring: colors.primarySubtle };
}

export function formFieldInputRowFocusedStyle(
  { colors }: FormFieldTheme,
  accent: GradientAccent = 'primary',
): ViewStyle {
  const { border, ring } = formAccentColors(colors, accent);
  return {
    borderColor: border,
    borderWidth: 1,
    ...webOnlyStyle({
      boxShadow: `0 0 0 3px ${ring}`,
    } as ViewStyle),
  };
}

export function formFieldInputStyle(
  { colors, spacing, typography }: FormFieldTheme,
  options?: { multiline?: boolean; editable?: boolean },
): TextStyle {
  return {
    flex: 1,
    fontSize: typography.body.fontSize,
    fontWeight: '400',
    paddingHorizontal: spacing.md,
    paddingVertical: Platform.OS === 'ios' ? 14 : 10,
    color: options?.editable === false ? colors.labelTertiary : colors.labelPrimary,
    minHeight: options?.multiline ? 120 : 50,
    ...(Platform.OS === 'web'
      ? ({
          backgroundColor: 'transparent',
          outlineStyle: 'none',
          borderWidth: 0,
        } as unknown as TextStyle)
      : {}),
    ...(options?.multiline
      ? { textAlignVertical: 'top' as const, paddingTop: Platform.OS === 'ios' ? 14 : 12 }
      : Platform.OS === 'android'
        ? { textAlignVertical: 'center' as const }
        : {}),
  } as TextStyle;
}

export function formContentWidthStyle(maxWidth = FORM_CONTENT_MAX_WIDTH): ViewStyle {
  return {
    width: '100%',
    maxWidth,
    alignSelf: 'center' as const,
  };
}
