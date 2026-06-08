import { Ionicons } from '@expo/vector-icons';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { isSameDay, parseISODate, startOfDay, toISODate } from '@/lib/dates';
import {
  webHover,
  webIconButtonHoverStyles,
  webListRowHoverStyles,
  webPointer,
} from '@/lib/webPressableStyles';
import { useTheme, useThemedStyles } from '@/theme';

const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;

type WebDatePickerPanelProps = {
  value: string;
  min?: string;
  onChange: (isoDate: string) => void;
  onClose?: () => void;
};

function monthStart(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function buildCalendarCells(viewMonth: Date): (Date | null)[] {
  const first = monthStart(viewMonth);
  const leading = first.getDay();
  const daysInMonth = new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 0).getDate();
  const cells: (Date | null)[] = Array.from({ length: leading }, () => null);

  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push(new Date(viewMonth.getFullYear(), viewMonth.getMonth(), day));
  }

  while (cells.length % 7 !== 0) {
    cells.push(null);
  }

  return cells;
}

export function WebDatePickerPanel({ value, min, onChange, onClose }: WebDatePickerPanelProps) {
  const { colors } = useTheme();
  const selectedDate = parseISODate(value) ?? startOfDay(new Date());
  const minDate = min ? parseISODate(min) : null;
  const today = useMemo(() => startOfDay(new Date()), []);
  const [viewMonth, setViewMonth] = useState(() => monthStart(selectedDate));

  useEffect(() => {
    const parsed = parseISODate(value);
    if (parsed) {
      setViewMonth(monthStart(parsed));
    }
  }, [value]);

  const styles = useThemedStyles(({ colors, spacing, typography }) => ({
    panel: {
      marginTop: spacing.sm,
      backgroundColor: colors.surface,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.separator,
      padding: spacing.md,
      gap: spacing.sm,
    },
    monthHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    monthTitle: {
      ...typography.body,
      fontSize: 16,
      fontWeight: '700',
      color: colors.labelPrimary,
    },
    navButton: {
      width: 36,
      height: 36,
      borderRadius: 18,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.fillSubtle,
      ...webPointer(),
    },
    navButtonHovered: webIconButtonHoverStyles(colors),
    navButtonPressed: {
      opacity: 0.75,
    },
    weekdayRow: {
      flexDirection: 'row',
      paddingTop: spacing.xs,
    },
    weekday: {
      flex: 1,
      textAlign: 'center',
      fontSize: 11,
      fontWeight: '700',
      letterSpacing: 0.3,
      textTransform: 'uppercase',
      color: colors.labelSecondary,
    },
    daysGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
    },
    dayCell: {
      width: '14.2857%',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 4,
    },
    dayButton: {
      width: 38,
      height: 38,
      borderRadius: 19,
      alignItems: 'center',
      justifyContent: 'center',
    },
    dayButtonSelected: {
      backgroundColor: colors.primary,
    },
    dayButtonToday: {
      borderWidth: 1,
      borderColor: colors.primary,
    },
    dayButtonDisabled: {
      opacity: 0.35,
    },
    dayButtonHovered: webListRowHoverStyles(colors),
    dayButtonPressed: {
      opacity: 0.85,
    },
    dayText: {
      fontSize: 15,
      fontWeight: '500',
      color: colors.labelPrimary,
    },
    dayTextSelected: {
      color: colors.primaryOnPrimary,
      fontWeight: '700',
    },
    dayTextMuted: {
      color: colors.labelSecondary,
    },
  }));

  const monthLabel = viewMonth.toLocaleDateString(undefined, {
    month: 'long',
    year: 'numeric',
  });
  const cells = buildCalendarCells(viewMonth);

  const isDisabled = (date: Date) => minDate != null && date.getTime() < minDate.getTime();

  return (
    <View style={styles.panel}>
      <View style={styles.monthHeader}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Previous month"
          onPress={() =>
            setViewMonth((current) => new Date(current.getFullYear(), current.getMonth() - 1, 1))
          }
          style={({ pressed, hovered }) => [
            styles.navButton,
            webHover(hovered, pressed, styles.navButtonHovered),
            pressed && styles.navButtonPressed,
          ]}>
          <Ionicons name="chevron-back" size={18} color={colors.labelPrimary} />
        </Pressable>
        <Text style={styles.monthTitle}>{monthLabel}</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Next month"
          onPress={() =>
            setViewMonth((current) => new Date(current.getFullYear(), current.getMonth() + 1, 1))
          }
          style={({ pressed, hovered }) => [
            styles.navButton,
            webHover(hovered, pressed, styles.navButtonHovered),
            pressed && styles.navButtonPressed,
          ]}>
          <Ionicons name="chevron-forward" size={18} color={colors.labelPrimary} />
        </Pressable>
      </View>

      <View style={styles.weekdayRow}>
        {WEEKDAY_LABELS.map((label) => (
          <Text key={label} style={styles.weekday}>
            {label}
          </Text>
        ))}
      </View>

      <View style={styles.daysGrid}>
        {cells.map((date, index) => {
          if (!date) {
            return <View key={`empty-${index}`} style={styles.dayCell} />;
          }

          const selected = isSameDay(date, selectedDate);
          const isToday = isSameDay(date, today);
          const disabled = isDisabled(date);

          return (
            <View key={toISODate(date)} style={styles.dayCell}>
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ selected, disabled }}
                disabled={disabled}
                onPress={() => {
                  onChange(toISODate(date));
                  onClose?.();
                }}
                style={({ pressed, hovered }) => [
                  styles.dayButton,
                  selected && styles.dayButtonSelected,
                  !selected && isToday && styles.dayButtonToday,
                  disabled && styles.dayButtonDisabled,
                  !selected && !disabled && webHover(hovered, pressed, styles.dayButtonHovered),
                  pressed && !disabled && styles.dayButtonPressed,
                ]}>
                <Text
                  style={[
                    styles.dayText,
                    selected && styles.dayTextSelected,
                    !selected && disabled && styles.dayTextMuted,
                  ]}>
                  {date.getDate()}
                </Text>
              </Pressable>
            </View>
          );
        })}
      </View>
    </View>
  );
}
