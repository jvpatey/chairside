import { Stack } from 'expo-router';

import { SetupWebShell } from '@/components/web/setup/SetupWebShell.web';

export default function WorkerSetupLayout() {
  return (
    <SetupWebShell role="worker">
      <Stack screenOptions={{ headerShown: false }} />
    </SetupWebShell>
  );
}
