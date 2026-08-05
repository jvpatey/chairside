import { Stack } from 'expo-router';

import { useShellPassThroughStackOptions } from '@/components/navigation/useShellPassThroughStackOptions';

export default function ClinicDiscoverLayout() {
  return <Stack screenOptions={useShellPassThroughStackOptions()} />;
}
