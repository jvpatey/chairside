import { ScheduleCalendarScreenPanel } from '@/components/calendar/ScheduleCalendarScreenPanel';
import { Screen } from '@/components/ui/Screen';
import { useAuth } from '@/contexts/AuthContext';
import { useFocusEffect } from '@react-navigation/native';
import { useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';

export default function ClinicCalendarScreen() {
  const { user } = useAuth();
  const params = useLocalSearchParams<{ date?: string }>();
  const [refreshState, setRefreshState] = useState<{
    refreshing: boolean;
    onRefresh: () => void;
  } | null>(null);

  useFocusEffect(
    useCallback(() => {
      return () => setRefreshState(null);
    }, []),
  );

  return (
    <Screen
      title="Calendar"
      subtitle="Interviews and confirmed fill-ins for your clinic."
      refreshing={refreshState?.refreshing}
      onRefresh={refreshState?.onRefresh}>
      <ScheduleCalendarScreenPanel
        role="clinic"
        userId={user?.id}
        initialDate={typeof params.date === 'string' ? params.date : undefined}
        applicationReturnTo="calendar-tab"
        onRefreshStateChange={setRefreshState}
      />
    </Screen>
  );
}
