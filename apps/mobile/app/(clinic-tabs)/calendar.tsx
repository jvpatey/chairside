import { ScheduleCalendarScreenPanel } from '@/components/calendar/ScheduleCalendarScreenPanel';
import { Screen } from '@/components/ui/Screen';
import { useFocusEffect } from 'expo-router/react-navigation';
import { useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';

import { ClinicLocationScopeSwitcher } from '@/components/clinic/ClinicLocationScopeSwitcher';
import { useClinicActingContext } from '@/hooks/useClinicActingContext';

export default function ClinicCalendarScreen() {
  const params = useLocalSearchParams<{ date?: string }>();
  const { clinicId, scopedLocationIds, isGroup, accessibleLocations } = useClinicActingContext();
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
      subtitle="Interviews, confirmed fill-ins, and open fill-ins for your clinic."
      refreshing={refreshState?.refreshing}
      onRefresh={refreshState?.onRefresh}
      scopeAccessory={<ClinicLocationScopeSwitcher />}>
      <ScheduleCalendarScreenPanel
        role="clinic"
        clinicId={clinicId ?? undefined}
        locationIds={scopedLocationIds}
        initialDate={typeof params.date === 'string' ? params.date : undefined}
        applicationReturnTo="calendar-tab"
        onRefreshStateChange={setRefreshState}
      />
    </Screen>
  );
}
