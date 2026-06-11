import type { AvailabilityBlockInput } from '@chairside/api';
import { DAY_OF_WEEK_OPTIONS } from '@chairside/config';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { TimeRangeInput } from '@/components/clinic/TimeRangeInput';
import { ThemedSwitch } from '@/components/ui/ThemedSwitch';
import { normalizeTime24h } from '@/lib/time';
import {
  webHover,
  webListRowHoverStyles,
  webPointer,
} from '@/lib/webPressableStyles';
import { useThemedStyles } from '@/theme';

export type DayAvailability = {
  day_of_week: number;
  enabled: boolean;
  start_time: string;
  end_time: string;
};

export function createDefaultDayAvailability(): DayAvailability[] {
  return DAY_OF_WEEK_OPTIONS.map((day) => ({
    day_of_week: day.value,
    enabled: false,
    start_time: '09:00',
    end_time: '17:00',
  }));
}

export function blocksToDayAvailability(
  blocks: { day_of_week: number; start_time: string; end_time: string }[],
): DayAvailability[] {
  const defaults = createDefaultDayAvailability();
  if (blocks.length === 0) return defaults;

  return defaults.map((day) => {
    const block = blocks.find((item) => item.day_of_week === day.day_of_week);
    if (!block) return { ...day, enabled: false };
    return {
      day_of_week: day.day_of_week,
      enabled: true,
      start_time: normalizeTime24h(block.start_time.slice(0, 5)),
      end_time: normalizeTime24h(block.end_time.slice(0, 5)),
    };
  });
}

export function dayAvailabilityToBlocks(days: DayAvailability[]): AvailabilityBlockInput[] {
  return days
    .filter((day) => day.enabled)
    .map((day) => ({
      day_of_week: day.day_of_week,
      start_time: normalizeTime24h(day.start_time),
      end_time: normalizeTime24h(day.end_time),
    }));
}

type AvailabilityScheduleInputProps = {
  days: DayAvailability[];
  onChange: (days: DayAvailability[]) => void;
};

export function AvailabilityScheduleInput({ days, onChange }: AvailabilityScheduleInputProps) {
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
    times: {
      borderTopWidth: 1,
      borderTopColor: colors.separator,
      paddingTop: spacing.md,
    },
  }));

  const updateDay = (dayOfWeek: number, patch: Partial<DayAvailability>) => {
    onChange(days.map((day) => (day.day_of_week === dayOfWeek ? { ...day, ...patch } : day)));
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
                <Text style={styles.statusLabel}>
                  {day.enabled ? 'Available' : 'Unavailable'}
                </Text>
              </View>
              <View style={styles.switchWrap}>
                <ThemedSwitch
                  value={day.enabled}
                  onValueChange={(enabled) => updateDay(day.day_of_week, { enabled })}
                />
              </View>
            </View>
            {day.enabled ? (
              <View style={styles.times}>
                <TimeRangeInput
                  schedule={{
                    startTime: day.start_time,
                    endTime: day.end_time,
                  }}
                  onChange={(schedule) =>
                    updateDay(day.day_of_week, {
                      start_time: schedule.startTime,
                      end_time: schedule.endTime,
                    })
                  }
                  onPickerOpenChange={(open) => {
                    setPickerOpenDay((current) => {
                      if (open) return day.day_of_week;
                      return current === day.day_of_week ? null : current;
                    });
                  }}
                />
              </View>
            ) : null}
          </Pressable>
        );
      })}
    </View>
  );
}
