import type { CalendarEvent } from '@chairside/api';
import { useMemo } from 'react';
import { View } from 'react-native';

import { ScheduleAgendaList } from '@/components/calendar/ScheduleEventCard';
import { ScheduleCalendarPanel } from '@/components/calendar/ScheduleCalendarPanel';
import { CalendarSkeleton } from '@/components/ui/skeletons/CalendarSkeleton';
import {
  getDayIndicators,
  getEventsForDate,
  groupEventsByDate,
} from '@/lib/calendarEvents';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';
import { IS_WEB } from '@/lib/webPressableStyles';
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
  const { isTablet } = useResponsiveLayout();
  const useSplit = IS_WEB && isTablet;
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
      flex: useSplit ? 1 : undefined,
      width: useSplit ? undefined : '100%',
      minWidth: 0,
    },
    agendaColumn: {
      flex: useSplit ? 1 : undefined,
      width: useSplit ? undefined : '100%',
      minWidth: 0,
    },
  }));

  const eventDateKeys = useMemo(() => new Set(events.map((event) => event.dateKey)), [events]);

  const eventIndicatorsByDate = useMemo(() => {
    const grouped = groupEventsByDate(events);
    const map = new Map<string, { hasInterview: boolean; hasConfirmedFillIn: boolean; hasOpenFillIn: boolean }>();
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
    return <CalendarSkeleton />;
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
          : 'Confirmed fill-ins, open fill-ins, and scheduled interviews for your clinic will appear here.'
      }
      emptyCtaLabel={emptyCtaLabel}
      onEmptyCtaPress={onEmptyCtaPress}
    />
  );

  if (useSplit) {
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
