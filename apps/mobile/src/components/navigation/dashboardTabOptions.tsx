import { Ionicons } from '@expo/vector-icons';
import type { ColorValue } from 'react-native';

export function getDashboardTabOptions(_isTablet: boolean) {
  return {
    title: 'Home',
    tabBarAccessibilityLabel: 'Home',
    tabBarIcon: ({ color, focused }: { color: ColorValue; focused: boolean }) => (
      <Ionicons name={focused ? 'home' : 'home-outline'} size={22} color={color} />
    ),
  };
}
