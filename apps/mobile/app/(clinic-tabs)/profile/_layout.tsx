import { Stack } from 'expo-router';

import { useShellPassThroughStackOptions } from '@/components/navigation/useShellPassThroughStackOptions';

export default function ClinicProfileLayout() {
  return <Stack screenOptions={useShellPassThroughStackOptions()} />;
}
