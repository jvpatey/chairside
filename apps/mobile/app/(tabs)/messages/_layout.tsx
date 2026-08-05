import { Stack } from 'expo-router';

import { useShellPassThroughStackOptions } from '@/components/navigation/useShellPassThroughStackOptions';

export default function WorkerMessagesLayout() {
  return <Stack screenOptions={useShellPassThroughStackOptions()} />;
}
