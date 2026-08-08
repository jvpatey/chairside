import { DAY_OF_WEEK_OPTIONS } from '@chairside/config';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { TimeRangeInput } from '@/components/clinic/TimeRangeInput';
import { ThemedSwitch } from '@/components/ui/ThemedSwitch';
import type { DayAvailability } from '@/lib/availabilitySchedule';
import {
  webHover,
  webListRowHoverStyles,
  webPointer,
} from '@/lib/webPressableStyles';
import { useTheme, useThemedStyles, type GradientAccent } from '@/theme';

export type { DayAvailability } from '@/lib/availabilitySchedule';
export {
  blocksToDayAvailability,
  createDefaultDayAvailability,
  dayAvailabilityToBlocks,
} from '@/lib/availabilitySchedule';

type AvailabilityScheduleInputProps = {
  days: DayAvailability[];
  onChange: (days: DayAvailability[]) => void;
  accent?: GradientAccent;
};

export function AvailabilityScheduleInput({
  days,
  onChange,
  accent = 'secondary',
}: AvailabilityScheduleInputProps) {
  const { colors } = useTheme();
  const brandColor = accent === 'secondary' ? colors.secondary : colors.primary;
  const [pickerOpenDay, setPickerOpenDay] = useState<number | null>(null);

  const styles = useThemedStyles(({ colors, spacing, typography }) => ({
    wrap: { gap: spacing.md },
    row: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.separator,
      padding: spacing.md,
      gap: spacing.md,
      ...webPointer(),
    },
    rowHovered: webListRowHoverStyles(colors),
    rowPressed: {
      opacity: 0.96,
    },
    switchWrap: {},
    rowHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: spacing.md,
    },
    headerText: { flex: 1, gap: 2 },
    dayLabel: { ...typography.body, fontWeight: '600', color: colors.labelPrimary },
    statusLabel: {
      fontSize: 13,
      color: colors.labelSecondary,
    },
    scheduleSection: {
      borderTopWidth: 1,
      borderTopColor: colors.separator,
      paddingTop: spacing.md,
      gap: spacing.md,
    },
    optionRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: spacing.md,
    },
    optionLabel: {
      ...typography.body,
      fontSize: 15,
      fontWeight: '500',
      color: colors.labelPrimary,
    },
    optionHint: {
      fontSize: 13,
      lineHeight: 18,
      color: colors.labelSecondary,
    },
  }));

  const updateDay = (dayOfWeek: number, patch: Partial<DayAvailability>) => {
    onChange(days.map((day) => (day.day_of_week === dayOfWeek ? { ...day, ...patch } : day)));
  };

  const getStatusLabel = (day: DayAvailability) => {
    if (!day.enabled) return 'Unavailable';
    if (day.all_day) return 'Available · All day';
    return 'Available';
  };

  return (
    <View style={styles.wrap}>
      {days.map((day) => {
        const label = DAY_OF_WEEK_OPTIONS.find((item) => item.value === day.day_of_week)?.label;
        const isPickerOpen = pickerOpenDay === day.day_of_week;
        return (
          <Pressable
            key={day.day_of_week}
            accessibilityRole="none"
            style={({ pressed, hovered }) => [
              styles.row,
              !isPickerOpen && webHover(hovered, pressed, styles.rowHovered),
              pressed && styles.rowPressed,
            ]}>
            <View style={styles.rowHeader}>
              <View style={styles.headerText}>
                <Text style={styles.dayLabel}>{label}</Text>
                <Text
                  style={[
                    styles.statusLabel,
                    day.enabled && { color: brandColor, fontWeight: '600' },
                  ]}>
                  {getStatusLabel(day)}
                </Text>
              </View>
              <View style={styles.switchWrap}>
                <ThemedSwitch
                  value={day.enabled}
                  trackColorTrue={brandColor}
                  onValueChange={(enabled) => updateDay(day.day_of_week, { enabled })}
                />
              </View>
            </View>
            {day.enabled ? (
              <View style={styles.scheduleSection}>
                <View style={styles.optionRow}>
                  <View style={styles.headerText}>
                    <Text style={styles.optionLabel}>All day</Text>
                    <Text style={styles.optionHint}>Available any time on this day</Text>
                  </View>
                  <ThemedSwitch
                    value={day.all_day}
                    trackColorTrue={brandColor}
                    onValueChange={(allDay) => updateDay(day.day_of_week, { all_day: allDay })}
                  />
                </View>
                {day.all_day ? null : (
                  <TimeRangeInput
                    accent={accent}
                    schedule={{
                      startTime: day.start_time,
                      endTime: day.end_time,
                    }}
                    onChange={(schedule) =>
                      updateDay(day.day_of_week, {
                        start_time: schedule.startTime,
                        end_time: schedule.endTime,
                        all_day: false,
                      })
                    }
                    onPickerOpenChange={(open) => {
                      setPickerOpenDay((current) => {
                        if (open) return day.day_of_week;
                        return current === day.day_of_week ? null : current;
                      });
                    }}
                  />
                )}
              </View>
            ) : null}
          </Pressable>
        );
      })}
    </View>
  );
}
