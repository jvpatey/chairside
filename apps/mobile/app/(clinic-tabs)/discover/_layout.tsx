import { Stack } from 'expo-router';

import { useShellPassThroughStackOptions } from '@/components/navigation/useShellPassThroughStackOptions';

export default function ClinicDiscoverLayout() {
  const screenOptions = useShellPassThroughStackOptions();

  return (
    <Stack screenOptions={screenOptions}>
      <Stack.Screen name="index" />
      <Stack.Screen name="job/[id]" />
      <Stack.Screen name="shift/[id]" />
      <Stack.Screen name="clinic/[id]" />
    </Stack>
  );
}
