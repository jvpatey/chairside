import type { CalendarEvent } from '@chairside/api';
import { useMemo } from 'react';
import { View } from 'react-native';

import { ScheduleAgendaList } from '@/components/calendar/ScheduleEventCard';
import { ScheduleCalendarPanel } from '@/components/calendar/ScheduleCalendarPanel';
import { PageLoadingList } from '@/components/ui/PageLoadingState';
import {
  getDayIndicators,
  getEventsForDate,
  groupEventsByDate,
} from '@/lib/calendarEvents';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';
import { useThemedStyles } from '@/theme';

type ScheduleCalendarViewProps = {
  events: CalendarEvent[];
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
  onEventPress: (event: CalendarEvent) => void;
  isLoading?: boolean;
  role: 'worker' | 'clinic';
  emptyCtaLabel?: string;
  onEmptyCtaPress?: () => void;
};

export function ScheduleCalendarView({
  events,
  selectedDate,
  onSelectDate,
  onEventPress,
  isLoading = false,
  role,
  emptyCtaLabel,
  onEmptyCtaPress,
}: ScheduleCalendarViewProps) {
  const { isWide } = useResponsiveLayout();
  const styles = useThemedStyles(({ spacing }) => ({
    wrap: {
      gap: spacing.lg,
    },
    twoColumn: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: spacing.lg,
    },
    calendarColumn: {
      flex: isWide ? 1 : undefined,
      width: isWide ? undefined : '100%',
    },
    agendaColumn: {
      flex: isWide ? 1 : undefined,
      width: isWide ? undefined : '100%',
      minWidth: isWide ? 280 : undefined,
    },
  }));

  const eventDateKeys = useMemo(() => new Set(events.map((event) => event.dateKey)), [events]);

  const eventIndicatorsByDate = useMemo(() => {
    const grouped = groupEventsByDate(events);
    const map = new Map<string, { hasInterview: boolean; hasConfirmedFillIn: boolean }>();
    for (const [dateKey, dayEvents] of grouped) {
      const parsed = new Date(`${dateKey}T12:00:00`);
      map.set(dateKey, getDayIndicators(dayEvents, parsed));
    }
    return map;
  }, [events]);

  const selectedDayEvents = useMemo(
    () => getEventsForDate(events, selectedDate),
    [events, selectedDate],
  );

  if (isLoading) {
    return <PageLoadingList rowCount={3} message="Loading schedule…" />;
  }

  const calendarPanel = (
    <ScheduleCalendarPanel
      selectedDate={selectedDate}
      onSelectDate={onSelectDate}
      eventDateKeys={eventDateKeys}
      eventIndicatorsByDate={eventIndicatorsByDate}
    />
  );

  const agendaList = (
    <ScheduleAgendaList
      events={selectedDayEvents}
      selectedDate={selectedDate}
      onEventPress={onEventPress}
      emptyTitle="Nothing scheduled for this day"
      emptyMessage={
        role === 'worker'
          ? 'Confirmed fill-ins and scheduled interviews will appear here.'
          : 'Confirmed fill-ins and scheduled interviews for your clinic will appear here.'
      }
      emptyCtaLabel={emptyCtaLabel}
      onEmptyCtaPress={onEmptyCtaPress}
    />
  );

  if (isWide) {
    return (
      <View style={[styles.wrap, styles.twoColumn]}>
        <View style={styles.calendarColumn}>{calendarPanel}</View>
        <View style={styles.agendaColumn}>{agendaList}</View>
      </View>
    );
  }

  return (
    <View style={styles.wrap}>
      <View style={styles.calendarColumn}>{calendarPanel}</View>
      <View style={styles.agendaColumn}>{agendaList}</View>
    </View>
  );
}
