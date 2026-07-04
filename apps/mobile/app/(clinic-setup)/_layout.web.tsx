import { Stack } from 'expo-router';

import { SetupWebShell } from '@/components/web/setup/SetupWebShell.web';
import { useSetupEditMode } from '@/hooks/useSetupEditMode';

export default function ClinicSetupLayout() {
  const { isEditMode } = useSetupEditMode({ role: 'clinic' });

  const stack = (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="basics" />
      <Stack.Screen name="location" />
      <Stack.Screen name="practice" />
      <Stack.Screen name="about" />
      <Stack.Screen name="review" />
    </Stack>
  );

  if (isEditMode) {
    return stack;
  }

  return <SetupWebShell role="clinic">{stack}</SetupWebShell>;
}
