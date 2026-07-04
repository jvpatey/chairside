import { Stack } from 'expo-router';

import { SetupWebShell } from '@/components/web/setup/SetupWebShell.web';

export default function ClinicSetupLayout() {
  return (
    <SetupWebShell role="clinic">
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="basics" />
        <Stack.Screen name="location" />
        <Stack.Screen name="practice" />
        <Stack.Screen name="about" />
        <Stack.Screen name="review" />
      </Stack>
    </SetupWebShell>
  );
}
