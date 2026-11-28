import { router, useLocalSearchParams } from 'expo-router';

import { FormScreen } from '@/components/ui/FormScreen';
import { FillInAvailabilityManageView } from '@/components/worker/FillInAvailabilityManageView';
import {
  navigateToWorkerProfileHub,
  WORKER_FILLINS,
} from '@/lib/routing';

export default function FillInAvailabilityScreen() {
  const { returnTo } = useLocalSearchParams<{ returnTo?: string }>();
  const fromProfile = returnTo === 'profile';

  return (
    <FormScreen
      atmosphereAccent="primary"
      accent="primary"
      title="Text alerts"
      subtitle="We’ll text you when a fill-in opens nearby."
      onBack={() => {
        if (fromProfile) {
          navigateToWorkerProfileHub(router);
          return;
        }
        router.replace(WORKER_FILLINS);
      }}>
      <FillInAvailabilityManageView />
    </FormScreen>
  );
}
