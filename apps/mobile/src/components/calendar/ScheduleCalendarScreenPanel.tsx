import {
  listClinicCalendarEvents,
  listWorkerCalendarEvents,
  type CalendarEvent,
} from '@chairside/api';
import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';

import { ScheduleCalendarView } from '@/components/calendar/ScheduleCalendarView';
import { parseInitialCalendarDate } from '@/lib/calendarEvents';
import { usePullToRefresh } from '@/hooks/usePullToRefresh';
import { useRefreshOnFocus } from '@/hooks/useRefreshOnFocus';
import {
  getClinicApplicationRoute,
  getWorkerApplicationRoute,
  getWorkerShiftDetailRoute,
} from '@/lib/routing';

type ScheduleCalendarScreenPanelProps = {
  role: 'worker' | 'clinic';
  userId: string | undefined;
  initialDate?: string | null;
  emptyCtaLabel?: string;
  onEmptyCtaPress?: () => void;
  applicationReturnTo?: 'applications-tab' | 'fill-ins-tab' | 'calendar-tab';
  onRefreshStateChange?: (state: { refreshing: boolean; onRefresh: () => void }) => void;
};

export function ScheduleCalendarScreenPanel({
  role,
  userId,
  initialDate,
  emptyCtaLabel,
  onEmptyCtaPress,
  applicationReturnTo = 'calendar-tab',
  onRefreshStateChange,
}: ScheduleCalendarScreenPanelProps) {
  const [selectedDate, setSelectedDate] = useState(() => parseInitialCalendarDate(initialDate));
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (initialDate) {
      setSelectedDate(parseInitialCalendarDate(initialDate));
    }
  }, [initialDate]);

  const load = useCallback(async () => {
    if (!userId) {
      setEvents([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const rows =
        role === 'worker'
          ? await listWorkerCalendarEvents(userId)
          : await listClinicCalendarEvents(userId);
      setEvents(rows);
    } catch {
      setEvents([]);
    } finally {
      setIsLoading(false);
    }
  }, [role, userId]);

  useRefreshOnFocus(load);
  const { refreshing, onRefresh } = usePullToRefresh(load);

  useEffect(() => {
    onRefreshStateChange?.({ refreshing, onRefresh });
  }, [onRefresh, onRefreshStateChange, refreshing]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleEventPress = useCallback(
    (event: CalendarEvent) => {
      if (role === 'worker') {
        if (event.kind === 'confirmed_fill_in' && event.shiftPostId) {
          router.push(getWorkerShiftDetailRoute(event.shiftPostId, 'fill-ins-tab'));
          return;
        }
        router.push(getWorkerApplicationRoute(event.applicationId, applicationReturnTo));
        return;
      }

      router.push(getClinicApplicationRoute(event.applicationId, applicationReturnTo));
    },
    [applicationReturnTo, role],
  );

  return (
    <ScheduleCalendarView
      events={events}
      selectedDate={selectedDate}
      onSelectDate={setSelectedDate}
      onEventPress={handleEventPress}
      isLoading={isLoading}
      role={role}
      emptyCtaLabel={emptyCtaLabel}
      onEmptyCtaPress={onEmptyCtaPress}
    />
  );
}
