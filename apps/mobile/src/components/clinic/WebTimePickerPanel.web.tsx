import { useEffect, useRef, useState, type RefObject } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';

import { defaultStartTimeDate, formatTime24h, parseTime24h } from '@/lib/time';
import { useThemedStyles } from '@/theme';

const HOURS = Array.from({ length: 12 }, (_, index) => index + 1);
const MINUTES = Array.from({ length: 60 }, (_, index) => index);
const PERIODS = ['AM', 'PM'] as const;
const ROW_HEIGHT = 44;

type Period = (typeof PERIODS)[number];

type TimeParts = {
  hour12: number;
  minute: number;
  period: Period;
};

type WebTimePickerPanelProps = {
  value: string;
  onChange: (time: string) => void;
  onDone: () => void;
};

function parseTimeParts(value: string): TimeParts {
  const parsed = parseTime24h(value) ?? defaultStartTimeDate();
  const hours24 = parsed.getHours();
  const minute = parsed.getMinutes();
  const period: Period = hours24 >= 12 ? 'PM' : 'AM';
  const hour12 = hours24 % 12 || 12;
  return { hour12, minute, period };
}

function toTime24({ hour12, minute, period }: TimeParts): string {
  let hours24 = hour12 % 12;
  if (period === 'PM') {
    hours24 += 12;
  }
  return formatTime24h(
    (() => {
      const date = new Date();
      date.setHours(hours24, minute, 0, 0);
      return date;
    })(),
  );
}

function padMinute(minute: number): string {
  return String(minute).padStart(2, '0');
}

type TimeColumnProps<T extends string | number> = {
  label: string;
  values: readonly T[];
  selected: T;
  onSelect: (value: T) => void;
  formatValue: (value: T) => string;
  listRef?: RefObject<ScrollView | null>;
  compact?: boolean;
};

function TimeColumn<T extends string | number>({
  label,
  values,
  selected,
  onSelect,
  formatValue,
  listRef,
  compact = false,
}: TimeColumnProps<T>) {
  const selectedIndex = values.indexOf(selected);
  const listHeight = ROW_HEIGHT * 5;

  const styles = useThemedStyles(({ colors, spacing }) => ({
    column: {
      flex: compact ? 0 : 1,
      minWidth: compact ? 72 : 0,
      flexShrink: compact ? 0 : 1,
    },
    columnLabel: {
      textAlign: 'center',
      fontSize: 11,
      fontWeight: '700',
      letterSpacing: 0.4,
      textTransform: 'uppercase',
      color: colors.labelSecondary,
      marginBottom: spacing.xs,
      minHeight: 16,
    },
    list: {
      height: listHeight,
      borderRadius: 12,
      backgroundColor: colors.fillSubtle,
      overflow: 'hidden',
    },
    scrollList: {
      height: listHeight,
      borderRadius: 12,
      backgroundColor: colors.fillSubtle,
    },
    fixedListInner: {
      paddingTop: 0,
    },
    row: {
      height: ROW_HEIGHT,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: spacing.sm,
    },
    rowSelected: {
      backgroundColor: colors.primarySubtle,
      borderRadius: 10,
      marginHorizontal: spacing.xs,
    },
    rowPressed: {
      opacity: 0.85,
    },
    rowText: {
      fontSize: 18,
      fontWeight: '500',
      color: colors.labelPrimary,
    },
    rowTextSelected: {
      color: colors.primary,
      fontWeight: '700',
    },
  }));

  useEffect(() => {
    if (compact || selectedIndex < 0 || !listRef?.current) return;
    listRef.current.scrollTo({
      y: Math.max(0, selectedIndex * ROW_HEIGHT - ROW_HEIGHT * 2),
      animated: false,
    });
  }, [compact, listRef, selectedIndex]);

  const paddingTop =
    compact && values.length === 2
      ? selectedIndex === 0
        ? ROW_HEIGHT * 2
        : ROW_HEIGHT
      : 0;

  const rows = values.map((item) => {
    const active = item === selected;
    return (
      <Pressable
        key={String(item)}
        accessibilityRole="button"
        accessibilityState={{ selected: active }}
        onPress={() => onSelect(item)}
        style={({ pressed }) => [
          styles.row,
          active && styles.rowSelected,
          pressed && styles.rowPressed,
        ]}>
        <Text style={[styles.rowText, active && styles.rowTextSelected]}>{formatValue(item)}</Text>
      </Pressable>
    );
  });

  return (
    <View style={styles.column}>
      <Text style={styles.columnLabel}>{label}</Text>
      {compact ? (
        <View style={styles.list}>
          <View style={[styles.fixedListInner, { paddingTop }]}>{rows}</View>
        </View>
      ) : (
        <ScrollView
          ref={listRef}
          style={styles.scrollList}
          showsVerticalScrollIndicator={false}
          nestedScrollEnabled>
          {rows}
        </ScrollView>
      )}
    </View>
  );
}

export function WebTimePickerPanel({ value, onChange, onDone }: WebTimePickerPanelProps) {
  const [draft, setDraft] = useState<TimeParts>(() => parseTimeParts(value));
  const hourRef = useRef<ScrollView>(null);
  const minuteRef = useRef<ScrollView>(null);

  useEffect(() => {
    setDraft(parseTimeParts(value));
  }, [value]);

  const styles = useThemedStyles(({ colors, spacing, typography }) => ({
    panel: {
      marginTop: spacing.sm,
      backgroundColor: colors.surface,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.separator,
      padding: spacing.md,
      gap: spacing.md,
    },
    columnsRow: {
      flexDirection: 'row',
      alignItems: 'stretch',
      gap: spacing.sm,
    },
    footer: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      alignItems: 'center',
    },
    doneButton: {
      paddingVertical: spacing.xs,
      paddingHorizontal: spacing.sm,
    },
    doneButtonPressed: {
      opacity: 0.75,
    },
    doneText: {
      ...typography.body,
      fontSize: 15,
      fontWeight: '700',
      color: colors.primary,
    },
    preview: {
      textAlign: 'center',
      fontSize: 28,
      fontWeight: '700',
      color: colors.labelPrimary,
      letterSpacing: -0.3,
    },
    previewPeriod: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.labelSecondary,
    },
  }));

  return (
    <View style={styles.panel}>
      <Text style={styles.preview}>
        {draft.hour12}:{padMinute(draft.minute)}{' '}
        <Text style={styles.previewPeriod}>{draft.period}</Text>
      </Text>

      <View style={styles.columnsRow}>
        <TimeColumn
          label="Hour"
          values={HOURS}
          selected={draft.hour12}
          onSelect={(hour12) => setDraft((current) => ({ ...current, hour12 }))}
          formatValue={(hour) => String(hour)}
          listRef={hourRef}
        />
        <TimeColumn
          label="Min"
          values={MINUTES}
          selected={draft.minute}
          onSelect={(minute) => setDraft((current) => ({ ...current, minute }))}
          formatValue={padMinute}
          listRef={minuteRef}
        />
        <TimeColumn
          label="Period"
          compact
          values={PERIODS}
          selected={draft.period}
          onSelect={(period) => setDraft((current) => ({ ...current, period }))}
          formatValue={(period) => period}
        />
      </View>

      <View style={styles.footer}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Done selecting time"
          onPress={() => {
            onChange(toTime24(draft));
            onDone();
          }}
          style={({ pressed }) => [styles.doneButton, pressed && styles.doneButtonPressed]}>
          <Text style={styles.doneText}>Done</Text>
        </Pressable>
      </View>
    </View>
  );
}
