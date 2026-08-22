import {
  listClinicCalendarEvents,
  listWorkerCalendarEvents,
  type CalendarEvent,
} from '@chairside/api';
import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { View } from 'react-native';

import { ScheduleCalendarView } from '@/components/calendar/ScheduleCalendarView';
import { DashboardErrorBanner } from '@/components/dashboard/DashboardErrorBanner';
import { parseInitialCalendarDate } from '@/lib/calendarEvents';
import { usePullToRefresh } from '@/hooks/usePullToRefresh';
import { useRefreshOnFocus } from '@/hooks/useRefreshOnFocus';
import {
  getClinicApplicationRoute,
  getShiftDetailRoute,
  getWorkerApplicationRoute,
} from '@/lib/routing';
import { useThemedStyles } from '@/theme';

type ScheduleCalendarScreenPanelProps = {
  role: 'worker' | 'clinic';
  userId?: string | undefined;
  clinicId?: string | undefined;
  locationIds?: string[] | 'all';
  initialDate?: string | null;
  emptyCtaLabel?: string;
  onEmptyCtaPress?: () => void;
  applicationReturnTo?: 'applications-tab' | 'fill-ins-tab' | 'calendar-tab';
  onRefreshStateChange?: (state: { refreshing: boolean; onRefresh: () => void }) => void;
};

export function ScheduleCalendarScreenPanel({
  role,
  userId,
  clinicId,
  locationIds,
  initialDate,
  emptyCtaLabel,
  onEmptyCtaPress,
  applicationReturnTo = 'calendar-tab',
  onRefreshStateChange,
}: ScheduleCalendarScreenPanelProps) {
  const [selectedDate, setSelectedDate] = useState(() => parseInitialCalendarDate(initialDate));
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const styles = useThemedStyles(({ spacing }) => ({
    root: { gap: spacing.md },
  }));

  useEffect(() => {
    if (initialDate) {
      setSelectedDate(parseInitialCalendarDate(initialDate));
    }
  }, [initialDate]);

  const load = useCallback(async () => {
    const clinicLoadId = clinicId ?? userId;
    if (role === 'worker' ? !userId : !clinicLoadId) {
      setEvents([]);
      setLoadError(false);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setLoadError(false);
    try {
      const rows =
        role === 'worker'
          ? await listWorkerCalendarEvents(userId!)
          : await listClinicCalendarEvents(clinicLoadId!, undefined, {
              locationIds,
            });
      setEvents(rows);
    } catch {
      setEvents([]);
      setLoadError(true);
    } finally {
      setIsLoading(false);
    }
  }, [clinicId, locationIds, role, userId]);

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
        router.push(getWorkerApplicationRoute(event.applicationId!, applicationReturnTo));
        return;
      }

      if (event.kind === 'open_fill_in' && event.shiftPostId) {
        router.push(getShiftDetailRoute(event.shiftPostId, 'fill-ins-tab'));
        return;
      }

      if (event.applicationId) {
        router.push(getClinicApplicationRoute(event.applicationId, applicationReturnTo));
      }
    },
    [applicationReturnTo, role],
  );

  return (
    <View style={styles.root}>
      {loadError ? (
        <DashboardErrorBanner
          message="Could not load your schedule."
          onRetry={() => void load()}
        />
      ) : null}
      <ScheduleCalendarView
        events={events}
        selectedDate={selectedDate}
        onSelectDate={setSelectedDate}
        onEventPress={handleEventPress}
        isLoading={isLoading}
        role={role}
        emptyCtaLabel={loadError ? undefined : emptyCtaLabel}
        onEmptyCtaPress={loadError ? undefined : onEmptyCtaPress}
      />
    </View>
  );
}
