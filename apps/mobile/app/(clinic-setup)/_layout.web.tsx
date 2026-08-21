import { Stack } from 'expo-router';

import { SetupWebShell } from '@/components/web/setup/SetupWebShell.web';
import { useSetupEditMode } from '@/hooks/useSetupEditMode';

export default function ClinicSetupLayout() {
  const { returnTo } = useSetupEditMode({ role: 'clinic' });
  // Only profile-edit (returnTo) should drop the wizard shell. Completing
  // setup stamps setup_completed_at and must not remount this layout.
  const isEditMode = Boolean(returnTo);

  const stack = (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="account-type" />
      <Stack.Screen name="basics" />
      <Stack.Screen name="location" />
      <Stack.Screen name="locations" />
      <Stack.Screen name="team" />
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
