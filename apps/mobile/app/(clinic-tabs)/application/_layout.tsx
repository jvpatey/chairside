import { Stack } from 'expo-router';

import { useShellPassThroughStackOptions } from '@/components/navigation/useShellPassThroughStackOptions';

export default function ApplicationLayout() {
  return <Stack screenOptions={useShellPassThroughStackOptions()} />;
}
