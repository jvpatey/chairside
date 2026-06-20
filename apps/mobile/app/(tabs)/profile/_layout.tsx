import { Stack } from 'expo-router';
import { Platform } from 'react-native';

import { useTheme } from '@/theme';

export default function ProfileLayout() {
  const { colors } = useTheme();
  const isWeb = Platform.OS === 'web';

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: {
          backgroundColor: isWeb ? colors.backgroundGrouped : 'transparent',
        },
      }}
    />
  );
}
