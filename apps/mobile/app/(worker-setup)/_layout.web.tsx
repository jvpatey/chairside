import { Stack } from 'expo-router';

import { SetupWebShell } from '@/components/web/setup/SetupWebShell.web';
import { useSetupEditMode } from '@/hooks/useSetupEditMode';

export default function WorkerSetupLayout() {
  const { isEditMode } = useSetupEditMode({ role: 'worker' });

  if (isEditMode) {
    return <Stack screenOptions={{ headerShown: false }} />;
  }

  return (
    <SetupWebShell role="worker">
      <Stack screenOptions={{ headerShown: false }} />
    </SetupWebShell>
  );
}
