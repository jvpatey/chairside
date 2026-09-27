import { Ionicons } from '@expo/vector-icons';
import type { ColorValue } from 'react-native';

export function getDashboardTabOptions(isTablet: boolean) {
  return {
    title: isTablet ? 'Dashboard' : 'Home',
    tabBarAccessibilityLabel: 'Dashboard',
    tabBarIcon: ({ color, focused }: { color: ColorValue; focused: boolean }) => (
      <Ionicons name={focused ? 'home' : 'home-outline'} size={22} color={color} />
    ),
  };
}
