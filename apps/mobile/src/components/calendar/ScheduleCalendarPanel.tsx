import { Ionicons } from '@expo/vector-icons';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import {
  buildCalendarCells,
  monthStart,
} from '@/lib/calendarEvents';
import { isSameDay, startOfDay, toISODate } from '@/lib/dates';
import {
  webHover,
  webIconButtonHoverStyles,
  webListRowHoverStyles,
  webPointer,
} from '@/lib/webPressableStyles';
import { useTheme, useThemedStyles } from '@/theme';

const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;

type ScheduleCalendarPanelProps = {
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
  eventDateKeys: ReadonlySet<string>;
  eventIndicatorsByDate?: ReadonlyMap<
    string,
    { hasInterview: boolean; hasConfirmedFillIn: boolean }
  >;
};

export function ScheduleCalendarPanel({
  selectedDate,
  onSelectDate,
  eventDateKeys,
  eventIndicatorsByDate,
}: ScheduleCalendarPanelProps) {
  const { colors } = useTheme();
  const today = useMemo(() => startOfDay(new Date()), []);
  const [viewMonth, setViewMonth] = useState(() => monthStart(selectedDate));

  useEffect(() => {
    setViewMonth(monthStart(selectedDate));
  }, [selectedDate]);

  const styles = useThemedStyles(({ colors, spacing, typography, radii }) => ({
    panel: {
      backgroundColor: colors.surface,
      borderRadius: radii.lg,
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
    todayButton: {
      alignSelf: 'center',
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.xs,
      borderRadius: radii.pill,
      backgroundColor: colors.fillSubtle,
      ...webPointer(),
    },
    todayButtonHovered: webIconButtonHoverStyles(colors),
    todayButtonPressed: {
      opacity: 0.85,
    },
    todayLabel: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.primary,
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
      minHeight: 52,
      gap: 4,
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
    dayText: {
      fontSize: 15,
      fontWeight: '500',
      color: colors.labelPrimary,
    },
    dayTextSelected: {
      color: colors.primaryOnPrimary,
      fontWeight: '700',
    },
    dotRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 3,
      minHeight: 6,
    },
    dot: {
      width: 6,
      height: 6,
      borderRadius: 3,
    },
    dotInterview: {
      backgroundColor: colors.primary,
    },
    dotFillIn: {
      backgroundColor: colors.success,
    },
    legendRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.md,
      paddingTop: spacing.xs,
    },
    legendItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
    },
    legendLabel: {
      fontSize: 12,
      color: colors.labelSecondary,
    },
  }));

  const monthLabel = viewMonth.toLocaleDateString(undefined, {
    month: 'long',
    year: 'numeric',
  });
  const cells = buildCalendarCells(viewMonth);

  const renderDots = (date: Date) => {
    const dateKey = toISODate(date);
    if (!eventDateKeys.has(dateKey)) {
      return <View style={styles.dotRow} />;
    }

    const indicators = eventIndicatorsByDate?.get(dateKey);

    if (!indicators?.hasInterview && !indicators?.hasConfirmedFillIn) {
      return (
        <View style={styles.dotRow}>
          <View style={[styles.dot, { backgroundColor: colors.labelTertiary }]} />
        </View>
      );
    }

    return (
      <View style={styles.dotRow}>
        {indicators?.hasInterview ? <View style={[styles.dot, styles.dotInterview]} /> : null}
        {indicators?.hasConfirmedFillIn ? <View style={[styles.dot, styles.dotFillIn]} /> : null}
      </View>
    );
  };

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

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Go to today"
        onPress={() => {
          onSelectDate(today);
          setViewMonth(monthStart(today));
        }}
        style={({ pressed, hovered }) => [
          styles.todayButton,
          webHover(hovered, pressed, styles.todayButtonHovered),
          pressed && styles.todayButtonPressed,
        ]}>
        <Text style={styles.todayLabel}>Today</Text>
      </Pressable>

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

          return (
            <View key={toISODate(date)} style={styles.dayCell}>
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ selected }}
                onPress={() => onSelectDate(date)}
                style={({ pressed, hovered }) => [
                  styles.dayButton,
                  selected && styles.dayButtonSelected,
                  !selected && isToday && styles.dayButtonToday,
                  !selected && webHover(hovered, pressed, webListRowHoverStyles(colors)),
                  pressed && { opacity: 0.85 },
                ]}>
                <Text style={[styles.dayText, selected && styles.dayTextSelected]}>
                  {date.getDate()}
                </Text>
              </Pressable>
              {renderDots(date)}
            </View>
          );
        })}
      </View>

      <View style={styles.legendRow}>
        <View style={styles.legendItem}>
          <View style={[styles.dot, styles.dotInterview]} />
          <Text style={styles.legendLabel}>Interview</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.dot, styles.dotFillIn]} />
          <Text style={styles.legendLabel}>Confirmed fill-in</Text>
        </View>
      </View>
    </View>
  );
}
