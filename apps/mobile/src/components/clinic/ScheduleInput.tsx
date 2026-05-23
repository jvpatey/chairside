import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';

import { ChipSelector } from '@/components/clinic/ChipSelector';
import { TimeRangeInput, type TimeRange } from '@/components/clinic/TimeRangeInput';
import { AuthField } from '@/components/onboarding/AuthField';
import { formatTime12h } from '@/lib/time';
import { useThemedStyles } from '@/theme';

const SCHEDULE_DAY_OPTIONS = [
  { value: 'mon' as const, label: 'Mon' },
  { value: 'tue' as const, label: 'Tue' },
  { value: 'wed' as const, label: 'Wed' },
  { value: 'thu' as const, label: 'Thu' },
  { value: 'fri' as const, label: 'Fri' },
  { value: 'sat' as const, label: 'Sat' },
  { value: 'sun' as const, label: 'Sun' },
] as const;

type ScheduleDay = (typeof SCHEDULE_DAY_OPTIONS)[number]['value'];

const DAY_ORDER: ScheduleDay[] = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

const DAY_LABELS: Record<ScheduleDay, string> = {
  mon: 'Mon',
  tue: 'Tue',
  wed: 'Wed',
  thu: 'Thu',
  fri: 'Fri',
  sat: 'Sat',
  sun: 'Sun',
};

type DaySchedule = TimeRange;

type DaySchedules = Partial<Record<ScheduleDay, DaySchedule>>;

function formatDaySelection(days: ScheduleDay[]): string {
  const indices = days.map((day) => DAY_ORDER.indexOf(day)).sort((a, b) => a - b);
  if (indices.length === 0) return '';

  const groups: [number, number][] = [];
  let start = indices[0];
  let end = indices[0];

  for (let index = 1; index < indices.length; index++) {
    if (indices[index] === end + 1) {
      end = indices[index];
      continue;
    }
    groups.push([start, end]);
    start = indices[index];
    end = indices[index];
  }
  groups.push([start, end]);

  return groups
    .map(([groupStart, groupEnd]) => {
      const startLabel = DAY_LABELS[DAY_ORDER[groupStart]];
      const endLabel = DAY_LABELS[DAY_ORDER[groupEnd]];
      return groupStart === groupEnd ? startLabel : `${startLabel}–${endLabel}`;
    })
    .join(', ');
}

function timeKey(schedule: DaySchedule | undefined): string {
  return `${schedule?.startTime ?? ''}|${schedule?.endTime ?? ''}`;
}

function formatDaySegment(days: ScheduleDay[], schedule: DaySchedule | undefined): string {
  const dayPart = formatDaySelection(days);
  const start = formatTime12h(schedule?.startTime ?? '');
  const end = formatTime12h(schedule?.endTime ?? '');

  if (dayPart && start && end) return `${dayPart} ${start} – ${end}`;
  if (dayPart) return dayPart;
  return '';
}

export function buildScheduleString(
  days: ScheduleDay[],
  daySchedules: DaySchedules,
  notes: string,
): string {
  const activeDays = DAY_ORDER.filter((day) => days.includes(day));
  if (activeDays.length === 0) {
    const notePart = notes.trim();
    return notePart;
  }

  const segments: { days: ScheduleDay[]; schedule: DaySchedule | undefined }[] = [];

  for (const day of activeDays) {
    const schedule = daySchedules[day];
    const last = segments[segments.length - 1];
    const previousDay = last?.days[last.days.length - 1];
    const previousIndex = previousDay ? DAY_ORDER.indexOf(previousDay) : -1;
    const isConsecutive = previousIndex >= 0 && DAY_ORDER.indexOf(day) === previousIndex + 1;
    const sameTimes = last && timeKey(last.schedule) === timeKey(schedule);

    if (last && isConsecutive && sameTimes) {
      last.days.push(day);
    } else {
      segments.push({ days: [day], schedule });
    }
  }

  const parts = segments.map((segment) => formatDaySegment(segment.days, segment.schedule)).filter(Boolean);
  const notePart = notes.trim();
  if (notePart) parts.push(notePart);

  return parts.join(' · ');
}

function sortDays(days: ScheduleDay[]): ScheduleDay[] {
  return [...days].sort((a, b) => DAY_ORDER.indexOf(a) - DAY_ORDER.indexOf(b));
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
  const [days, setDays] = useState<ScheduleDay[]>([]);
  const [daySchedules, setDaySchedules] = useState<DaySchedules>({});
  const [hoursMode, setHoursMode] = useState<HoursMode>('same');
  const [sharedSchedule, setSharedSchedule] = useState<DaySchedule>({ startTime: '', endTime: '' });
  const [notes, setNotes] = useState(initialValue?.trim() ?? '');

  const preview = buildScheduleString(days, daySchedules, notes);

  const styles = useThemedStyles(({ colors, spacing, typography }) => ({
    wrap: {
      gap: spacing.md,
    },
    section: {
      gap: spacing.sm,
    },
    label: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.labelSecondary,
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

  const applySharedScheduleToDays = (schedule: DaySchedule, selectedDays: ScheduleDay[]) => {
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

        const dayIndex = DAY_ORDER.indexOf(day);
        const templateDay = [...sortedDays]
          .filter((candidate) => DAY_ORDER.indexOf(candidate) < dayIndex)
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
      const firstDay = DAY_ORDER.find((day) => days.includes(day));
      const nextShared = firstDay
        ? (daySchedules[firstDay] ?? sharedSchedule)
        : sharedSchedule;
      setSharedSchedule(nextShared);
      applySharedScheduleToDays(nextShared, days);
    }
  };

  const handleDayScheduleChange = (day: ScheduleDay, schedule: DaySchedule) => {
    setDaySchedules((current) => ({ ...current, [day]: schedule }));
  };

  const effectiveSharedSchedule =
    days.length === 1 && days[0] ? (daySchedules[days[0]] ?? sharedSchedule) : sharedSchedule;

  const handleEffectiveSharedScheduleChange = (schedule: DaySchedule) => {
    setSharedSchedule(schedule);
    applySharedScheduleToDays(schedule, days);
  };

  useEffect(() => {
    onChange(preview);
  }, [preview, onChange]);

  return (
    <View style={styles.wrap}>
      <View style={styles.section}>
        <Text style={styles.label}>Days (optional)</Text>
        <ChipSelector
          options={SCHEDULE_DAY_OPTIONS}
          selected={days}
          multiple
          onChange={(value) => handleDaysChange(value as ScheduleDay[])}
        />
      </View>

      {days.length > 0 ? (
        <View style={styles.section}>
          <Text style={styles.label}>Hours (optional)</Text>
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
                {DAY_ORDER.filter((day) => days.includes(day)).map((day) => (
                  <TimeRangeInput
                    key={day}
                    rowLabel={DAY_LABELS[day]}
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
