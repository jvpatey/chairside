import { router } from 'expo-router';

import { FormScreen } from '@/components/ui/FormScreen';
import { FillInAvailabilityManageView } from '@/components/worker/FillInAvailabilityManageView';
import { WORKER_FILLINS } from '@/lib/routing';

export default function FillInAvailabilityScreen() {
  return (
    <FormScreen
      atmosphereAccent="secondary"
      accent="secondary"
      title="Fill-in availability"
      subtitle="Alerts, outreach, and your available days."
      onBack={() => router.replace(WORKER_FILLINS)}
    >
      <FillInAvailabilityManageView />
    </FormScreen>
  );
}
