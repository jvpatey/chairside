import { ScheduleCalendarScreenPanel } from '@/components/calendar/ScheduleCalendarScreenPanel';
import { Screen } from '@/components/ui/Screen';
import { useAuth } from '@/contexts/AuthContext';
import { useLocalSearchParams } from 'expo-router';

export default function WorkerCalendarScreen() {
  const { user } = useAuth();
  const params = useLocalSearchParams<{ date?: string }>();

  return (
    <Screen title="Calendar" subtitle="Interviews and confirmed fill-ins on your schedule.">
      <ScheduleCalendarScreenPanel
        role="worker"
        userId={user?.id}
        initialDate={typeof params.date === 'string' ? params.date : undefined}
        applicationReturnTo="calendar-tab"
      />
    </Screen>
  );
}
