import { Ionicons } from '@expo/vector-icons';
import { useCallback, useMemo, useState } from 'react';
import { Pressable, Text, View, type ViewStyle } from 'react-native';

import { WebDatePickerPanel } from '@/components/clinic/WebDatePickerPanel.web';
import { WebTimePickerPanel } from '@/components/clinic/WebTimePickerPanel.web';
import { formatShiftDateLabel, parseISODate } from '@/lib/dates';
import { formatTime12h } from '@/lib/time';
import {
  webHover,
  webListRowHoverStyles,
  webPointer,
} from '@/lib/webPressableStyles';
import { useTheme, useThemedStyles } from '@/theme';

type WebDateFieldProps = {
  label?: string;
  value: string;
  min?: string;
  onChange: (value: string) => void;
  hint?: string;
  placeholder?: string;
  style?: ViewStyle;
};

type WebTimeFieldProps = {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  hint?: string;
  placeholder?: string;
  style?: ViewStyle;
};

function useWebPickerFieldStyles() {
  return useThemedStyles(({ colors, spacing, typography }) => ({
    wrap: { gap: spacing.xs },
    label: {
      fontSize: 13,
      fontWeight: '600' as const,
      color: colors.labelSecondary,
    },
    pickerButton: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.separator,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      ...webPointer(),
    },
    pickerButtonHovered: webListRowHoverStyles(colors),
    pickerButtonActive: {
      borderColor: colors.primary,
      backgroundColor: colors.primarySubtle,
    },
    pickerButtonPressed: {
      opacity: 0.92,
    },
    pickerContent: {
      flex: 1,
      gap: 2,
      minWidth: 0,
    },
    pickerButtonText: {
      ...typography.body,
      fontWeight: '600' as const,
    },
    pickerButtonPlaceholder: {
      ...typography.body,
      color: colors.labelSecondary,
    },
    pickerButtonHint: {
      ...typography.subtitle,
      fontSize: 13,
      color: colors.primary,
      fontWeight: '600' as const,
    },
    iconWrap: {
      width: 34,
      height: 34,
      borderRadius: 17,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.fillSubtle,
    },
    iconWrapActive: {
      backgroundColor: colors.surface,
    },
  }));
}

function normalizeTimeValue(value: string): string {
  if (!value) return '';
  const match = /^(\d{1,2}):(\d{2})/.exec(value.trim());
  if (!match) return value;
  return `${match[1]!.padStart(2, '0')}:${match[2]}`;
}

export function WebDateField({
  label,
  value,
  min,
  onChange,
  hint = 'Tap to change date',
  placeholder = 'Select date',
  style,
}: WebDateFieldProps) {
  const { colors } = useTheme();
  const styles = useWebPickerFieldStyles();
  const [open, setOpen] = useState(false);

  const displayValue = useMemo(() => {
    const parsed = parseISODate(value);
    return parsed ? formatShiftDateLabel(parsed) : null;
  }, [value]);

  const toggleOpen = useCallback(() => {
    setOpen((current) => !current);
  }, []);

  const handleChange = useCallback(
    (nextValue: string) => {
      onChange(nextValue);
      setOpen(false);
    },
    [onChange],
  );

  return (
    <View style={[styles.wrap, style]}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        accessibilityLabel={label ?? 'Date'}
        accessibilityHint={hint}
        onPress={toggleOpen}
        style={({ pressed, hovered }) => [
          styles.pickerButton,
          open && styles.pickerButtonActive,
          webHover(hovered, pressed, styles.pickerButtonHovered),
          pressed && styles.pickerButtonPressed,
        ]}>
        <View style={[styles.iconWrap, open && styles.iconWrapActive]}>
          <Ionicons name="calendar-outline" size={18} color={colors.primary} />
        </View>
        <View style={styles.pickerContent}>
          <Text style={displayValue ? styles.pickerButtonText : styles.pickerButtonPlaceholder}>
            {displayValue ?? placeholder}
          </Text>
          <Text style={styles.pickerButtonHint}>{open ? 'Choose a date below' : hint}</Text>
        </View>
        <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={18} color={colors.labelTertiary} />
      </Pressable>
      {open ? (
        <WebDatePickerPanel value={value} min={min} onChange={handleChange} onClose={() => setOpen(false)} />
      ) : null}
    </View>
  );
}

export function WebTimeField({
  label,
  value,
  onChange,
  hint = 'Tap to change time',
  placeholder = 'Select time',
  style,
}: WebTimeFieldProps) {
  const { colors } = useTheme();
  const styles = useWebPickerFieldStyles();
  const [open, setOpen] = useState(false);
  const normalizedValue = useMemo(() => normalizeTimeValue(value), [value]);

  const displayValue = useMemo(() => {
    if (!normalizedValue) return null;
    return formatTime12h(normalizedValue) ?? normalizedValue;
  }, [normalizedValue]);

  const toggleOpen = useCallback(() => {
    setOpen((current) => !current);
  }, []);

  return (
    <View style={[styles.wrap, style]}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        accessibilityLabel={label ?? 'Time'}
        accessibilityHint={hint}
        onPress={toggleOpen}
        style={({ pressed, hovered }) => [
          styles.pickerButton,
          open && styles.pickerButtonActive,
          webHover(hovered, pressed, styles.pickerButtonHovered),
          pressed && styles.pickerButtonPressed,
        ]}>
        <View style={[styles.iconWrap, open && styles.iconWrapActive]}>
          <Ionicons name="time-outline" size={18} color={colors.primary} />
        </View>
        <View style={styles.pickerContent}>
          <Text style={displayValue ? styles.pickerButtonText : styles.pickerButtonPlaceholder}>
            {displayValue ?? placeholder}
          </Text>
          <Text style={styles.pickerButtonHint}>{open ? 'Adjust time below' : hint}</Text>
        </View>
        <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={18} color={colors.labelTertiary} />
      </Pressable>
      {open ? (
        <WebTimePickerPanel
          value={normalizedValue}
          onChange={onChange}
          onDone={() => setOpen(false)}
        />
      ) : null}
    </View>
  );
}
