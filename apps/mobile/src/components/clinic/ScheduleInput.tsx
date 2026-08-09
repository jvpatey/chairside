import { useEffect, useMemo, useState } from 'react';
import { Text, View } from 'react-native';

import { ChipSelector } from '@/components/clinic/ChipSelector';
import { TimeRangeInput, type TimeRange } from '@/components/clinic/TimeRangeInput';
import { AuthField } from '@/components/onboarding/AuthField';
import { FormSectionHeader } from '@/components/ui/FormSectionHeader';
import {
  buildScheduleString,
  parseScheduleString,
  SCHEDULE_DAY_LABELS,
  SCHEDULE_DAY_ORDER,
  type DaySchedules,
  type ScheduleDay,
} from '@/lib/scheduleString';
import { useThemedStyles } from '@/theme';

const SCHEDULE_DAY_OPTIONS = SCHEDULE_DAY_ORDER.map((value) => ({
  value,
  label: SCHEDULE_DAY_LABELS[value],
}));

function sortDays(days: ScheduleDay[]): ScheduleDay[] {
  return [...days].sort((a, b) => SCHEDULE_DAY_ORDER.indexOf(a) - SCHEDULE_DAY_ORDER.indexOf(b));
}

const HOURS_MODE_OPTIONS = [
  { value: 'same' as const, label: 'Same for all days' },
  { value: 'individual' as const, label: 'Different by day' },
] as const;

type HoursMode = (typeof HOURS_MODE_OPTIONS)[number]['value'];

type ScheduleInputProps = {
  onChange: (schedule: string) => void;
  initialValue?: string;
};

export function ScheduleInput({ onChange, initialValue }: ScheduleInputProps) {
  const parsedInitial = useMemo(() => parseScheduleString(initialValue ?? ''), [initialValue]);

  const [days, setDays] = useState<ScheduleDay[]>(() => parsedInitial.days);
  const [daySchedules, setDaySchedules] = useState<DaySchedules>(() => parsedInitial.daySchedules);
  const [hoursMode, setHoursMode] = useState<HoursMode>(() => parsedInitial.hoursMode);
  const [sharedSchedule, setSharedSchedule] = useState<TimeRange>(() => parsedInitial.sharedSchedule);
  const [notes, setNotes] = useState(() =>
    parsedInitial.parsed ? parsedInitial.notes : (initialValue?.trim() ?? ''),
  );

  const preview = buildScheduleString(days, daySchedules, notes);

  const styles = useThemedStyles(({ colors, spacing, typography }) => ({
    wrap: {
      gap: spacing.md,
    },
    section: {
      gap: spacing.sm,
    },
    dayRows: {
      gap: spacing.sm,
    },
    hint: {
      ...typography.subtitle,
      fontSize: 13,
    },
    preview: {
      backgroundColor: colors.fillSubtle,
      borderRadius: 12,
      padding: spacing.md,
      gap: spacing.xs,
    },
    previewLabel: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.labelSecondary,
    },
    previewText: typography.body,
  }));

  const applySharedScheduleToDays = (schedule: TimeRange, selectedDays: ScheduleDay[]) => {
    setDaySchedules((current) => {
      const next = { ...current };
      for (const day of selectedDays) {
        next[day] = { ...schedule };
      }
      return next;
    });
  };

  const handleDaysChange = (nextDays: ScheduleDay[]) => {
    const sortedDays = sortDays(nextDays);
    setDays(sortedDays);
    setDaySchedules((current) => {
      const next: DaySchedules = {};

      for (const day of sortedDays) {
        if (current[day]) {
          next[day] = current[day];
          continue;
        }

        if (hoursMode === 'same') {
          next[day] = { ...sharedSchedule };
          continue;
        }

        const dayIndex = SCHEDULE_DAY_ORDER.indexOf(day);
        const templateDay = [...sortedDays]
          .filter((candidate) => SCHEDULE_DAY_ORDER.indexOf(candidate) < dayIndex)
          .reverse()
          .find((candidate) => current[candidate]);

        next[day] = templateDay
          ? { ...current[templateDay]! }
          : { startTime: '', endTime: '' };
      }

      return next;
    });
  };

  const handleHoursModeChange = (mode: HoursMode) => {
    setHoursMode(mode);

    if (mode === 'same') {
      const firstDay = SCHEDULE_DAY_ORDER.find((day) => days.includes(day));
      const nextShared = firstDay
        ? (daySchedules[firstDay] ?? sharedSchedule)
        : sharedSchedule;
      setSharedSchedule(nextShared);
      applySharedScheduleToDays(nextShared, days);
    }
  };

  const handleDayScheduleChange = (day: ScheduleDay, schedule: TimeRange) => {
    setDaySchedules((current) => ({ ...current, [day]: schedule }));
  };

  const effectiveSharedSchedule =
    days.length === 1 && days[0] ? (daySchedules[days[0]] ?? sharedSchedule) : sharedSchedule;

  const handleEffectiveSharedScheduleChange = (schedule: TimeRange) => {
    setSharedSchedule(schedule);
    applySharedScheduleToDays(schedule, days);
  };

  useEffect(() => {
    onChange(preview);
  }, [preview, onChange]);

  return (
    <View style={styles.wrap}>
      <View style={styles.section}>
        <FormSectionHeader icon="calendar-outline" label="Days (optional)" />
        <ChipSelector
          options={SCHEDULE_DAY_OPTIONS}
          selected={days}
          multiple
          onChange={(value) => handleDaysChange(value as ScheduleDay[])}
        />
      </View>

      {days.length > 0 ? (
        <View style={styles.section}>
          <FormSectionHeader icon="time-outline" label="Hours (optional)" />
          {days.length > 1 ? (
            <ChipSelector
              options={HOURS_MODE_OPTIONS}
              selected={hoursMode}
              onChange={(value) => handleHoursModeChange(value as HoursMode)}
            />
          ) : null}
          {hoursMode === 'same' || days.length === 1 ? (
            <>
              {days.length > 1 ? (
                <Text style={styles.hint}>Same start and end time for every selected day.</Text>
              ) : null}
              <TimeRangeInput
                schedule={effectiveSharedSchedule}
                onChange={handleEffectiveSharedScheduleChange}
              />
            </>
          ) : (
            <>
              <Text style={styles.hint}>Set start and end times for each day.</Text>
              <View style={styles.dayRows}>
                {SCHEDULE_DAY_ORDER.filter((day) => days.includes(day)).map((day) => (
                  <TimeRangeInput
                    key={day}
                    rowLabel={SCHEDULE_DAY_LABELS[day]}
                    schedule={daySchedules[day] ?? { startTime: '', endTime: '' }}
                    onChange={(schedule) => handleDayScheduleChange(day, schedule)}
                  />
                ))}
              </View>
            </>
          )}
        </View>
      ) : null}

      <AuthField
        label="Additional details (optional)"
        placeholder="e.g. alternating Saturdays"
        value={notes}
        onChangeText={setNotes}
        autoCapitalize="sentences"
        icon="document-text-outline"
      />

      {preview ? (
        <View style={styles.preview}>
          <Text style={styles.previewLabel}>Schedule preview</Text>
          <Text style={styles.previewText}>{preview}</Text>
        </View>
      ) : null}
    </View>
  );
}

export { buildScheduleString, parseScheduleString } from '@/lib/scheduleString';
