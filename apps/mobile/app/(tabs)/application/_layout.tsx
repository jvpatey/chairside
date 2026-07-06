import { Stack } from 'expo-router';
import { Platform } from 'react-native';

import { useTheme } from '@/theme';

export default function ApplicationLayout() {
  const { colors } = useTheme();

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: {
          backgroundColor: Platform.OS === 'web' ? 'transparent' : colors.background,
        },
      }}
    />
  );
}
