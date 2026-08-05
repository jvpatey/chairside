import { Stack } from 'expo-router';

import { useShellPassThroughStackOptions } from '@/components/navigation/useShellPassThroughStackOptions';

export default function ProfileLayout() {
  return <Stack screenOptions={useShellPassThroughStackOptions()} />;
}
