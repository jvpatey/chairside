import { ScheduleCalendarScreenPanel } from '@/components/calendar/ScheduleCalendarScreenPanel';
import { Screen } from '@/components/ui/Screen';
import { useFocusEffect } from '@react-navigation/native';
import { useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';

import { ClinicLocationScopeChip } from '@/components/clinic/ClinicLocationScopeChip';
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

  const showScopeChip = isGroup && accessibleLocations.length > 1;

  return (
    <Screen
      title="Calendar"
      subtitle="Interviews, confirmed fill-ins, and open fill-ins for your clinic."
      refreshing={refreshState?.refreshing}
      onRefresh={refreshState?.onRefresh}
      headerAccessory={showScopeChip ? <ClinicLocationScopeChip /> : undefined}>
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
